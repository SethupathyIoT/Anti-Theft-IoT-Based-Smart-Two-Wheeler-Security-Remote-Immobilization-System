#ifndef BUTTON_H
#define BUTTON_H

#include <Arduino.h>

// ── Pin ───────────────────────────────────────────────────────────────────────
#define TAMPER_PIN 4

// ── Debounce ──────────────────────────────────────────────────────────────────
// Minimum ms between two accepted tamper events.
#define TAMPER_DEBOUNCE_MS 300UL

// ── Shared state (defined once in Button.cpp / .ino via extern) ───────────────
// Declared extern here; defined exactly once in ESP32_BT_Car.ino.
extern volatile bool     tamperTriggered;
extern volatile uint32_t tamperRawMs;      // raw millis() stamp set in ISR

// ── ISR ───────────────────────────────────────────────────────────────────────
// Keep the ISR minimal: just capture the timestamp and set the flag.
// millis() itself is not ISR-safe on ESP32 (FreeRTOS tick may be mid-update),
// so we read the SysTick counter directly via esp_timer_get_time() converted
// to ms, which IS safe from ISR context.
void IRAM_ATTR handleTamperInterrupt() {
    // esp_timer_get_time() returns microseconds; divide for ms.
    uint32_t nowMs = (uint32_t)(esp_timer_get_time() / 1000ULL);
    tamperTriggered = true;
    tamperRawMs     = nowMs;
}

inline void initButton() {
    pinMode(TAMPER_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(TAMPER_PIN),
                    handleTamperInterrupt, FALLING);
    Serial.println("[Security] Tamper interrupt attached to GPIO 4 (FALLING)");
}

// ── Call this from loop() ─────────────────────────────────────────────────────
// Returns true once per debounced tamper event, then resets the flag.
// All debounce logic lives here in normal (non-ISR) context.
inline bool checkTamper() {
    if (!tamperTriggered) return false;

    static uint32_t lastAcceptedMs = 0;
    uint32_t eventMs = tamperRawMs;          // snapshot; ISR may update again
    tamperTriggered  = false;                // clear flag first

    if ((eventMs - lastAcceptedMs) < TAMPER_DEBOUNCE_MS) {
        return false;                        // bounce — ignore
    }
    lastAcceptedMs = eventMs;
    return true;
}

#endif // BUTTON_H
