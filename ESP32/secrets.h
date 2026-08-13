#ifndef SECRETS_H
#define SECRETS_H

// ============================================================
//  secrets.h — NEVER commit this file to version control!
//  Add "secrets.h" to your .gitignore file.
// ============================================================

// Wi-Fi (STA — ESP32 joins this network for internet/Firebase access,
// e.g. your other phone's mobile hotspot)
#define WIFI_SSID     "iot"
#define WIFI_PASSWORD "1234567890"

// Local AP — ESP32's own hotspot for direct phone control, no internet
// needed. Password must be >= 8 chars or the AP falls back to OPEN.
#define LOCAL_AP_SSID     "ESP32_RC_CAR"
#define LOCAL_AP_PASSWORD "CarControl123"

// Firebase
#define API_KEY       "AIzaSyDonoY5JLmED-sJQDaVktYSAs_TftjN-nA"
#define DATABASE_URL  "https://antifinal-722a9-default-rtdb.asia-southeast1.firebasedatabase.app"

// Emergency fallback phone number (only used if Firebase fetch fails)
// Format: international with + prefix, e.g. "+919876543210"
// Leave empty ("") to disable fallback and skip alert if fetch fails.
#define EMERGENCY_PHONE_FALLBACK "+91 xxxxx xxxxx"

#endif // SECRETS_H
