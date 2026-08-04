import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { TelemetryData, SecurityAlert, SystemLog, ImmobilizationProgress, SystemSettings } from '../types/telemetry';
import { database, ref, onValue, set, update } from '../firebase';

interface TelemetryContextType {
  telemetry: TelemetryData;
  alerts: SecurityAlert[];
  logs: SystemLog[];
  historyData: { time: string; speed: number; rpm: number; current: number; voltage: number }[];
  immobilization: ImmobilizationProgress;
  isSimulatorActive: boolean;
  settings: SystemSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  triggerRemoteStop: () => void;
  restartVehicle: () => void;
  toggleSideLock: () => void;
  triggerHorn: () => void;
  flashHeadlight: () => void;
  toggleEmergencyOverride: () => void;
  toggleSimulator: () => void;
  clearAlerts: () => void;
  markAlertAsRead: (id: string) => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  addLog: (level: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS', message: string) => void;
  addAlert: (alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'read'>) => void;
}

const initialTelemetry: TelemetryData = {
  vehicleId: "TW-2026-0001",
  model: "Prototype Bike",
  owner: "Admin",
  registration: "TN-39-AB-1234",
  firmwareVersion: "v1.0.0",
  esp32Online: false,
  networkOperator: "Hardware Stream",
  
  vehicleStatus: "SAFE",
  sideLockStatus: "LOCKED",
  sideLockTriggerTime: undefined,
  vehicleSpeed: 0,
  motorRPM: 0,
  engineStatus: "STOPPED",
  batteryVoltage: 0.0,
  batteryPercentage: 0,
  
  gsmSignal: "Connecting...",
  signalStrength: 0,
  simStatus: "Awaiting Hardware Signal",
  
  pwmOutput: 0,
  motorDirection: "NEUTRAL",
  motorCurrent: 0.0,
  motorDriverTemp: 0,
  controllerVoltage: 0.0,
  immobilizerStatus: "ARMED",
  emergencyOverride: false,
  
  gpsLatitude: 0.0,
  gpsLongitude: 0.0,
  gpsAddress: "Awaiting Hardware GPS Fix...",
  gpsSpeed: 0,
  gpsAccuracy: 0,
  heading: 0,
  satelliteCount: 0,
  lastGpsUpdate: "Offline",

  commandLatencyMs: 0,
  currentAlarm: false,
  currentCommand: "IDLE"
};

const initialAlerts: SecurityAlert[] = [];

const initialLogs: SystemLog[] = [
  { id: "log-1", timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }), level: "INFO", message: "Real Hardware Dashboard Initialized. Waiting for ESP32 Firebase Stream..." }
];

const initialSettings: SystemSettings = {
  ownerName: "Admin",
  emergencyContact1: "+91 98765 43210",
  emergencyContact2: "+91 91234 56789",
  smsEnabled: true,
  callEnabled: true,
  wifiSSID: "SmartIoT_Vehicle_5G",
  mqttServer: "mqtt.antitheft-iot.net:1883",
  firebaseUrl: "https://antifinal-722a9-default-rtdb.asia-southeast1.firebasedatabase.app",
  speedThreshold: 60,
  autoStopThreshold: 80,
  emergencyPin: "9944",
  theme: "dark",
  language: "English"
};

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<TelemetryData>(initialTelemetry);
  const [alerts, setAlerts] = useState<SecurityAlert[]>(initialAlerts);
  const [logs, setLogs] = useState<SystemLog[]>(initialLogs);
  const [historyData, setHistoryData] = useState<{ time: string; speed: number; rpm: number; current: number; voltage: number }[]>([]);
  const [isSimulatorActive, setIsSimulatorActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  
  const [immobilization, setImmobilization] = useState<ImmobilizationProgress>({
    isStopping: false,
    stepIndex: 0,
    currentSpeed: 0,
    progressPercent: 0,
    estimatedSecondsLeft: 0,
    statusText: "Ready",
    acknowledged: false
  });

  const addLog = (level: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS', message: string) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newLog: SystemLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: timeStr,
      level,
      message
    };
    setLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep last 100 logs
  };

  const addAlert = (alertData: Omit<SecurityAlert, 'id' | 'timestamp' | 'read'>) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newAlert: SecurityAlert = {
      ...alertData,
      id: `alt-${Date.now()}`,
      timestamp: timeStr,
      read: false
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const lastRxTimeRef = useRef<number>(0);

  // Firebase Realtime Database Listener - Settings Node
  useEffect(() => {
    try {
      const settingsRef = ref(database, 'settings');
      const unsubscribe = onValue(settingsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Firebase settings listener notice:", err);
    }
  }, []);

  // Firebase Realtime Database Listener - Real Hardware Telemetry Stream
  useEffect(() => {
    try {
      const telemetryRef = ref(database, 'telemetry');
      const unsubscribe = onValue(telemetryRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const now = Date.now();
          const prevRxTime = lastRxTimeRef.current;
          lastRxTimeRef.current = now;
          const realPing = data.latency ? Number(data.latency) : (prevRxTime > 0 ? Math.min(500, Math.max(8, Math.round(now - prevRxTime))) : 35);
          const isEngineActive = (data.engineStatus === 'RUNNING' || 
            (data.vehicleStatus !== 'THREAT_DETECTED' && 
             data.sideLockStatus !== 'BROKEN' && 
             data.motorStatus !== 'OFF' && 
             data.controls !== 'offmotor' && 
             data.currentCommand !== 'STOP_VEHICLE'));

          const newSpeed = Number(data.vehicleSpeed || 0);
          const newRpm = Number(data.motorRPM || (newSpeed > 0 ? Math.round(newSpeed * 100) : 0));
          const newCurrent = Number(data.motorCurrent || (newSpeed > 0 ? (0.5 + newSpeed * 0.15) : 0));
          const newVoltage = Number(data.batteryVoltage || data.controllerVoltage || 12.6);

          setTelemetry(prev => ({
            ...prev,
            ...data,
            vehicleSpeed: newSpeed,
            motorRPM: newRpm,
            motorCurrent: Number(newCurrent.toFixed(2)),
            batteryVoltage: Number(newVoltage.toFixed(2)),
            engineStatus: isEngineActive ? 'RUNNING' : 'STOPPED',
            esp32Online: true,
            gsmSignal: data.gsmSignal || "4G / VoLTE (Online)",
            networkOperator: data.networkOperator || "SIM800L / GSM Stream",
            signalStrength: data.signalStrength !== undefined ? data.signalStrength : (prev.signalStrength || -87),
            commandLatencyMs: realPing,
            satellites: data.satellites !== undefined ? Number(data.satellites) : prev.satellites,
            gpsLatitude: data.gpsLatitude !== undefined ? Number(data.gpsLatitude) : prev.gpsLatitude,
            gpsLongitude: data.gpsLongitude !== undefined ? Number(data.gpsLongitude) : prev.gpsLongitude,
            gpsAddress: data.gpsAddress || prev.gpsAddress
          }));

          // Append live telemetry point into historyData buffer for continuous smooth charting
          const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setHistoryData(prev => [
            ...prev.slice(-29),
            {
              time: timeLabel,
              speed: newSpeed,
              rpm: newRpm,
              current: Number(newCurrent.toFixed(2)),
              voltage: Number(newVoltage.toFixed(2))
            }
          ]);

          // Log Serial print telemetry entries into System Terminal Logs
          const latVal = Number(data.gpsLatitude || data.latitude || 0).toFixed(6);
          const lngVal = Number(data.gpsLongitude || data.longitude || 0).toFixed(6);
          const speedVal = newSpeed.toFixed(1);
          const lockState = data.sideLockStatus || 'LOCKED';

          if (data.sideLockStatus === 'BROKEN' || data.vehicleStatus === 'THREAT_DETECTED') {
            addLog('DANGER', `[ALERT] SIDE LOCK BUTTON PRESSED -> BROKEN / THREAT DETECTED!`);
            addLog('DANGER', `[ALERT] Vehicle Immobilized! Alerting Emergency Contact`);
            addLog('WARNING', `[SIM800L] Sending Emergency SMS to Target Contact with Live Map Location: https://maps.google.com/?q=${latVal},${lngVal}`);
            addLog('WARNING', `[SIM800L] Executing Voice Call ATD Command to Emergency Contact...`);
          } else {
            addLog('SUCCESS', `[Serial RX] [Firebase] Telemetry Synced (HTTP 200) | Lat: ${latVal}, Lng: ${lngVal}, Speed: ${speedVal} km/h, Lock: ${lockState}`);
          }
        }
      }, (error) => {
        console.warn("Firebase listener notice:", error.message);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Firebase connection notice:", err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hardware Liveness Heartbeat Monitor (Timeout if no stream received for >20s)
  useEffect(() => {
    const heartbeatTimer = setInterval(() => {
      const lastRx = lastRxTimeRef.current;
      if (lastRx > 0 && Date.now() - lastRx > 20000) {
        setTelemetry(prev => {
          if (!prev.esp32Online && prev.engineStatus === 'STOPPED') return prev;
          return {
            ...prev,
            esp32Online: false,
            engineStatus: 'STOPPED',
            vehicleSpeed: 0,
            motorRPM: 0,
            pwmOutput: 0,
            signalStrength: 0,
            gsmSignal: 'Hardware Offline',
            commandLatencyMs: 0
          };
        });
      }
    }, 3000);

    return () => clearInterval(heartbeatTimer);
  }, []);

  // Dispatch Remote Stop Command to Firebase /controls Node
  const triggerRemoteStop = () => {
    addLog('WARNING', 'Remote Stop Command Dispatched to ESP32 Hardware via Firebase');
    addAlert({
      iconType: 'stop',
      title: 'Vehicle Stop Requested',
      description: 'Remote immobilization command sent to hardware controller.',
      severity: 'orange'
    });

    try {
      update(ref(database), {
        'controls': 'OFFMOTOR',
        'mobilization': true,
        'telemetry/mobilization': true,
        'telemetry/motorStatus': 'OFF',
        'telemetry/sideLockStatus': 'LOCKED'
      });
      setTelemetry(prev => ({
        ...prev,
        mobilization: true,
        motorStatus: 'OFF',
        sideLockStatus: 'LOCKED',
        engineStatus: 'STOPPED'
      }));
    } catch (e) {
      console.error("Firebase control error:", e);
    }
  };

  const restartVehicle = () => {
    addLog('INFO', 'Restart Command Dispatched to ESP32 Hardware via Firebase');
    addAlert({
      iconType: 'shield',
      title: 'Vehicle Restart Command Sent',
      description: 'Engine ignition command sent to ESP32.',
      severity: 'green'
    });

    try {
      update(ref(database), {
        'controls': 'ONMOTOR',
        'mobilization': false,
        'telemetry/mobilization': false,
        'telemetry/motorStatus': 'Idle',
        'telemetry/sideLockStatus': 'UNLOCKED'
      });
      setTelemetry(prev => ({
        ...prev,
        mobilization: false,
        motorStatus: 'Idle',
        sideLockStatus: 'UNLOCKED',
        engineStatus: 'RUNNING'
      }));
    } catch (e) {
      console.error("Firebase control error:", e);
    }
  };

  const toggleSideLock = () => {
    addLog('INFO', 'Toggle Side Lock Command Dispatched to ESP32 Hardware');
    try {
      set(ref(database, 'controls'), 'TOGGLE_LOCK');
    } catch (e) {
      console.error("Firebase control error:", e);
    }
  };

  const triggerHorn = () => {
    addLog('INFO', 'Horn Command Dispatched to ESP32 Buzzer via Firebase');
    addAlert({
      iconType: 'phone',
      title: 'Horn Command Sent',
      description: 'Vehicle horn command sent to hardware buzzer.',
      severity: 'green'
    });
    try {
      set(ref(database, 'controls'), 'HORN');
    } catch (e) {
      console.error("Firebase control error:", e);
    }
  };

  const flashHeadlight = () => {
    addLog('INFO', 'Headlight Pulse Command Dispatched to ESP32 Relay');
    addAlert({
      iconType: 'shield',
      title: 'Headlight Pulse Command Sent',
      description: 'Strobe headlight command sent to ESP32.',
      severity: 'green'
    });
    try {
      set(ref(database, 'controls'), 'FLASH_HEADLIGHT');
    } catch (e) {
      console.error("Firebase control error:", e);
    }
  };

  const toggleEmergencyOverride = () => {
    setTelemetry(prev => {
      const nextOverride = !prev.emergencyOverride;
      addLog(nextOverride ? 'WARNING' : 'INFO', `Emergency Override ${nextOverride ? 'ENABLED' : 'DISABLED'}`);
      return {
        ...prev,
        emergencyOverride: nextOverride
      };
    });
  };

  const toggleSimulator = () => {
    setIsSimulatorActive(prev => !prev);
  };

  const clearAlerts = () => {
    setAlerts([]);
    addLog('INFO', 'Alert Notifications Cleared');
  };

  const markAlertAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        // Persist full settings to Firebase /settings node
        // ESP32 reads emergency contacts from /settings/emergencyContact1
        set(ref(database, 'settings'), updated);
      } catch (e) {
        console.error("Firebase settings sync error:", e);
      }
      return updated;
    });
    addLog('SUCCESS', 'System Configuration & Emergency Phone Synced to Firebase');
  };

  return (
    <TelemetryContext.Provider value={{
      telemetry,
      alerts,
      logs,
      historyData,
      immobilization,
      isSimulatorActive,
      settings,
      activeTab,
      setActiveTab,
      triggerRemoteStop,
      restartVehicle,
      toggleSideLock,
      triggerHorn,
      flashHeadlight,
      toggleEmergencyOverride,
      toggleSimulator,
      clearAlerts,
      markAlertAsRead,
      updateSettings,
      addLog,
      addAlert
    }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
