#ifndef GPS_H
#define GPS_H

#include <Arduino.h>
#include <HardwareSerial.h>
#include <TinyGPS++.h>

// ── Hardware ──────────────────────────────────────────────────────────────────
// gpsSerial is defined once in ESP32_BT_Car.ino as HardwareSerial gpsSerial(1)
// Pins are set in initGPS() — do NOT rely on the default UART1 pins.
extern HardwareSerial gpsSerial;
extern TinyGPSPlus    gps;

#define GPS_RX_PIN  32
#define GPS_TX_PIN  33
#define GPS_BAUD    9600

// ── Noise filter ─────────────────────────────────────────────────────────────
// GPS receivers report small random speeds even when stationary.
// Readings below this threshold are clamped to 0 for the speed display.
// NOTE: this filter is intentionally NOT applied to latitude/longitude so that
//       security alerts always use the freshest fix, even when parked.
#define MIN_SPEED_THRESHOLD_KMH 3.5f

// ── Telemetry globals (defined in ESP32_BT_Car.ino) ──────────────────────────
extern double latitude;
extern double longitude;
extern double speedKmh;
extern int    satellites;

inline void initGPS() {
    gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
    Serial.printf("[GPS] UART1 on RX=GPIO%d TX=GPIO%d @ %d baud\n",
                  GPS_RX_PIN, GPS_TX_PIN, GPS_BAUD);
}

inline void readGpsSensor() {
    while (gpsSerial.available() > 0) {
        gps.encode(gpsSerial.read());
    }

    // ── Speed (display only — noise-filtered) ─────────────────────────────
    if (gps.speed.isValid()) {
        double raw = gps.speed.kmph();
        speedKmh   = (raw < MIN_SPEED_THRESHOLD_KMH) ? 0.0 : raw;
    } else {
        speedKmh = 0.0;
    }

    // ── Location — ALWAYS update when valid ───────────────────────────────
    // Previous code only updated when moving; this meant emergency SMS could
    // send stale coordinates. We always store the latest valid fix.
    if (gps.location.isValid()) {
        latitude  = gps.location.lat();
        longitude = gps.location.lng();
    }

    // ── Satellite count ───────────────────────────────────────────────────
    if (gps.satellites.isValid()) {
        satellites = gps.satellites.value();
    }
}

#endif // GPS_H
