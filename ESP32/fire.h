#ifndef FIRE_H
#define FIRE_H

// =============================================================================
// fire.h — Firebase RTDB using Firebase_ESP_Client + BT coexistence guard
// =============================================================================
// The Firebase_ESP_Client BearSSL crashes when Classic BT is connected because
// BT eats ~25 KB heap and BearSSL can't allocate. Fix: skip all Firebase calls
// when BT has an active client. Firebase resumes when BT disconnects.
//
// For the tamper alert (the critical case): the car is parked and BT is
// disconnected, so Firebase works perfectly for the security alerts.
// =============================================================================

#include <Arduino.h>
#include <WiFi.h>
#include <esp_task_wdt.h>

#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

#include "secrets.h"

extern bool            mobilization;

// ── Timing ───────────────────────────────────────────────────────────────────
#define WIFI_CONNECT_TIMEOUT_MS   10000UL
#define FIREBASE_READ_INTERVAL_MS  5000UL

// ── Firebase objects ──────────────────────────────────────────────────────────
// fbdo:       used for one-shot get/set calls (mobilization check, speed, telemetry).
// streamData: its own connection, kept open for the /controls stream so driving
//             commands push to the ESP32 the instant they're written — no polling
//             wait. Streams need a dedicated FirebaseData object because the
//             connection has to stay open, unlike fbdo's short request/response calls.
static FirebaseData   fbdo;
static FirebaseData   streamData;
static FirebaseAuth   auth;
static FirebaseConfig config;

// ── Flags ────────────────────────────────────────────────────────────────────
static bool firebaseOnline = false;

static inline void _wdtFeed() { esp_task_wdt_reset(); }

// ── Heap safety floor ─────────────────────────────────────────────────────────
// BearSSL handshakes (Firebase) need a decent contiguous chunk of heap. If free
// heap ever drops near this floor, skip Firebase/WiFi work for this cycle
// rather than risk a failed allocation mid-handshake (a common silent-crash
// cause on ESP32). Chosen with margin above BearSSL's typical working set.
#define MIN_SAFE_HEAP_BYTES 15000UL
static inline bool _heapSafe() {
    return ESP.getFreeHeap() > MIN_SAFE_HEAP_BYTES;
}

// ── WiFi reconnect throttle ────────────────────────────────────────────────────
// WiFi.reconnect() must NOT be called on every loop() pass while disconnected —
// loop() can run thousands of times/sec, and hammering the WiFi driver that
// hard causes heap churn and instability. One attempt every few seconds is
// plenty; WiFi.reconnectWiFi(true) (set in initFirebase) already retries
// underneath.
#define WIFI_RECONNECT_INTERVAL_MS 8000UL
static inline void _throttledWifiReconnect() {
    static unsigned long lastAttemptMs = 0;
    unsigned long now = millis();
    if (now - lastAttemptMs >= WIFI_RECONNECT_INTERVAL_MS) {
        lastAttemptMs = now;
        WiFi.reconnect();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
inline void initFirebase() {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.printf("[WiFi] Connecting to '%s'", WIFI_SSID);

    unsigned long wifiStart = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - wifiStart > WIFI_CONNECT_TIMEOUT_MS) {
            Serial.println("\n[WiFi] Timeout — running in OFFLINE mode (BT only).");
            firebaseOnline = false;
            return;
        }
        _wdtFeed();
        delay(500);
        Serial.print(".");
    }
    Serial.println("\n[WiFi] Connected. IP: " + WiFi.localIP().toString());
    // NOTE: modem sleep left ENABLED (not setSleep(false)) on purpose.
    // ESP32 has a single radio shared by WiFi and BLE. Disabling WiFi sleep
    // makes WiFi grab the radio aggressively and starves BLE's connection
    // handshake — the car still shows up when scanning (short adverts still
    // get through) but never pairs. Firebase traffic here is infrequent
    // (5-25s intervals), so the small WiFi latency cost from sleep is a
    // non-issue; BLE driving responsiveness matters far more.
    WiFi.setSleep(true);

    // ── NTP time sync — MUST happen before Firebase generates any token ────
    // Firebase's auth tokens are JWTs checked against the device clock. On a
    // fresh ESP32 boot the clock starts at epoch 0 (1970), so every token
    // looks expired the instant it's issued — this is the #1 cause of the
    // "token is not ready (revoked or expired)" error appearing on every RTDB
    // call right after a successful sign-up. Bounded wait so a flaky NTP
    // server can't hang boot forever; Firebase will still retry later if this
    // times out, just slower.
    Serial.print("[Time] Syncing NTP");
    configTime(0, 0, "pool.ntp.org", "time.google.com");
    time_t nowSecs = time(nullptr);
    unsigned long timeStart = millis();
    while (nowSecs < 8 * 3600 * 2 && millis() - timeStart < 10000UL) {
        _wdtFeed();
        delay(300);
        Serial.print(".");
        nowSecs = time(nullptr);
    }
    Serial.println(nowSecs < 8 * 3600 * 2 ? " timeout (continuing anyway)" : " OK.");

    // Firebase config
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;

    Serial.print("[Firebase] Signing up anonymously...");
    if (Firebase.signUp(&config, &auth, "", "")) {
        Serial.println(" OK.");
    } else {
        Serial.printf(" Failed: %s\n", config.signer.signupError.message.c_str());
        firebaseOnline = false;
        return;
    }

    config.token_status_callback = tokenStatusCallback;

    // Small SSL buffers to coexist with BT
    fbdo.setBSSLBufferSize(1024, 512);
    fbdo.setResponseSize(1024);

    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);

    // ── Bounded wait for the first token to actually be usable ─────────────
    // Token generation runs in a background task inside Firebase.ready().
    // Without this wait, the very first RTDB call made right after setup()
    // (your boot "SAFE" push) races the token and fails even though
    // everything after it works fine.
    Serial.print("[Firebase] Waiting for auth token");
    unsigned long tokenStart = millis();
    while (!Firebase.ready() && millis() - tokenStart < 8000UL) {
        _wdtFeed();
        delay(200);
        Serial.print(".");
    }
    Serial.println(Firebase.ready() ? " ready." : " timeout (will retry in background).");

    firebaseOnline = true;

    // ── Start the /controls stream ─────────────────────────────────────────
    // Small buffers (matches fbdo) since this connection stays open for the
    // life of the sketch — keep its footprint as small as the on-demand one.
    streamData.setBSSLBufferSize(1024, 512);
    if (!Firebase.RTDB.beginStream(&streamData, "/controls")) {
        Serial.printf("[Firebase] /controls stream failed to start: %s (will retry from loop)\n",
                      streamData.errorReason().c_str());
    } else {
        Serial.println("[Firebase] /controls stream started — commands push instantly.");
    }

    Serial.printf("[Firebase] Initialised. Free heap: %u bytes\n", ESP.getFreeHeap());
}

// ── Web Mobilization check ───────────────────────────────────────────────────
inline bool checkWebMobilization() {
    if (!firebaseOnline || !_heapSafe()) return false;
    if (WiFi.status() != WL_CONNECTED) { _throttledWifiReconnect(); return false; }
    if (!Firebase.ready()) return false;

    static unsigned long lastMobCheckMs = 0;
    if (millis() - lastMobCheckMs < 1500UL) return false;
    lastMobCheckMs = millis();

    _wdtFeed();

    // 1. Check /mobilization boolean or string.
    // OPTIMIZATION: the old code always fired the getString() fallback even
    // when getBool() had already succeeded (just returned false). /mobilization
    // is written as one type at a time, so that second call was a wasted
    // round trip through BearSSL — extra heap allocation + network traffic
    // every 1.5s for no benefit. Now the string fallback only runs when the
    // bool read genuinely failed (e.g. the field is stored as a string).
    bool boolReadOk = Firebase.RTDB.getBool(&fbdo, "/mobilization");
    if (boolReadOk) {
        bool mob = fbdo.boolData();
        fbdo.clear();
        if (mob) return true;
    } else {
        fbdo.clear();
    }

    if (!boolReadOk && Firebase.RTDB.getString(&fbdo, "/mobilization")) {
        String s = fbdo.stringData();
        fbdo.clear();
        s.trim();
        s.toLowerCase();
        if (s == "true" || s == "1" || s == "yes") return true;
    } else if (!boolReadOk) {
        fbdo.clear();
    }

    // 2. Check /controls for OFFMOTOR or MOBILIZE or TRUE
    if (Firebase.RTDB.getString(&fbdo, "/controls")) {
        String raw = fbdo.stringData();
        fbdo.clear();
        raw.trim();
        raw.toUpperCase();
        if (raw == "OFFMOTOR" || raw == "MOBILIZE" || raw == "MOBILIZATION_TRUE" || raw == "TRUE") {
            _wdtFeed();
            Firebase.RTDB.setString(&fbdo, "/controls", "IDLE");
            fbdo.clear();
            return true;
        }
    } else {
        fbdo.clear();
    }

    return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reads the open /controls stream. Call every loop() pass, unthrottled — this
// is just draining bytes already sitting on an open connection, not firing a
// fresh network request each time, so it's cheap. Firebase pushes a new event
// the instant /controls changes, instead of the old fixed 5s poll wait.
inline String loopFirebase() {
    if (!firebaseOnline || !_heapSafe()) return "";
    if (WiFi.status() != WL_CONNECTED) { _throttledWifiReconnect(); return ""; }
    if (!Firebase.ready()) return "";

    _wdtFeed();

    if (!Firebase.RTDB.readStream(&streamData)) {
        // Stream dropped (network blip, Firebase idle-timeout, etc.) — try to
        // resume it, throttled so a persistent failure doesn't hammer the radio.
        static unsigned long lastResumeMs = 0;
        if (millis() - lastResumeMs >= 3000UL) {
            lastResumeMs = millis();
            Serial.printf("[Firebase] /controls stream error: %s — resuming...\n",
                          streamData.errorReason().c_str());
            Firebase.RTDB.beginStream(&streamData, "/controls");
        }
        return "";
    }

    if (!streamData.streamAvailable()) return "";
    if (streamData.dataType() != "string") return "";  // ignore null/other writes

    String raw = streamData.stringData();
    raw.trim();
    raw.toUpperCase();
    if (raw.length() == 0 || raw == "IDLE") return "";

    // Reset to IDLE via the separate fbdo (short one-shot call) so the same
    // command isn't reprocessed on the next stream event.
    _wdtFeed();
    Firebase.RTDB.setString(&fbdo, "/controls", "IDLE");
    fbdo.clear();

    return raw;
}

// ─────────────────────────────────────────────────────────────────────────────
inline int fetchWebSpeed() {
    if (!firebaseOnline || !_heapSafe() || !Firebase.ready()) return -1;

    static unsigned long lastMs = 0;
    if (millis() - lastMs < FIREBASE_READ_INTERVAL_MS) return -1;
    lastMs = millis();

    _wdtFeed();
    if (Firebase.RTDB.getInt(&fbdo, "/speed")) {
        int s = fbdo.intData();
        fbdo.clear();
        return (s >= 0 && s <= 100) ? s : -1;
    }
    fbdo.clear();
    return -1;
}

// ─────────────────────────────────────────────────────────────────────────────
inline void sendTelemetry(double lat, double lng, double speed, double rpm, int sats,
                          const String& gsmSig, int sigStrength, int ping,
                          const String& lockStatus, const String& motorStatus,
                          int motorSpeedPct) {
    if (!firebaseOnline || WiFi.status() != WL_CONNECTED || !Firebase.ready()) {
        Serial.println("[Firebase] Offline — telemetry skipped.");
        return;
    }
    if (!_heapSafe()) {
        Serial.printf("[Firebase] Low heap (%u bytes) — telemetry skipped this cycle.\n", ESP.getFreeHeap());
        return;
    }

    char addrBuf[80];
    if (lat != 0.0 || lng != 0.0)
        snprintf(addrBuf, sizeof(addrBuf), "Lat: %.6f, Lng: %.6f", lat, lng);
    else
        snprintf(addrBuf, sizeof(addrBuf), "Awaiting Satellite Lock (%d sats)...", sats);

    // Raw doubles carry floating-point rounding noise (e.g. 12.339999999999999)
    // that Firebase would otherwise store and display verbatim. Round to a
    // clean 2-decimal value before it goes in the JSON.
    double speedRounded = round(speed * 100.0) / 100.0;
    double rpmRounded   = round(rpm   * 100.0) / 100.0;

    FirebaseJson json;
    json.set("gpsLatitude", lat);
    json.set("gpsLongitude", lng);
    json.set("gpsAddress", addrBuf);
    json.set("vehicleSpeed", speedRounded);   // PWM-based estimate — instant, stable at low speed
    json.set("motorRPM", rpmRounded);
    json.set("satellites", sats);
    json.set("gsmSignal", gsmSig);
    json.set("signalStrength", sigStrength);
    json.set("latency", ping);
    json.set("sideLockStatus", lockStatus);
    json.set("motorStatus", motorStatus);
    json.set("motorSpeedPercent", motorSpeedPct);
    json.set("mobilization", mobilization);
    json.set("sentTime", (int)millis());
    json.set("esp32Online", true);

    _wdtFeed();
    if (Firebase.RTDB.setJSON(&fbdo, "/telemetry", &json)) {
        Serial.println("[Firebase] ✓ Telemetry pushed.");
    } else {
        Serial.printf("[Firebase] ✗ Error: %s\n", fbdo.errorReason().c_str());
    }
    fbdo.clear();
                          }

                          // ─────────────────────────────────────────────────────────────────────────────
                          // Clears /mobilization in the DB itself (not just the local variable).
                          // MUST be called on boot alongside pushSideLockStatus("SAFE") — otherwise a
                          // stale /mobilization = true left over from before the reboot gets read back
                          // by checkWebMobilization() a few seconds into loop() and silently flips
                          // mobilization back to true, undoing the boot reset.
                          inline void clearWebMobilization() {
                              if (!firebaseOnline || WiFi.status() != WL_CONNECTED || !Firebase.ready()) {
                                  Serial.println("[Firebase] Offline — /mobilization not cleared.");
                                  return;
                              }
                              _wdtFeed();
                              if (Firebase.RTDB.setBool(&fbdo, "/mobilization", false)) {
                                  Serial.println("[Firebase] ✓ /mobilization → false");
                              } else {
                                  Serial.printf("[Firebase] ✗ /mobilization clear failed: %s\n",
                                                fbdo.errorReason().c_str());
                              }
                              fbdo.clear();
                          }

                          // ─────────────────────────────────────────────────────────────────────────────
                          inline void pushSideLockStatus(const char* status) {
                              if (!firebaseOnline || WiFi.status() != WL_CONNECTED || !Firebase.ready()) {
                                  Serial.printf("[Firebase] Offline — sideLockStatus '%s' not pushed.\n", status);
                                  return;
                              }
                              // NOTE: tamper alerts bypass the BT guard — security is priority.
                              // When tamper fires, the car is parked and BT is likely disconnected.
                              _wdtFeed();
                              if (Firebase.RTDB.setString(&fbdo, "/telemetry/sideLockStatus", String(status))) {
                                  Serial.printf("[Firebase] ✓ sideLockStatus → '%s'\n", status);
                              } else {
                                  Serial.printf("[Firebase] ✗ sideLockStatus push failed: %s\n",
                                                fbdo.errorReason().c_str());
                              }
                              fbdo.clear();
                          }

                          // ── Helper: strip spaces, dashes, brackets from phone numbers ──────────────
                          // OPTIMIZATION: the old version built `clean` via `clean += c` per character,
                          // which reallocs the String's heap buffer repeatedly. Phone numbers are
                          // short and bounded (max E.164 length is 15 digits + '+'), so a fixed stack
                          // buffer removes the heap traffic; the single implicit String construction
                          // at the `return` is the only allocation left, same as before but now it's
                          // one alloc instead of up to ~15.
                          inline String sanitizePhoneNumber(const String& raw) {
                              char buf[20];
                              uint8_t len = 0;
                              for (unsigned int i = 0; i < raw.length() && len < sizeof(buf) - 1; i++) {
                                  char c = raw.charAt(i);
                                  if (isdigit((unsigned char)c) || (c == '+' && len == 0)) {
                                      buf[len++] = c;
                                  }
                              }
                              buf[len] = '\0';
                              return String(buf);
                          }

                          // ─────────────────────────────────────────────────────────────────────────────
                          inline String getEmergencyPhoneNumber() {
                              if (firebaseOnline && Firebase.ready() && WiFi.status() == WL_CONNECTED) {
                                  _wdtFeed();
                                  // Check /settings/emergencyContact1 first (matches RTDB schema)
                                  if (Firebase.RTDB.getString(&fbdo, "/settings/emergencyContact1")) {
                                      String num = fbdo.stringData();
                                      fbdo.clear();
                                      num.trim();
                                      String clean = sanitizePhoneNumber(num);
                                      if (clean.length() > 5) {
                                          Serial.println("[Firebase] Phone fetched (/settings/emergencyContact1): " + clean);
                                          return clean;
                                      }
                                  } else {
                                      fbdo.clear();
                                  }

                                  // Fallback check /settings/phoneNumber
                                  if (Firebase.RTDB.getString(&fbdo, "/settings/phoneNumber")) {
                                      String num = fbdo.stringData();
                                      fbdo.clear();
                                      num.trim();
                                      String clean = sanitizePhoneNumber(num);
                                      if (clean.length() > 5) {
                                          Serial.println("[Firebase] Phone fetched (/settings/phoneNumber): " + clean);
                                          return clean;
                                      }
                                  } else {
                                      fbdo.clear();
                                  }
                              }
                              String fb = sanitizePhoneNumber(EMERGENCY_PHONE_FALLBACK);
                              if (fb.length() > 0) { Serial.println("[Security] Using fallback phone: " + fb); return fb; }
                              Serial.println("[Security] No phone number available");
                              return "";
                          }

                          // ─────────────────────────────────────────────────────────────────────────────
                          // Second emergency contact — used ONLY for the follow-up emergency CALL,
                          // not for SMS. No fallback: if not set in Firebase, second call is skipped.
                          inline String getEmergencyPhoneNumber2() {
                              if (firebaseOnline && Firebase.ready() && WiFi.status() == WL_CONNECTED) {
                                  _wdtFeed();
                                  if (Firebase.RTDB.getString(&fbdo, "/settings/emergencyContact2")) {
                                      String num = fbdo.stringData();
                                      fbdo.clear();
                                      num.trim();
                                      String clean = sanitizePhoneNumber(num);
                                      if (clean.length() > 5) {
                                          Serial.println("[Firebase] Phone fetched (/settings/emergencyContact2): " + clean);
                                          return clean;
                                      }
                                  } else {
                                      fbdo.clear();
                                  }
                              }
                              Serial.println("[Security] No second emergency contact configured");
                              return "";
                          }

                          #endif // FIRE_H