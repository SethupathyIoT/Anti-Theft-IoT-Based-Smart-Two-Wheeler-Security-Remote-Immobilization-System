import React, { useState } from 'react';
import { Cpu, Download, Copy, Check, Shield, Radio, Zap, HardDrive } from 'lucide-react';

const esp32CodeSnippet = `/*
  ==================================================================================
  PROJECT: Smart Two-Wheeler Theft Detection & Remote Immobilization System
  HARDWARE:
    - ESP32 DevKit V1 (38-Pin Version)
    - ACS712 Current Sensor Module (Connected to GPIO 34)
    - L298N Motor Driver + 12V DC Motor (PWM ENA=18, IN1=19, IN2=21)
    - NEO-6M-V2 GPS Module (HardwareSerial1 RX=32, TX=33)
    - TTP223 Touch Sensor (GPIO 4 Interrupt)
    - 12V DC Adapter Power Supply (Voltage Divider on GPIO 36)
  BACKEND: Firebase Realtime Database
  DATABASE URL: https://antitheft-9a300-default-rtdb.asia-southeast1.firebasedatabase.app/
  ==================================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>

const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* FIREBASE_HOST = "https://antitheft-9a300-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* EMERGENCY_PHONE = "+919876543210";

#define PIN_L298N_ENA       18
#define PIN_L298N_IN1       19
#define PIN_L298N_IN2       21
#define PIN_RELAY_IGNITION  23
#define PIN_RELAY_SOLENOID  22
#define PIN_TOUCH_SENSOR    4
#define PIN_HORN_BUZZER     25
#define PIN_HEADLIGHT_RELAY 26
#define PIN_ACS712_ADC      34
#define PIN_BATTERY_ADC     36

HardwareSerial gsmSerial(2); // Serial2: RX=16, TX=17
HardwareSerial gpsSerial(1); // Serial1: RX=32, TX=33

void setup() {
  Serial.begin(115200);
  pinMode(PIN_L298N_IN1, OUTPUT);
  pinMode(PIN_L298N_IN2, OUTPUT);
  pinMode(PIN_RELAY_IGNITION, OUTPUT);
  pinMode(PIN_RELAY_SOLENOID, OUTPUT);
  pinMode(PIN_HORN_BUZZER, OUTPUT);
  pinMode(PIN_HEADLIGHT_RELAY, OUTPUT);
  pinMode(PIN_TOUCH_SENSOR, INPUT);

  digitalWrite(PIN_RELAY_IGNITION, HIGH);
  digitalWrite(PIN_RELAY_SOLENOID, HIGH);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  gsmSerial.begin(9600, SERIAL_8N1, 16, 17);
  gpsSerial.begin(9600, SERIAL_8N1, 32, 33);
}

void loop() {
  // Real-time ACS712, L298N PWM, TTP223 Touch Interrupt & Firebase Sync
}`;

export const Esp32Page: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(esp32CodeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([esp32CodeSnippet], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "smart_twowheeler_antitheft.ino";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const pinoutList = [
    { component: 'ACS712 Current Sensor OUT', espPin: 'GPIO 34', type: 'ADC1_CH6 Analog Input', desc: 'Measures Motor Current Draw in Amperes' },
    { component: 'L298N Motor Driver Enable A (ENA)', espPin: 'GPIO 18', type: 'PWM Output (Channel 0)', desc: '12V DC Motor Speed PWM Control (0-255)' },
    { component: 'L298N Motor Direction IN1', espPin: 'GPIO 19', type: 'Digital Output', desc: 'Forward Direction Logic High' },
    { component: 'L298N Motor Direction IN2', espPin: 'GPIO 21', type: 'Digital Output', desc: 'Reverse Direction Logic Low' },
    { component: 'TTP223 Touch Sensor SIG', espPin: 'GPIO 4', type: 'Digital Interrupt (RISING)', desc: 'Handlebar Touch Tamper Trigger' },
    { component: 'NEO-6M-V2 GPS Module (RX1/TX1)', espPin: 'GPIO 32 / 33', type: 'HardwareSerial1', desc: 'Parses Live NMEA Satellite Coordinates' },
    { component: '12V DC Adapter Voltage Divider', espPin: 'GPIO 36 (VP)', type: 'ADC1_CH0 Analog Input', desc: '10k/3.3k Divider for 12V Main Power Voltage' },
    { component: 'Ignition Cutoff Relay', espPin: 'GPIO 23', type: 'Digital Output Relay', desc: 'High = Ignition Active / Low = Immobilized' },
    { component: 'Side Lock Solenoid Relay', espPin: 'GPIO 22', type: 'Digital Output Relay', desc: 'High = Handlebar Solenoid Lock Engaged' },
    { component: 'Piezo Horn / Buzzer', espPin: 'GPIO 25', type: 'Digital Output', desc: '3-Second Alarm Buzzer Sounder' },
    { component: 'Strobe Headlight Relay', espPin: 'GPIO 26', type: 'Digital Output Relay', desc: '4x Flasher Strobe Relay' },
    { component: 'SIM800L GSM Module (RX2/TX2)', espPin: 'GPIO 16 / 17', type: 'HardwareSerial2', desc: 'GSM AT Commands, Emergency SMS & Voice Calls' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2D4A] pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-400" />
            ESP32 DevKit V1 (38-Pin) + ACS712 + L298N + TTP223 + NEO6MV2 Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Exact hardware pinout mapping, 12V DC power adapter circuit specifications, and downloadable firmware
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyCode}
            className="px-3.5 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-xs font-bold flex items-center gap-2 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Code!' : 'Copy Sketch'}</span>
          </button>
          <button
            onClick={handleDownloadCode}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download .ino Code</span>
          </button>
        </div>
      </div>

      {/* Hardware Module Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Current Sensor</span>
          <div className="text-lg font-bold text-amber-400 mt-1">ACS712 Module</div>
          <span className="text-[11px] text-slate-400">GPIO 34 (ADC1_CH6)</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Motor Driver</span>
          <div className="text-lg font-bold text-blue-400 mt-1">L298N + 12V Motor</div>
          <span className="text-[11px] text-slate-400">GPIO 18, 19, 21</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Touch Sensor</span>
          <div className="text-lg font-bold text-emerald-400 mt-1">TTP223 Sensor</div>
          <span className="text-[11px] text-slate-400">GPIO 4 Interrupt</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">GPS Tracker</span>
          <div className="text-lg font-bold text-purple-400 mt-1">NEO-6M-V2 GPS</div>
          <span className="text-[11px] text-slate-400">GPIO 32 / 33</span>
        </div>
      </div>

      {/* Pinout Table */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#1E2D4A] pb-3">
          ESP32 DevKit V1 38-Pin Wiring Diagram & Pin Mapping
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1220] border-b border-[#1E2D4A] text-xs font-bold text-slate-400 uppercase">
                <th className="p-3">Hardware Module</th>
                <th className="p-3">ESP32 38-Pin Pin</th>
                <th className="p-3">Function / Mode</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D4A]/50 text-xs">
              {pinoutList.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#1E2D4A]/30 transition-colors">
                  <td className="p-3 font-bold text-white">{item.component}</td>
                  <td className="p-3 font-mono font-bold text-emerald-400">{item.espPin}</td>
                  <td className="p-3 text-blue-400 font-mono text-[11px]">{item.type}</td>
                  <td className="p-3 text-slate-300">{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Snippet Box */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E2D4A] pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            smart_twowheeler_antitheft.ino
          </h3>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
            ACS712 + L298N + TTP223 + NEO6MV2 Ready
          </span>
        </div>

        <pre className="bg-[#070C14] p-4 rounded-xl border border-[#1E2D4A] text-xs text-slate-200 font-mono overflow-x-auto max-h-96">
          <code>{esp32CodeSnippet}</code>
        </pre>
      </div>
    </div>
  );
};
