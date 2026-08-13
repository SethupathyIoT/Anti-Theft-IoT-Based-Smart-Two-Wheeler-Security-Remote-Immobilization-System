#ifndef SIM800L_MANAGER_H
#define SIM800L_MANAGER_H

#include <Arduino.h>
#include <HardwareSerial.h>

// ── Hardware ──────────────────────────────────────────────────────────────────
#define SIM_RX_PIN  16
#define SIM_TX_PIN  17
#define SIM_BAUD    9600

// ── Timing constants ──────────────────────────────────────────────────────────
#define SIM_POLL_INTERVAL_MS    5000UL  // How often to query AT+CSQ
#define SIM_RESPONSE_TIMEOUT_MS  200UL  // Max wait for module reply per poll
#define SIM_SMS_CMD_DELAY_MS     200UL  // Inter-command pause for SMS sequence
#define SIM_CALL_SETTLE_MS      5000UL  // Wait after SMS before dialling

// ── State exposed to main sketch (defined in SIM800L_Manager.cpp / .ino) ─────
// All extern — defined exactly once in ESP32_BT_Car.ino.
// OPTIMIZATION: gsmSignal changed from String -> const char*. It only ever
// holds one of a handful of fixed literal values ("GSM Active", "No Signal
// / Searching...", "Module Disconnected", "Initialising..."). A String
// reassigned repeatedly (every 5s poll) triggers a heap free+alloc each
// time; a const char* is just a pointer swap to a literal that already
// lives in flash (.rodata) — zero heap, zero RAM growth. It still converts
// implicitly to String wherever a `const String&` (e.g. sendTelemetry) is
// expected, so no call sites elsewhere need to change.
extern HardwareSerial simSerial;
extern const char*    gsmSignal;
extern int            signalStrength;
extern int            gsmLatency;

// ── Fixed-size response buffer (replaces the old growing String) ─────────────
#define SIM_RESPONSE_BUF_LEN 96

// ── Init ──────────────────────────────────────────────────────────────────────
inline void initSIM800L() {
    simSerial.begin(SIM_BAUD, SERIAL_8N1, SIM_RX_PIN, SIM_TX_PIN);
    Serial.printf("[SIM800L] UART2 on RX=GPIO%d TX=GPIO%d @ %d baud\n",
                  SIM_RX_PIN, SIM_TX_PIN, SIM_BAUD);
}

// ── Non-blocking CSQ poller ───────────────────────────────────────────────────
// Call once per loop(). Sends AT+CSQ every SIM_POLL_INTERVAL_MS and collects
// the response over subsequent calls — no blocking delay().
// OPTIMIZATION: the old `static String response` grew via `response += c`
// for every incoming byte — same reallocation problem as the BT buffer,
// except this one runs on a 5s timer for the whole life of the sketch,
// right alongside the heap-hungry Firebase/BearSSL calls. A fixed char
// buffer removes that heap traffic entirely. strstr()/atoi() replace
// String::indexOf()/substring()/toInt(), which also avoids the temporary
// String objects that substring() used to allocate on every parse.
inline void readSIM800L() {
    static unsigned long lastPollMs   = 0;
    static unsigned long txTimestamp  = 0;
    static bool          waitingReply = false;
    static char          respBuf[SIM_RESPONSE_BUF_LEN];
    static uint8_t        respLen     = 0;

    unsigned long now = millis();

    // ── Phase 1: Time to send a new AT+CSQ? ──────────────────────────────
    if (!waitingReply && (now - lastPollMs >= SIM_POLL_INTERVAL_MS)) {
        lastPollMs = now;

        // Flush any stale bytes
        while (simSerial.available()) simSerial.read();
        respLen      = 0;
        respBuf[0]   = '\0';
        txTimestamp  = now;
        waitingReply = true;
        simSerial.println("AT+CSQ");
        return;   // come back next loop() iteration to collect
    }

    // ── Phase 2: Collect response (non-blocking) ──────────────────────────
    if (!waitingReply) return;

    while (simSerial.available() && respLen < SIM_RESPONSE_BUF_LEN - 1) {
        respBuf[respLen++] = (char)simSerial.read();
        respBuf[respLen]   = '\0';
        if (strstr(respBuf, "OK") != nullptr) break;
    }

    // Still waiting and not timed out
    if (strstr(respBuf, "OK") == nullptr &&
        (now - txTimestamp) < SIM_RESPONSE_TIMEOUT_MS) {
        return;
    }

    // ── Phase 3: Parse ────────────────────────────────────────────────────
    gsmLatency   = (int)(now - txTimestamp);
    waitingReply = false;

    const char* csqPtr = strstr(respBuf, "+CSQ: ");
    if (csqPtr != nullptr) {
        const char* commaPtr = strchr(csqPtr, ',');
        if (commaPtr != nullptr) {
            int rssi = atoi(csqPtr + 6);
            if (rssi == 99) {
                signalStrength = 0;
                gsmSignal      = "No Signal / Searching...";
            } else {
                signalStrength = -113 + (rssi * 2);   // dBm
                gsmSignal      = "GSM Active";
            }
            return;
        }
    }
    // No parseable response
    gsmSignal      = "Module Disconnected";
    signalStrength = 0;
    gsmLatency     = 0;
}

// ── Emergency SMS ─────────────────────────────────────────────────────────────
// Sends a security alert with a Google Maps link.
// Uses short delay()s only for SIM800L command pacing — unavoidable for GSM AT
// protocol, but kept to the documented minimum.
inline void sendEmergencySMS(const String& phoneNumber, double lat, double lng) {
    Serial.println("[SIM800L] Sending emergency SMS...");

    simSerial.println("AT+CMGF=1");
    delay(SIM_SMS_CMD_DELAY_MS);

    simSerial.print("AT+CMGS=\"");
    simSerial.print(phoneNumber);
    simSerial.println("\"");
    delay(SIM_SMS_CMD_DELAY_MS);

    // Build message in a fixed-size buffer — avoids String heap fragmentation
    char msgBuf[200];
    snprintf(msgBuf, sizeof(msgBuf),
             "SECURITY ALERT! Tamper detected! Vehicle LOCKED & IMMOBILISED. "
             "Live location: https://maps.google.com/?q=%.6f,%.6f",
             lat, lng);

    simSerial.print(msgBuf);
    delay(SIM_SMS_CMD_DELAY_MS);

    simSerial.write(26);  // Ctrl+Z — send SMS
    delay(2000);

    Serial.println("[SIM800L] Emergency SMS sent.");
}

// ── Emergency Call ────────────────────────────────────────────────────────────
// Waits for SMS network transfer, then dials. Called after sendEmergencySMS().
inline void makeEmergencyCall(const String& phoneNumber) {
    // Allow network time to complete SMS delivery before tying up the line.
    // This is the one place a blocking delay is hard to avoid; log it clearly.
    Serial.printf("[SIM800L] Pausing %ums for SMS settle before call...\n",
                  (unsigned)SIM_CALL_SETTLE_MS);
    delay(SIM_CALL_SETTLE_MS);

    while (simSerial.available()) simSerial.read();
    simSerial.println("AT");
    delay(500);

    Serial.println("[SIM800L] Dialling owner...");
    simSerial.print("ATD");
    simSerial.print(phoneNumber);
    simSerial.println(";");
    Serial.println("[SIM800L] Call command sent.");
}

// ── Hang up current call ──────────────────────────────────────────────────────
// Used between the two emergency calls — the SIM800L can only hold one call
// at a time, so the first call must be ended before dialling the next contact.
inline void hangUpCall() {
    simSerial.println("AT+CHUP");
    delay(500);
}

#endif // SIM800L_MANAGER_H