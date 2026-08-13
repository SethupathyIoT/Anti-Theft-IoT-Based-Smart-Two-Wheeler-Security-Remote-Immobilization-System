/*
 * ESP32 Modular RC Car
 * WiFi AP+STA (local control + Firebase) + GPS + GSM
 *
 * All module definitions live here (one translation unit).
 * Headers contain only declarations + inline helpers.
 */

#include <Arduino.h>
#include <esp_task_wdt.h>       // Hardware watchdog
#include "MotorDriver.h"
#include "LocalControl.h"
#include "GPS.h"
#include "SIM800L_Manager.h"
#include "fire.h"
#include "Button.h"

// ── Watchdog timeout ──────────────────────────────────────────────────────────
// If loop() stalls longer than this, the ESP32 reboots automatically.
#define WDT_TIMEOUT_SEC 30  // Firebase SSL + GSM delays can take up to ~15s

// ── Hardware Serial & local-control objects (defined here, extern in headers) ─
WebServer localServer(LOCAL_HTTP_PORT);

HardwareSerial  gpsSerial(1);    // UART1 — pins overridden in initGPS()
HardwareSerial  simSerial(2);    // UART2 — pins overridden in initSIM800L()
TinyGPSPlus     gps;

// ── Tamper ISR state (volatile; defined here, extern in Button.h) ─────────────
volatile bool     tamperTriggered = false;
volatile uint32_t tamperRawMs     = 0;

// ── GSM telemetry state (defined here, extern in SIM800L_Manager.h) ──────────
const char* gsmSignal      = "Initialising...";
int         signalStrength = -999;
int         gsmLatency     = 0;

// ── Vehicle state ─────────────────────────────────────────────────────────────
bool   vehicleLocked       = false;
bool   mobilization        = false;       // mobilization status (false on boot)
String sideLockState       = "UNLOCKED";  // Matches vehicleLocked=false at boot
String motorState          = "Idle";      // "Running" when a controller is connected, "Idle" when not
int    currentSpeedPercent = DEFAULT_BOOT_SPEED_PERCENT;  // safe boot speed (30%)
bool   localControlKilled  = false;

// ── GPS telemetry (defined here, extern in GPS.h) ─────────────────────────────
// NOTE: speedKmh here is the raw GPS-derived speed — still used for logging /
// fallback, but the *live gauge* uses motorSpeedKmh/motorRPM below instead,
// since GPS speed is noisy and slow to update at low speed.
double latitude   = 0.0;
double longitude  = 0.0;
double speedKmh   = 0.0;
int    satellites = 0;

// ── PWM-based speed/RPM estimate (defined here, extern in LocalControl.h) ─────
// Recomputed every loop() from currentSpeedPercent + motor moving-state
// (MotorDriver.h) — instant, no GPS wait, and doesn't get noisy at low speed.
double motorSpeedKmh = 0.0;
double motorRPM      = 0.0;

// ── Telemetry push timer ──────────────────────────────────────────────────────
unsigned long lastFirebasePush = 0;
const unsigned long PUSH_INTERVAL_MS = 25000UL;  // 25 sec (tamper still pushes instantly)

// ── Instant telemetry on local driving commands ────────────────────────────────
// LocalControl.h sets this true whenever the web page sends a drive/lock
// command, so the Firebase dashboard reflects it almost immediately instead
// of waiting up to PUSH_INTERVAL_MS. Throttled below so rapid button taps
// don't hammer Firebase/BearSSL.
volatile bool telemetryDirty = false;
const unsigned long TELEMETRY_INSTANT_MIN_INTERVAL_MS = 800UL;
unsigned long lastInstantPushMs = 0;

// ── Shared "kill local control permanently" helper ────────────────────────────
inline void killLocalControlPermanently() {
    if (localControlKilled) return;
    stopLocalControl();
}

// =============================================================================
void setup() {
    Serial.begin(115200);
    delay(300);

    Serial.println("\n=====================================================");
    Serial.println("  ESP32 Modular RC Car: WiFi AP+STA + GPS + GSM + Firebase  ");
    Serial.println("=====================================================");

    // ── Hardware watchdog (ESP32 Arduino Core 3.x API) ───────────────────
    esp_task_wdt_config_t wdtConfig = {
        .timeout_ms     = WDT_TIMEOUT_SEC * 1000,
        .idle_core_mask = 0,   // don't watch idle tasks
        .trigger_panic  = true // reboot on timeout
    };
    esp_task_wdt_reconfigure(&wdtConfig); // reconfigure existing WDT (IDF 5.x)
    esp_task_wdt_add(NULL);              // watch the Arduino main task
    Serial.printf("[WDT] Watchdog set to %d seconds.\n", WDT_TIMEOUT_SEC);

    sideLockState.reserve(16);
    motorState.reserve(16);

    // ── WiFi mode: must be set before BOTH initFirebase() (STA) and
    //    initLocalControl() (AP) — set once, here, up front. ─────────────
    WiFi.mode(WIFI_AP_STA);

    // ── Firebase FIRST: connect and push boot state before anything else ──
    // Boot = manual reset by owner → report vehicle is SAFE & mobilization=false,
    // and do it before touching motors/GPS/SIM800L/button so the DB reflects
    // a safe boot state as early as possible, ahead of other init work.
    initFirebase();
    sideLockState = "SAFE";
    mobilization  = false;
    pushSideLockStatus("SAFE");
    clearWebMobilization();   // clear /mobilization in Firebase itself — see fire.h
    Serial.println("[Security] Boot — sideLockStatus set to SAFE, mobilization = false.");

    // ── Peripherals ───────────────────────────────────────────────────────
    initLocalControl();

    initMotors();
    stopCar();
    initGPS();
    initSIM800L();
    initButton();

    Serial.println("[Init] Setup complete. Entering main loop...\n");
}

// =============================================================================
void loop() {
    // ── Pet watchdog first thing every loop ──────────────────────────────
    esp_task_wdt_reset();

    // ─────────────────────────────────────────────────────────────────────
    // 1a. Drain the /controls stream FIRST, unconditionally — this must
    //     never sit behind a slower one-shot Firebase call (mobilization,
    //     speed), or a command already pushed to us just sits unread.
    // ─────────────────────────────────────────────────────────────────────
    String webCommand = loopFirebase();

    if (webCommand.length() > 0) {
        Serial.printf("[Web CMD] t=%lu ms — Received: '%s'\n", millis(), webCommand.c_str());

        if (webCommand == "OFFMOTOR" || webCommand == "MOBILIZE" || webCommand == "MOBILIZATION_TRUE" || webCommand == "TRUE") {
            // ── Mobilization TRUE: smooth ramp-down stop, then kill local control PERMANENTLY until manual ESP32 reset ─
            stopCarSmooth();   // ~5s gradual deceleration, then fully de-energised
            killLocalControlPermanently();
            mobilization        = true;
            motorState          = "OFF";
            currentSpeedPercent = 0;
            setVehicleLock(true, "WEB_LOCKED");
            Serial.println("[Web CMD] Mobilization = TRUE. Motor OFF + local control killed permanently (requires manual reset).");
            sendTelemetry(latitude, longitude, motorSpeedKmh, motorRPM, satellites,
                          gsmSignal, signalStrength, gsmLatency,
                          sideLockState, motorState, currentSpeedPercent);
        }
        else if (webCommand == "ONMOTOR" || webCommand == "DEMOBILIZE" || webCommand == "FALSE") {
            // ── Web unlock: Updates settings, but local control remains KILLED if localControlKilled is true ──
            if (!localControlKilled) {
                motorState          = "Idle";
                currentSpeedPercent = DEFAULT_BOOT_SPEED_PERCENT;
                setVehicleLock(false, "UNLOCKED");
                mobilization        = false;
                Serial.println("[Web CMD] Vehicle unlocked via web.");
            } else {
                Serial.println("[Web CMD] Vehicle unlocked on web, but local control remains KILLED until manual ESP32 reset!");
            }
        }
        else if (webCommand.length() == 1) {
            // Single-char motor command from web (F/B/L/R/S)
            executeCommand(webCommand.charAt(0));
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // 1b. Firebase: Mobilization check & web speed — heavier, one-shot calls.
    // ─────────────────────────────────────────────────────────────────────
    // These block loop() while they wait on a network round-trip.
    // IMPORTANT: the mobilization (kill-switch) check must NEVER be gated by
    // "is the phone actively driving locally" — otherwise, as long as the
    // local control page keeps polling /status (every 1s), drivingLocally
    // stays true forever and a Firebase mobilization=true write is silently
    // ignored until LOCAL_CONTROL_ACTIVE_WINDOW_MS (5s) of total local
    // silence passes. That's the "5 second delay" — it's not a ramp, it's
    // the check simply never running while you're driving locally.
    // Only the web SPEED sync is skipped locally, so Firebase doesn't fight
    // the local speed slider while you're actively driving on the AP page.
    if (checkWebMobilization()) {
        stopCarSmooth();   // ~5s gradual deceleration, then fully de-energised
        killLocalControlPermanently();
        mobilization        = true;
        motorState          = "OFF";
        currentSpeedPercent = 0;
        setVehicleLock(true, "WEB_LOCKED");
        Serial.println("\n[WEB MOBILIZATION] Mobilization = TRUE! Motors OFF + local control killed permanently (requires manual reset).");
        sendTelemetry(latitude, longitude, motorSpeedKmh, motorRPM, satellites,
                      gsmSignal, signalStrength, gsmLatency,
                      sideLockState, motorState, currentSpeedPercent);
    }

    bool drivingLocally = localControlActive();
    if (!drivingLocally) {
        // Update speed from Firebase if a valid value is available
        int webSpeed = fetchWebSpeed();
        if (webSpeed >= 0) {
            currentSpeedPercent = webSpeed;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. Tamper / Security Alert
    // ─────────────────────────────────────────────────────────────────────
    if (checkTamper()) {
        Serial.println("\n!!! TAMPER DETECTED — SIDE LOCK BUTTON BROKEN !!!");

        // 1. Immobilise the vehicle immediately
        stopCar();
        setVehicleLock(true, "BROKEN");
        motorState          = "IMMOBILISED";
        mobilization        = true;
        currentSpeedPercent = 0;
        killLocalControlPermanently();

        // 2. Push BROKEN to Firebase right now — don't wait for periodic push.
        pushSideLockStatus("BROKEN");

        // 3. Full telemetry snapshot so all fields are current
        sendTelemetry(latitude, longitude, motorSpeedKmh, motorRPM, satellites,
                      gsmSignal, signalStrength, gsmLatency,
                      sideLockState, motorState, currentSpeedPercent);

        // 4. GSM alert — SMS (contact1 only), then CALL (contact1 AND contact2)
        String alertPhone = getEmergencyPhoneNumber();
        if (alertPhone.length() > 0) {
            esp_task_wdt_reset();   // feed before long GSM sequence
            sendEmergencySMS(alertPhone, latitude, longitude);
            esp_task_wdt_reset();   // feed between SMS and call
            makeEmergencyCall(alertPhone);
            esp_task_wdt_reset();   // feed after call returns

            // Also ring the second emergency contact, if one is configured.
            String alertPhone2 = getEmergencyPhoneNumber2();
            if (alertPhone2.length() > 0) {
                hangUpCall();        // end call to contact1 before dialling contact2
                esp_task_wdt_reset();
                makeEmergencyCall(alertPhone2);
                esp_task_wdt_reset();
            }
        } else {
            Serial.println("[Security] No phone number configured — GSM alert skipped.");
        }

        Serial.println("[Security] Tamper handled. Vehicle immobilised. Reset ESP32 to restore.");
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. Normal operations & Engine State
    // ─────────────────────────────────────────────────────────────────────

    // Update Engine / Live status dynamically
    if (sideLockState == "BROKEN") {
        motorState = "IMMOBILISED";
    } else if (localControlKilled || vehicleLocked) {
        motorState = "OFF";
    } else if (localControlActive()) {
        motorState = "Running";
    } else {
        motorState = "Idle";
    }

    // Serve the control page / handle any pending browser request
    handleLocalControl();

    // Serial monitor → motor command (debug / dev)
    if (Serial.available()) {
        char c = (char)Serial.read();   // explicit cast — avoids toupper(int) UB
        executeCommand(c);
    }

    // Sensors
    readGpsSensor();
    readSIM800L();   // non-blocking state machine

    // ── PWM-based speed/RPM estimate — instant, no GPS wait, stable at low speed ──
    motorSpeedKmh = estimateSpeedKmh(currentSpeedPercent);
    motorRPM      = estimateMotorRPM(currentSpeedPercent);

    // ─────────────────────────────────────────────────────────────────────
    // 4. Periodic telemetry push
    // ─────────────────────────────────────────────────────────────────────
    if (millis() - lastFirebasePush >= PUSH_INTERVAL_MS) {
        lastFirebasePush = millis();
        sendTelemetry(latitude, longitude, motorSpeedKmh, motorRPM, satellites,
                      gsmSignal, signalStrength, gsmLatency,
                      sideLockState, motorState, currentSpeedPercent);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 5. Instant telemetry push — fires right after a local drive/lock
    //    command instead of waiting for the 25s periodic push. Throttled to
    //    TELEMETRY_INSTANT_MIN_INTERVAL_MS so rapid button taps don't queue
    //    up a burst of BearSSL/Firebase calls.
    // ─────────────────────────────────────────────────────────────────────
    if (telemetryDirty && (millis() - lastInstantPushMs >= TELEMETRY_INSTANT_MIN_INTERVAL_MS)) {
        telemetryDirty    = false;
        lastInstantPushMs = millis();
        lastFirebasePush  = millis();   // don't also fire the periodic push right after
        sendTelemetry(latitude, longitude, motorSpeedKmh, motorRPM, satellites,
                      gsmSignal, signalStrength, gsmLatency,
                      sideLockState, motorState, currentSpeedPercent);
    }
}
