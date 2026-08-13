#ifndef MOTOR_DRIVER_H
#define MOTOR_DRIVER_H

#include <Arduino.h>
#include <esp_task_wdt.h>   // fed during the smooth-stop ramp so it doesn't take 5s off the WDT budget

// ── L298N Pin Definitions ──────────────────────────────────────────────────────
#define ENA 18  // Left  motor speed (PWM)
#define ENB 5   // Right motor speed (PWM)
#define IN1 19
#define IN2 21
#define IN3 22
#define IN4 23

// ── PWM Configuration ──────────────────────────────────────────────────────────
#define PWM_FREQUENCY_HZ    1000   // 1 kHz carrier
#define PWM_RESOLUTION_BITS 8      // 0-255 range
#define PWM_MAX_VALUE       255

// ── Safety: boot speed (0-100 %). Starts conservative; app must ramp up. ───────
#define DEFAULT_BOOT_SPEED_PERCENT 30

// ── Speed / RPM estimation (open-loop, PWM-based) ─────────────────────────────
// No wheel encoder or hall sensor is fitted, so this is NOT a measured value —
// it's a calibrated estimate derived from the commanded PWM duty cycle. It
// updates instantly (no satellite wait) and stays smooth at low duty, unlike
// GPS speed which is noisy/unreliable under roughly 10 km/h.
// Calibrate these two constants against your actual hardware:
//   MOTOR_MAX_RPM     — output-shaft RPM at 100% duty on a full battery.
//                        Measure with a tachometer/strobe, or time N wheel
//                        revolutions by hand at 100% and extrapolate to 60s.
//   WHEEL_DIAMETER_MM — wheel diameter, in mm.
#define MOTOR_MAX_RPM       200     // TODO: calibrate for your gear-motor
#define WHEEL_DIAMETER_MM   65      // TODO: calibrate for your wheel

// Tracks whether the motors are currently commanded to move (any direction).
// Set true by forward()/backward()/left()/right(), false by stopCar(), so the
// estimate below snaps to 0 the instant a stop is issued instead of decaying.
static bool _motorsMoving = false;
inline bool motorsMoving() { return _motorsMoving; }

// Estimated wheel RPM for a given commanded speed percent (0 when stopped).
// Assumes a roughly linear duty→RPM relationship — good enough for a
// dashboard gauge, but it ignores battery sag, load, and motor stiction near
// 0%, so treat it as an approximation, not a precise tachometer reading.
inline float estimateMotorRPM(int speedPercent) {
    if (!_motorsMoving) return 0.0f;
    return (MOTOR_MAX_RPM * (float)constrain(speedPercent, 0, 100)) / 100.0f;
}

// Estimated speed in km/h, derived from the RPM estimate above.
inline float estimateSpeedKmh(int speedPercent) {
    float rpm = estimateMotorRPM(speedPercent);
    if (rpm <= 0.0f) return 0.0f;
    float wheelCircumferenceM = (WHEEL_DIAMETER_MM / 1000.0f) * PI;
    float metersPerMin        = rpm * wheelCircumferenceM;
    return (metersPerMin * 60.0f) / 1000.0f;
}

// ── Internal helper: percent → 8-bit PWM ─────────────────────────────────────
static inline int _speedToPWM(int speedPercent) {
    return map(constrain(speedPercent, 0, 100), 0, 100, 0, PWM_MAX_VALUE);
}

inline void initMotors() {
    pinMode(IN1, OUTPUT);
    pinMode(IN2, OUTPUT);
    pinMode(IN3, OUTPUT);
    pinMode(IN4, OUTPUT);

    // ESP32 Arduino Core 3.x unified ledcAttach API
    ledcAttach(ENA, PWM_FREQUENCY_HZ, PWM_RESOLUTION_BITS);
    ledcAttach(ENB, PWM_FREQUENCY_HZ, PWM_RESOLUTION_BITS);
}

// Fully de-energises motor driver: PWM to 0 AND direction pins LOW.
inline void stopCar() {
    ledcWrite(ENA, 0);
    ledcWrite(ENB, 0);
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, LOW);
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, LOW);
    _motorsMoving = false;
}

// ── Smooth stop ────────────────────────────────────────────────────────────
// Ramps PWM duty down to 0 in small steps over durationMs (default 5000 ms),
// keeping whatever direction pins (IN1-IN4) were already set — it does NOT
// change direction, just tapers the speed already in motion — then finishes
// with a full stopCar() to fully de-energise (PWM 0 + direction pins LOW),
// i.e. "disconnected fully" at the end of the ramp.
// Blocking (uses delay()) — acceptable for a mobilization stop, which should
// not be interrupted partway through. esp_task_wdt_reset() is fed every step
// so the 5s ramp doesn't trip the watchdog.
// NOTE: for tamper/emergency immobilisation keep using the instant stopCar()
// — that path is a security cut, not a driving stop, and must not delay.
inline void stopCarSmooth(unsigned long durationMs = 5000, uint8_t steps = 20) {
    int startDutyA = ledcRead(ENA);
    int startDutyB = ledcRead(ENB);
    unsigned long stepDelayMs = durationMs / steps;

    for (uint8_t i = 1; i <= steps; i++) {
        esp_task_wdt_reset();
        int dutyA = startDutyA - (int)((long)startDutyA * i / steps);
        int dutyB = startDutyB - (int)((long)startDutyB * i / steps);
        ledcWrite(ENA, dutyA);
        ledcWrite(ENB, dutyB);
        delay(stepDelayMs);
    }

    esp_task_wdt_reset();
    stopCar();   // final full de-energise + direction pins LOW — fully disconnected
}

inline void forward(int speedPercent) {
    int pwm = _speedToPWM(speedPercent);
    ledcWrite(ENA, pwm);
    ledcWrite(ENB, pwm);
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW);
    digitalWrite(IN3, HIGH);
    digitalWrite(IN4, LOW);
    _motorsMoving = true;
}

inline void backward(int speedPercent) {
    int pwm = _speedToPWM(speedPercent);
    ledcWrite(ENA, pwm);
    ledcWrite(ENB, pwm);
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, HIGH);
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, HIGH);
    _motorsMoving = true;
}

inline void left(int speedPercent) {
    int pwm = _speedToPWM(speedPercent);
    ledcWrite(ENA, pwm);
    ledcWrite(ENB, pwm);
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, HIGH);
    digitalWrite(IN3, HIGH);
    digitalWrite(IN4, LOW);
    _motorsMoving = true;
}

inline void right(int speedPercent) {
    int pwm = _speedToPWM(speedPercent);
    ledcWrite(ENA, pwm);
    ledcWrite(ENB, pwm);
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW);
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, HIGH);
    _motorsMoving = true;
}

#endif // MOTOR_DRIVER_H