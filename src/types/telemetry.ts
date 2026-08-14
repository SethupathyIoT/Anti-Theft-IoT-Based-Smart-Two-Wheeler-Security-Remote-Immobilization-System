export interface TelemetryData {
  vehicleId: string;
  model: string;
  owner: string;
  registration: string;
  firmwareVersion: string;
  esp32Online: boolean;
  networkOperator: string;

  // Key Telemetry States
  vehicleStatus: 'SAFE' | 'THREAT_DETECTED';
  sideLockStatus: 'SAFE' | 'UNLOCKED' | 'LOCKED' | 'BROKEN' | 'WEB_LOCKED';
  sideLockTriggerTime?: string;
  vehicleSpeed: number; // km/h
  motorRPM: number;
  engineStatus: 'RUNNING' | 'STOPPED';
  batteryVoltage: number; // Volts e.g. 12.4
  batteryPercentage: number; // % e.g. 88
  
  // GSM & Signal
  gsmSignal: string; // e.g. "4G Connected"
  signalStrength: number; // e.g. -68 dBm or %
  simStatus: string; // e.g. "Active (8991...)"
  
  // Motor Telemetry
  pwmOutput: number; // 0 - 100%
  motorDirection: 'FORWARD' | 'REVERSE' | 'NEUTRAL';
  motorCurrent: number; // Amperes
  motorDriverTemp: number; // °C
  controllerVoltage: number; // Volts
  immobilizerStatus: 'ARMED' | 'DISARMED' | 'ENGAGED';
  emergencyOverride: boolean;

  // GPS Data
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAddress: string;
  gpsSpeed: number;
  gpsAccuracy: number; // meters
  heading: number; // degrees
  satelliteCount: number;
  satellites?: number;
  sentTime?: number;
  mobilization?: boolean;
  motorStatus?: string;
  motorSpeedPercent?: number;
  latency?: number;
  lastGpsUpdate: string;

  // Operational Latency & Commands
  commandLatencyMs: number;
  currentAlarm: boolean;
  currentCommand: string;
}

export interface SecurityAlert {
  id: string;
  iconType: 'shield' | 'lock' | 'phone' | 'sms' | 'stop' | 'map' | 'warning';
  title: string;
  description: string;
  timestamp: string;
  severity: 'red' | 'orange' | 'green';
  read: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS';
  message: string;
}

export interface ImmobilizationProgress {
  isStopping: boolean;
  stepIndex: number;
  currentSpeed: number;
  progressPercent: number;
  estimatedSecondsLeft: number;
  statusText: string;
  acknowledged: boolean;
}

export interface SystemSettings {
  vehicleId?: string;
  model?: string;
  ownerName: string;
  registration?: string;
  emergencyContact1: string;
  emergencyContact2: string;
  smsEnabled: boolean;
  callEnabled: boolean;
  wifiSSID: string;
  mqttServer: string;
  firebaseUrl: string;
  speedThreshold: number;
  autoStopThreshold: number;
  emergencyPin: string;
  theme: 'dark' | 'light';
  language: string;
}
