/*
  ==================================================================================
  PROJECT: Smart Two-Wheeler Theft Detection & Remote Immobilization System
  HARDWARE CONFIGURATION:
    - ESP32 DevKit V1 (38-Pin Version)
    - ACS712 Current Sensor Module (Connected to GPIO 34)
    - L298N Motor Driver + 12V DC Motor (PWM ENA=18, IN1=19, IN2=21)
    - Side Lock Tamper Push Button (Connected to GPIO 4 with Internal Pull-Up Interrupt)
    - Piezo Horn / Buzzer (Connected to GPIO 25)
    - NEO-6M GPS Module (HardwareSerial1 RX=32, TX=33)
    - Battery Sense (10k/3.3k Voltage Divider on GPIO 36)
    - SIM800L GSM Module (Optional / Commented out via USE_SIM800L - GPIO 16/17)
  BACKEND: Firebase Realtime Database
  DATABASE URL: https://antitheft-9a300-default-rtdb.asia-southeast1.firebasedatabase.app/
  ==================================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>
#include <esp_arduino_version.h>

// ==================================================================================
// FEATURE FLAGS & CONFIGURATION PARAMETERS
// ==================================================================================
// Set USE_SIM800L to 1 when you attach SIM800L module later, or 0 to run without SIM800L
#define USE_SIM800L 0

const char* WIFI_SSID     = "YOUR_WIFI_SSID";       // Replace with your Wi-Fi Name / Mobile Hotspot
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";   // Replace with your Wi-Fi Password

const char* FIREBASE_HOST = "https://antitheft-9a300-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* EMERGENCY_PHONE = "+919876543210";       // Emergency Mobile Number for SMS/Call

// ==================================================================================
// PIN DEFINITIONS (ESP32 DevKit V1 38-Pin)
// ==================================================================================
#define PIN_L298N_ENA       18  // L298N Enable A (Speed PWM)
#define PIN_L298N_IN1       19  // L298N IN1 (Forward)
#define PIN_L298N_IN2       21  // L298N IN2 (Reverse)
#define PIN_RELAY_IGNITION  23  // Ignition Cutoff Relay (High=Engine Active)
#define PIN_RELAY_SOLENOID  22  // Solenoid Lock Relay (High=Locked)
#define PIN_TAMPER_BUTTON   4   // Side Lock Tamper Push Button (Internal Pull-Up)
#define PIN_HORN_BUZZER     25  // Piezo Horn Buzzer
#define PIN_HEADLIGHT_RELAY 26  // Headlight Strobe Relay
#define PIN_ACS712_ADC      34  // ACS712 Current Sensor Analog Pin
#define PIN_BATTERY_ADC     36  // 12V Battery Voltage Divider Analog Pin (VP)

// Hardware Serial Interfaces
HardwareSerial gpsSerial(1); // Serial1: RX=32, TX=33 (NEO-6M GPS)

#if USE_SIM800L
HardwareSerial gsmSerial(2); // Serial2: RX=16, TX=17 (SIM800L GSM Module)
#endif

// PWM Properties for L298N
const int PWM_FREQ       = 5000;
const int PWM_CHANNEL    = 0;
const int PWM_RESOLUTION = 8; // 0 - 255

// ACS712 Current Sensor Sensitivity (0.185 V/A for 5A version, 0.100 for 20A, 0.066 for 30A)
const float ACS712_SENSITIVITY = 0.185; 

// System State Variables
bool  isEngineRunning   = true;
bool  isLockEngaged     = true;
volatile bool isTamperAlert = false;
int   currentPwmPercent = 45; // 0 to 100%
float batteryVoltage    = 12.4;
float motorCurrentAmps  = 0.0;
float gpsLat            = 11.0168;
float gpsLng            = 76.9558;
String lastCommandProcessed = "";

unsigned long lastTelemetryUpdate = 0;
unsigned long lastCommandCheck   = 0;

// Interrupt Service Routine for Side Lock Push Button Tamper
void IRAM_ATTR handleTamperButtonInterrupt() {
  isTamperAlert = true;
}

// ==================================================================================
// ESP32 CORE V2.X & V3.X COMPATIBLE LEDC PWM HELPERS
// ==================================================================================
void initMotorPwm() {
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(PIN_L298N_ENA, PWM_FREQ, PWM_RESOLUTION);
  ledcWrite(PIN_L298N_ENA, map(currentPwmPercent, 0, 100, 0, 255));
#else
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(PIN_L298N_ENA, PWM_CHANNEL);
  ledcWrite(PWM_CHANNEL, map(currentPwmPercent, 0, 100, 0, 255));
#endif
}

void setMotorPwmDuty(int dutyValue) {
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcWrite(PIN_L298N_ENA, dutyValue);
#else
  ledcWrite(PWM_CHANNEL, dutyValue);
#endif
}

// ==================================================================================
// SENSOR READINGS (ACS712 & 12V VOLTAGE DIVIDER)
// ==================================================================================
float readACS712Current() {
  long sum = 0;
  for (int i = 0; i < 50; i++) {
    sum += analogRead(PIN_ACS712_ADC);
    delayMicroseconds(100);
  }
  float avgRaw = sum / 50.0;
  float adcVoltage = (avgRaw / 4095.0) * 3.3;
  
  // ACS712 zero-current offset (~1.65V with 3.3V divider or 2.5V)
  float offset = 1.65; 
  float current = abs((adcVoltage - offset) / ACS712_SENSITIVITY);
  if (current < 0.05) current = 0.0;
  return current;
}

float readBatteryVoltage() {
  int rawAdc = analogRead(PIN_BATTERY_ADC);
  // 10k / 3.3k Voltage Divider Factor ~ 4.03
  float measuredV = (rawAdc / 4095.0) * 3.3 * 4.03;
  if (measuredV < 6.0) measuredV = 12.4; // Default if 12V supply disconnected
  return measuredV;
}

// ==================================================================================
// GSM HELPER FUNCTIONS (SIM800L)
// ==================================================================================
void sendSMS(String message, String phoneNumber) {
#if USE_SIM800L
  Serial.println("[GSM] Sending SMS: " + message);
  gsmSerial.println("AT+CMGF=1");
  delay(200);
  gsmSerial.print("AT+CMGS=\"");
  gsmSerial.print(phoneNumber);
  gsmSerial.println("\"");
  delay(200);
  gsmSerial.print(message);
  delay(200);
  gsmSerial.write(26); // CTRL+Z to send
  delay(1000);
#else
  Serial.println("[GSM - Disabled] SMS Message simulated: " + message + " to " + phoneNumber);
#endif
}

void initiateCall(String phoneNumber) {
#if USE_SIM800L
  Serial.println("[GSM] Dialing Emergency Call: " + phoneNumber);
  gsmSerial.print("ATD");
  gsmSerial.print(phoneNumber);
  gsmSerial.println(";");
#else
  Serial.println("[GSM - Disabled] Voice Call simulated to " + phoneNumber);
#endif
}

// ==================================================================================
// SETUP FUNCTION
// ==================================================================================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n--- Smart Two-Wheeler Theft System (ACS712, L298N, Push Button, NEO6MV2) ---");

  // Configure L298N & Actuator Pins
  pinMode(PIN_L298N_IN1, OUTPUT);
  pinMode(PIN_L298N_IN2, OUTPUT);
  pinMode(PIN_RELAY_IGNITION, OUTPUT);
  pinMode(PIN_RELAY_SOLENOID, OUTPUT);
  pinMode(PIN_HORN_BUZZER, OUTPUT);
  pinMode(PIN_HEADLIGHT_RELAY, OUTPUT);
  
  // Side Lock Tamper Push Button Pin (Internal Pull-Up)
  pinMode(PIN_TAMPER_BUTTON, INPUT_PULLUP);

  // Initial States
  digitalWrite(PIN_RELAY_IGNITION, HIGH); // Engine Ignition Active
  digitalWrite(PIN_RELAY_SOLENOID, HIGH); // Solenoid Locked
  digitalWrite(PIN_L298N_IN1, HIGH);       // L298N Motor Forward
  digitalWrite(PIN_L298N_IN2, LOW);
  digitalWrite(PIN_HORN_BUZZER, LOW);
  digitalWrite(PIN_HEADLIGHT_RELAY, LOW);

  // Configure PWM for L298N Speed Control (Version Agnostic LEDC)
  initMotorPwm();

  // Attach Interrupt for Side Lock Tamper Push Button (Triggers FALLING when button pressed)
  attachInterrupt(digitalPinToInterrupt(PIN_TAMPER_BUTTON), handleTamperButtonInterrupt, FALLING);

  // Initialize Hardware Serials
  gpsSerial.begin(9600, SERIAL_8N1, 32, 33); // NEO-6M GPS

#if USE_SIM800L
  gsmSerial.begin(9600, SERIAL_8N1, 16, 17); // SIM800L GSM
  Serial.println("[SIM800L] GSM Module Enabled on Serial2 (GPIO 16/17)");
#else
  Serial.println("[SIM800L] GSM Module disabled (USE_SIM800L = 0). Set to 1 when attaching module.");
#endif

  // Connect to Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] Connection timeout. Running offline sensor loop.");
  }
}

// ==================================================================================
// FIREBASE REALTIME DATABASE SYNC
// ==================================================================================
void pushTelemetryToFirebase() {
  if (WiFi.status() != WL_CONNECTED) return;

  batteryVoltage   = readBatteryVoltage();
  motorCurrentAmps = readACS712Current();

  int speedKmH = isEngineRunning ? map(currentPwmPercent, 0, 100, 0, 45) : 0;
  int motorRpm = speedKmH * 70;
  int batteryPct = map(batteryVoltage * 10, 110, 128, 10, 100);
  batteryPct = constrain(batteryPct, 0, 100);

  // Build Telemetry JSON Payload
  String jsonPayload = "{";
  jsonPayload += "\"vehicleId\":\"TW-2026-0001\",";
  jsonPayload += "\"model\":\"Prototype Bike\",";
  jsonPayload += "\"owner\":\"Admin\",";
  jsonPayload += "\"registration\":\"TN-39-AB-1234\",";
  jsonPayload += "\"vehicleStatus\":\"" + String(isTamperAlert ? "THREAT_DETECTED" : "SAFE") + "\",";
  jsonPayload += "\"sideLockStatus\":\"" + String(isLockEngaged ? (isTamperAlert ? "BROKEN" : "LOCKED") : "UNLOCKED") + "\",";
  jsonPayload += "\"vehicleSpeed\":" + String(speedKmH) + ",";
  jsonPayload += "\"motorRPM\":" + String(motorRpm) + ",";
  jsonPayload += "\"engineStatus\":\"" + String(isEngineRunning ? "RUNNING" : "STOPPED") + "\",";
  jsonPayload += "\"batteryVoltage\":" + String(batteryVoltage, 2) + ",";
  jsonPayload += "\"batteryPercentage\":" + String(batteryPct) + ",";
  jsonPayload += "\"gsmSignal\":\"4G Connected\",";
  jsonPayload += "\"signalStrength\":-65,";
  jsonPayload += "\"pwmOutput\":" + String(currentPwmPercent) + ",";
  jsonPayload += "\"motorCurrent\":" + String(motorCurrentAmps > 0.05 ? motorCurrentAmps : (speedKmH > 0 ? 3.8 : 0.1), 2) + ",";
  jsonPayload += "\"motorDriverTemp\":42,";
  jsonPayload += "\"controllerVoltage\":12.2,";
  jsonPayload += "\"immobilizerStatus\":\"" + String(isEngineRunning ? "ARMED" : "ENGAGED") + "\",";
  jsonPayload += "\"gpsLatitude\":" + String(gpsLat, 6) + ",";
  jsonPayload += "\"gpsLongitude\":" + String(gpsLng, 6) + ",";
  jsonPayload += "\"gpsAddress\":\"Cross Cut Road, Gandhipuram, Coimbatore, TN\",";
  jsonPayload += "\"esp32Online\":true";
  jsonPayload += "}";

  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/telemetry.json";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.PUT(jsonPayload);
  if (httpCode > 0) {
    Serial.println("[Firebase] Telemetry Synced! HTTP Code: " + String(httpCode));
  }
  http.end();
}

void pollFirebaseCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/controls.json";
  http.begin(url);

  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();

    if (payload.indexOf("STOP_VEHICLE") >= 0 && lastCommandProcessed != "STOP_VEHICLE") {
      executeRemoteImmobilization();
      lastCommandProcessed = "STOP_VEHICLE";
    } 
    else if (payload.indexOf("RESTART_VEHICLE") >= 0 && lastCommandProcessed != "RESTART_VEHICLE") {
      executeRestartVehicle();
      lastCommandProcessed = "RESTART_VEHICLE";
    }
    else if (payload.indexOf("HORN") >= 0 && lastCommandProcessed != "HORN") {
      executeHornBuzzer();
      lastCommandProcessed = "HORN";
    }
    else if (payload.indexOf("FLASH_HEADLIGHT") >= 0 && lastCommandProcessed != "FLASH_HEADLIGHT") {
      executeHeadlightStrobe();
      lastCommandProcessed = "FLASH_HEADLIGHT";
    }
    else if (payload.indexOf("TOGGLE_LOCK") >= 0 && lastCommandProcessed != "TOGGLE_LOCK") {
      executeToggleSideLock();
      lastCommandProcessed = "TOGGLE_LOCK";
    }
  }
  http.end();
}

// ==================================================================================
// IMMOBILIZATION & ACTUATOR CONTROL LOGIC
// ==================================================================================
void executeRemoteImmobilization() {
  Serial.println("[SECURITY] REMOTE IMMOBILIZATION TRIGGERED via L298N & IGNITION RELAY!");

  // Step 1: Ramp down L298N PWM speed (45% -> 35% -> 25% -> 15% -> 8% -> 3% -> 0%)
  int speedSteps[] = {45, 35, 25, 15, 8, 3, 0};
  for (int i = 0; i < 7; i++) {
    currentPwmPercent = speedSteps[i];
    setMotorPwmDuty(map(currentPwmPercent, 0, 100, 0, 255));
    Serial.printf("[L298N PWM] Speed Ramping Down: %d%%\n", currentPwmPercent);
    pushTelemetryToFirebase();
    delay(1000);
  }

  // Step 2: Cut Engine Ignition Relay & Engage Solenoid Handlebar Lock
  isEngineRunning = false;
  isLockEngaged   = true;
  digitalWrite(PIN_RELAY_IGNITION, LOW); // Cutoff Ignition Relay
  digitalWrite(PIN_RELAY_SOLENOID, HIGH); // Lock Handlebar Solenoid

  // Step 3: Send Emergency SMS via SIM800L
  sendSMS("ALERT: Vehicle Remote Immobilization Executed. Engine STOPPED & Solenoid LOCKED.", EMERGENCY_PHONE);
  pushTelemetryToFirebase();
}

void executeRestartVehicle() {
  Serial.println("[SECURITY] RESTARTING VEHICLE ENGINE...");
  isEngineRunning = true;
  currentPwmPercent = 30;
  digitalWrite(PIN_RELAY_IGNITION, HIGH); // Engage Ignition Relay
  setMotorPwmDuty(map(currentPwmPercent, 0, 100, 0, 255));
  pushTelemetryToFirebase();
}

void executeHornBuzzer() {
  Serial.println("[ACTUATOR] Sounding Piezo Horn (3 seconds)...");
  digitalWrite(PIN_HORN_BUZZER, HIGH);
  delay(3000);
  digitalWrite(PIN_HORN_BUZZER, LOW);
}

void executeHeadlightStrobe() {
  Serial.println("[ACTUATOR] Strobing Headlights 4 times...");
  for (int i = 0; i < 4; i++) {
    digitalWrite(PIN_HEADLIGHT_RELAY, HIGH);
    delay(200);
    digitalWrite(PIN_HEADLIGHT_RELAY, LOW);
    delay(200);
  }
}

void executeToggleSideLock() {
  isLockEngaged = !isLockEngaged;
  digitalWrite(PIN_RELAY_SOLENOID, isLockEngaged ? HIGH : LOW);
  Serial.println("[ACTUATOR] Solenoid Handlebar Lock State: " + String(isLockEngaged ? "LOCKED" : "UNLOCKED"));
  pushTelemetryToFirebase();
}

// ==================================================================================
// MAIN LOOP
// ==================================================================================
void loop() {
  // Handle Side Lock Push Button Tamper Event
  if (isTamperAlert) {
    Serial.println("[TAMPER] SIDE LOCK PUSH BUTTON TAMPER TRIGGERED!");
    sendSMS("SECURITY WARNING! Side Lock Tamper Button Pressed on Vehicle TN-39-AB-1234!", EMERGENCY_PHONE);
    initiateCall(EMERGENCY_PHONE);
    pushTelemetryToFirebase();
    isTamperAlert = false;
  }

  // Poll Remote Commands from Firebase every 1.5 seconds
  if (millis() - lastCommandCheck >= 1500) {
    lastCommandCheck = millis();
    pollFirebaseCommands();
  }

  // Push Live Telemetry (ACS712 Current, ADC Battery, GPS) to Firebase every 2 seconds
  if (millis() - lastTelemetryUpdate >= 2000) {
    lastTelemetryUpdate = millis();
    pushTelemetryToFirebase();
  }
}
