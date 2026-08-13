#ifndef LOCAL_CONTROL_H
#define LOCAL_CONTROL_H

// =============================================================================
// LocalControl.h — Browser-based phone-to-car link over ESP32's own WiFi AP     stable
// =============================================================================
// ESP32 runs WIFI_AP_STA:
//   - AP  (this file):  controller phone joins the car's own hotspot and opens
//                       a webpage served directly by the ESP32 — no app, no
//                       internet needed, just a browser.
//   - STA (fire.h):     ESP32 joins a real network (e.g. your other phone's
//                       hotspot) purely to reach Firebase/internet.
// Uses the built-in WebServer library (sync, part of the core — no extra
// install, lighter than an async server for a page this simple).
//
// The page is a single self-contained HTML/CSS/JS string — no external
// scripts/fonts/CDNs, because the AP has no internet access, so nothing
// external would load anyway.
//
// ── LATENCY FIX (this revision) ───────────────────────────────────────────
// Button presses were feeling sluggish. Two classic ESP32 WebServer causes:
//   1. Nagle's algorithm / delayed ACK — WiFiClient doesn't disable Nagle by
//      default, so each request can sit ~100-300ms waiting for ACK
//      coalescing before the response is flushed. Fixed by calling
//      client().setNoDelay(true) at the top of every handler.
//   2. WiFi modem sleep — the radio's default power-save duty-cycling adds
//      latency to inbound requests, including AP-side traffic when AP+STA
//      run together (as here, for the Firebase STA link). Fixed by calling
//      WiFi.setSleep(false) once, in initLocalControl().
// =============================================================================

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include "MotorDriver.h"
#include "secrets.h"

#define LOCAL_HTTP_PORT 80

// ── Shared state (defined in ESP32_BT_Carc.ino) ──────────────────────────────
extern bool   vehicleLocked;
extern int    currentSpeedPercent;
extern String sideLockState;
extern double latitude;
extern double longitude;
extern double speedKmh;       // raw GPS speed — kept for logging/fallback only
extern double motorSpeedKmh;  // PWM-based estimate — used for the live gauge
extern double motorRPM;       // PWM-based estimate — used for the live gauge
extern int    satellites;
extern bool   mobilization;
extern bool   localControlKilled;
extern volatile bool telemetryDirty;  // set true here, pushed to Firebase from loop()

// ── Server object (defined in ESP32_BT_Carc.ino) ─────────────────────────────
extern WebServer localServer;

// ── Tracks whether a browser is actively talking to us, for motorState ───────
// (no persistent connection to check like TCP/BLE had — a browser tab counts
// as "connected" if it hit us within the last few seconds; the page polls
// /status every second, so this stays fresh while a tab is open).
static unsigned long _lastControlActivityMs = 0;
#define LOCAL_CONTROL_ACTIVE_WINDOW_MS 5000UL

inline bool localControlActive() {
  return !localControlKilled && (millis() - _lastControlActivityMs < LOCAL_CONTROL_ACTIVE_WINDOW_MS);
}

// ── Single setter that keeps vehicleLocked + sideLockState in sync ───────────
inline void setVehicleLock(bool locked, const char* stateLabel) {
  vehicleLocked = locked;
  sideLockState = stateLabel;
}

// ── Execute a single-character motor command (uppercase only) ─────────────────
inline void executeCommand(char cmd) {
  cmd = toupper((unsigned char)cmd);

  if (vehicleLocked) {
    stopCar();
    Serial.println("[Local] Command ignored — vehicle locked");
    return;
  }

  switch (cmd) {
    case 'F': forward(currentSpeedPercent);  break;
    case 'B': backward(currentSpeedPercent); break;
    case 'L': left(currentSpeedPercent);     break;
    case 'R': right(currentSpeedPercent);    break;
    case 'S': stopCar();                     break;
    default:
      Serial.printf("[Local] Unknown command: '%c'\n", cmd);
      break;
  }
}

// ── Control page — self-contained, no external resources ─────────────────────
// Stored in flash (PROGMEM) via the const char[] — WebServer::send() streams
// it straight from flash, doesn't need to sit in heap.
static const char CONTROL_PAGE[] PROGMEM = R"HTMLPAGE(
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>RC Car</title>
<style>
  :root{ --bg:#0e1116; --panel:#161b22; --line:#2a313c; --accent:#3fa9f5; --danger:#e5484d; --ok:#3fb950; --text:#e6edf3; --muted:#8b949e; }
  *{ box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  body{ margin:0; background:var(--bg); color:var(--text); font-family:-apple-system,Segoe UI,Roboto,sans-serif; padding:16px; user-select:none; }
  h1{ font-size:15px; font-weight:600; color:var(--muted); letter-spacing:.04em; text-transform:uppercase; margin:0 0 12px; text-align:center; }
  .status{ background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:12px 14px; margin-bottom:16px; font-size:13px; line-height:1.6; }
  .status b{ color:var(--text); }
  .row{ display:flex; justify-content:space-between; }
  .pad{ display:grid; grid-template-columns:80px 80px 80px; grid-template-rows:80px 80px 80px; gap:10px; justify-content:center; margin:20px 0; }
  .btn{ background:var(--panel); border:1px solid var(--line); border-radius:14px; color:var(--text); font-size:26px; display:flex; align-items:center; justify-content:center; touch-action:none; }
  .btn:active, .btn.pressed{ background:var(--accent); border-color:var(--accent); }
  .f{grid-column:2; grid-row:1;} .l{grid-column:1; grid-row:2;} .r{grid-column:3; grid-row:2;} .b{grid-column:2; grid-row:3;}
  .speedrow{ margin-top:16px; font-size:13px; color:var(--muted); }
  input[type=range]{ width:100%; margin-top:6px; }
  </style>
  </head>
  <body>
  <h1>ESP32 RC Car</h1>

  <div class="status" id="status">Connecting…</div>

  <div class="pad">
  <div class="btn f" data-cmd="F">&#9650;</div>
  <div class="btn l" data-cmd="L">&#9664;</div>
  <div class="btn r" data-cmd="R">&#9654;</div>
  <div class="btn b" data-cmd="B">&#9660;</div>
  </div>

  <div class="speedrow">
  Speed: <span id="speedLabel">30</span>%
  <input type="range" min="10" max="100" step="5" value="30" id="speedSlider">
  </div>

  <script>
  function press(cmd, on){
    fetch('/cmd?c=' + (on ? cmd : 'S')).catch(()=>{});
  }
  document.querySelectorAll('.btn[data-cmd]').forEach(function(el){
    var cmd = el.getAttribute('data-cmd');
    el.addEventListener('pointerdown', function(e){ e.preventDefault(); el.classList.add('pressed'); press(cmd, true); });
    el.addEventListener('pointerup',   function(){ el.classList.remove('pressed'); press(cmd, false); });
    el.addEventListener('pointerleave',function(){ el.classList.remove('pressed'); press(cmd, false); });
  });

  document.getElementById('speedSlider').addEventListener('change', function(e){
    fetch('/speed?v=' + e.target.value).catch(()=>{});
    document.getElementById('speedLabel').textContent = e.target.value;
  });
  document.getElementById('speedSlider').addEventListener('input', function(e){
    document.getElementById('speedLabel').textContent = e.target.value;
  });

  function poll(){
    fetch('/status').then(function(r){ return r.json(); }).then(function(d){
      document.getElementById('status').innerHTML =
      '<div class="row"><span>Speed</span><b>' + d.speed.toFixed(2) + ' km/h</b></div>' +
    '<div class="row"><span>RPM</span><b>' + d.rpm.toFixed(2) + '</b></div>' +
    '<div class="row"><span>Mobilization</span><b>' + d.mob + '</b></div>';
    }).catch(function(){
      document.getElementById('status').textContent = 'Car unreachable…';
    });
  }
  poll();
  setInterval(poll, 1000);
  </script>
  </body>
  </html>
  )HTMLPAGE";

// ── Route handlers ────────────────────────────────────────────────────────────
inline void _handleRoot() {
  localServer.client().setNoDelay(true);   // disable Nagle — instant flush
  _lastControlActivityMs = millis();
  localServer.send_P(200, "text/html", CONTROL_PAGE);
}

inline void _handleCmd() {
  localServer.client().setNoDelay(true);   // disable Nagle — instant flush
  _lastControlActivityMs = millis();
  if (localControlKilled) {
    localServer.send(403, "text/plain", "locked");
    return;
  }
  String c = localServer.hasArg("c") ? localServer.arg("c") : "";

  if (c.equalsIgnoreCase("STOP_VEHICLE")) {
    stopCar();
    setVehicleLock(true, "LOCKED");
    telemetryDirty = true;
    Serial.println("[Local] Vehicle LOCKED via web page");
  } else if (c.equalsIgnoreCase("UNLOCK_VEHICLE")) {
    setVehicleLock(false, "UNLOCKED");
    telemetryDirty = true;
    Serial.println("[Local] Vehicle UNLOCKED via web page");
  } else if (c.length() == 1) {
    executeCommand(c.charAt(0));
    telemetryDirty = true;   // F/B/L/R/S — push updated speed/RPM/state to Firebase
  }
  localServer.send(200, "text/plain", "ok");
}

inline void _handleSpeed() {
  localServer.client().setNoDelay(true);   // disable Nagle — instant flush
  _lastControlActivityMs = millis();
  if (localServer.hasArg("v")) {
    int v = localServer.arg("v").toInt();
    currentSpeedPercent = constrain(v, 0, 100);
    telemetryDirty = true;
  }
  localServer.send(200, "text/plain", "ok");
}

inline void _handleStatus() {
  localServer.client().setNoDelay(true);   // disable Nagle — instant flush
  _lastControlActivityMs = millis();
  char buf[260];
  // "speed"/"rpm" = PWM-based estimate (instant, stable at low speed) — this is
  // what the live gauge should read. "gpsSpeed" is the raw GPS reading, kept
  // for reference only (noisy/laggy under ~10 km/h).
  snprintf(buf, sizeof(buf),
           "{\"speed\":%.2f,\"rpm\":%.2f,\"gpsSpeed\":%.2f,\"lat\":%.6f,\"lng\":%.6f,\"sats\":%d,\"mob\":%s,\"lock\":\"%s\"}",
           motorSpeedKmh, motorRPM, speedKmh, latitude, longitude, satellites,
           mobilization ? "true" : "false", sideLockState.c_str());
  localServer.send(200, "application/json", buf);
}

// ── Init: AP + HTTP server ────────────────────────────────────────────────────
// NOTE: call WiFi.mode(WIFI_AP_STA) once, before this AND before the STA
// connect in initFirebase() — this file does not set the mode itself, since
// both roles need to be up together.
inline void initLocalControl() {
  // Disable WiFi power-save (modem sleep). Default duty-cycled sleep adds
  // real latency to inbound requests — this is the single biggest win for
  // "button press feels slow" on ESP32 WebServer control pages.
  WiFi.setSleep(false);

  bool haveApPassword = (strlen(LOCAL_AP_PASSWORD) >= 8);
  WiFi.softAP(LOCAL_AP_SSID, haveApPassword ? LOCAL_AP_PASSWORD : NULL);

  localServer.on("/", HTTP_GET, _handleRoot);
  localServer.on("/cmd", HTTP_GET, _handleCmd);
  localServer.on("/speed", HTTP_GET, _handleSpeed);
  localServer.on("/status", HTTP_GET, _handleStatus);
  localServer.begin();

  Serial.printf("[Local] AP '%s' up (%s). Open http://%s in a browser to drive.\n",
                LOCAL_AP_SSID,
                haveApPassword ? "secured" : "OPEN — set LOCAL_AP_PASSWORD in secrets.h",
                WiFi.softAPIP().toString().c_str());
}

// ── Call once per loop() ──────────────────────────────────────────────────────
inline void handleLocalControl() {
  if (!localControlKilled) localServer.handleClient();
}

// ── Permanently shut local control down (mirrors old stopBLE()/stopLocalControl()) ─
inline void stopLocalControl() {
  localServer.stop();
  WiFi.softAPdisconnect(true);
  localControlKilled = true;
  Serial.printf("[Local] Local control shut down. Free heap: %u bytes\n", ESP.getFreeHeap());
}

#endif // LOCAL_CONTROL_H
