import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  esp32Online: true,
  networkOperator: "Airtel 4G IoT",
  
  vehicleStatus: "SAFE",
  sideLockStatus: "LOCKED",
  sideLockTriggerTime: undefined,
  vehicleSpeed: 18,
  motorRPM: 1250,
  engineStatus: "RUNNING",
  batteryVoltage: 12.4,
  batteryPercentage: 88,
  
  gsmSignal: "4G Connected",
  signalStrength: -65, // dBm
  simStatus: "SIM800L Ready",
  
  pwmOutput: 45,
  motorDirection: "FORWARD",
  motorCurrent: 3.8, // Amps
  motorDriverTemp: 42, // °C
  controllerVoltage: 12.2,
  immobilizerStatus: "ARMED",
  emergencyOverride: false,
  
  gpsLatitude: 11.0168,
  gpsLongitude: 76.9558,
  gpsAddress: "Cross Cut Road, Gandhipuram, Coimbatore, TN",
  gpsSpeed: 18,
  gpsAccuracy: 2.4,
  heading: 45,
  satelliteCount: 12,
  lastGpsUpdate: "Just now",

  commandLatencyMs: 42,
  currentAlarm: false,
  currentCommand: "IDLE"
};

const initialAlerts: SecurityAlert[] = [
  {
    id: "alt-1",
    iconType: "shield",
    title: "Vehicle Safe",
    description: "System diagnostics completed successfully. No threats detected.",
    timestamp: "10:20:00 AM",
    severity: "green",
    read: true
  },
  {
    id: "alt-2",
    iconType: "lock",
    title: "Side Lock Engaged",
    description: "Solenoid side lock locked automatically.",
    timestamp: "10:15:30 AM",
    severity: "green",
    read: true
  }
];

const initialLogs: SystemLog[] = [
  { id: "log-1", timestamp: "10:24:35", level: "INFO", message: "ESP32 Board Connected via Wi-Fi & MQTT" },
  { id: "log-2", timestamp: "10:24:36", level: "INFO", message: "SIM800L GSM Network Registered [Airtel 4G]" },
  { id: "log-3", timestamp: "10:24:37", level: "INFO", message: "Cloud Firebase RTDB Synchronization Active" },
  { id: "log-4", timestamp: "10:24:38", level: "SUCCESS", message: "Immobilizer Subsystem Armed & Ready" }
];

const initialSettings: SystemSettings = {
  ownerName: "Admin",
  emergencyContact1: "+91 98765 43210",
  emergencyContact2: "+91 91234 56789",
  smsEnabled: true,
  callEnabled: true,
  wifiSSID: "SmartIoT_Vehicle_5G",
  mqttServer: "mqtt.antitheft-iot.net:1883",
  firebaseUrl: "https://antitheft-9a300-default-rtdb.asia-southeast1.firebasedatabase.app",
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
  const [isSimulatorActive, setIsSimulatorActive] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  
  const [immobilization, setImmobilization] = useState<ImmobilizationProgress>({
    isStopping: false,
    stepIndex: 0,
    currentSpeed: 18,
    progressPercent: 0,
    estimatedSecondsLeft: 10,
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

  // Firebase Realtime Database Listener
  useEffect(() => {
    try {
      const telemetryRef = ref(database, 'telemetry');
      const unsubscribe = onValue(telemetryRef, (snapshot) => {
        const data = snapshot.val();
        if (data && !isSimulatorActive) {
          setTelemetry(prev => ({
            ...prev,
            ...data
          }));
        }
      }, (error) => {
        console.warn("Firebase listener notice:", error.message);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Firebase connection notice:", err);
    }
  }, [isSimulatorActive]);

  // Real-time chart data & telemetry simulator loop (runs every second)
  useEffect(() => {
    const interval = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });

      setTelemetry(prev => {
        if (!isSimulatorActive) return prev;
        
        let newSpeed = prev.vehicleSpeed;
        let newRpm = prev.motorRPM;

        if (immobilization.isStopping) {
          // Handled by immobilization timer
          return prev;
        }

        if (prev.engineStatus === 'RUNNING') {
          // Add slight organic speed fluctuations
          const delta = (Math.random() - 0.48) * 2;
          newSpeed = Math.max(12, Math.min(45, Math.round(prev.vehicleSpeed + delta)));
          newRpm = Math.round(newSpeed * 70 + (Math.random() * 50 - 25));
        } else {
          newSpeed = 0;
          newRpm = 0;
        }

        const newCurrent = Number((newSpeed > 0 ? 3.5 + (newSpeed / 10) + Math.random() * 0.4 : 0.2).toFixed(1));
        const newVoltage = Number((12.4 - (Math.random() * 0.05)).toFixed(2));
        
        // Slightly update lat/lng to simulate vehicle moving along Coimbatore road
        const latDelta = newSpeed > 0 ? 0.00003 * (Math.random() - 0.3) : 0;
        const lngDelta = newSpeed > 0 ? 0.00003 * (Math.random() - 0.2) : 0;

        const updated: TelemetryData = {
          ...prev,
          vehicleSpeed: newSpeed,
          motorRPM: newRpm,
          pwmOutput: newSpeed > 0 ? Math.min(100, Math.round((newSpeed / 50) * 100)) : 0,
          motorCurrent: newCurrent,
          batteryVoltage: newVoltage,
          gpsLatitude: prev.gpsLatitude + latDelta,
          gpsLongitude: prev.gpsLongitude + lngDelta,
          gpsSpeed: newSpeed,
          commandLatencyMs: Math.floor(35 + Math.random() * 15),
          lastGpsUpdate: "Just now"
        };

        // Append to historical graph data
        setHistoryData(historyPrev => {
          const nextData = [
            ...historyPrev.slice(-29),
            {
              time: timeStr,
              speed: newSpeed,
              rpm: newRpm,
              current: newCurrent,
              voltage: newVoltage
            }
          ];
          return nextData;
        });

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulatorActive, immobilization.isStopping]);

  // Handle Progressive Remote Immobilization Sequence
  const triggerRemoteStop = () => {
    if (immobilization.isStopping) return;

    addLog('WARNING', 'Remote Stop Command Received from Dashboard');
    addLog('INFO', 'ESP32 Acknowledgement Verified [Latency: 38ms]');
    addAlert({
      iconType: 'stop',
      title: 'Vehicle Stop Requested',
      description: 'Remote immobilization initiated by owner. Reducing speed gradually.',
      severity: 'orange'
    });

    const speedSteps = [18, 15, 12, 9, 6, 3, 0];
    let stepIndex = 0;

    setImmobilization({
      isStopping: true,
      stepIndex: 0,
      currentSpeed: speedSteps[0],
      progressPercent: 10,
      estimatedSecondsLeft: 10,
      statusText: 'Command Sent & ESP32 Ack Received',
      acknowledged: true
    });

    const stopInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < speedSteps.length) {
        const speed = speedSteps[stepIndex];
        const pct = Math.round(((stepIndex + 1) / speedSteps.length) * 100);
        const estSec = speedSteps.length - stepIndex;
        
        setTelemetry(prev => ({
          ...prev,
          vehicleSpeed: speed,
          motorRPM: Math.round(speed * 65),
          pwmOutput: Math.round((speed / 20) * 100),
          engineStatus: speed === 0 ? 'STOPPED' : 'RUNNING',
          motorCurrent: speed === 0 ? 0.1 : 1.5
        }));

        setImmobilization(prev => ({
          ...prev,
          stepIndex,
          currentSpeed: speed,
          progressPercent: pct,
          estimatedSecondsLeft: estSec,
          statusText: speed === 0 ? 'Motor OFF' : `Reducing Speed to ${speed} km/h`
        }));

        addLog('INFO', `Vehicle Slowing: ${speed} km/h`);
      } else {
        clearInterval(stopInterval);
        
        setTelemetry(prev => ({
          ...prev,
          vehicleSpeed: 0,
          motorRPM: 0,
          pwmOutput: 0,
          engineStatus: 'STOPPED',
          immobilizerStatus: 'ENGAGED',
          motorCurrent: 0,
          currentCommand: "MOTOR_DISABLED"
        }));

        setImmobilization({
          isStopping: false,
          stepIndex: speedSteps.length - 1,
          currentSpeed: 0,
          progressPercent: 100,
          estimatedSecondsLeft: 0,
          statusText: 'Motor Successfully Disabled',
          acknowledged: true
        });

        addLog('SUCCESS', 'Motor Successfully Stopped & Solenoid Locked');
        addAlert({
          iconType: 'stop',
          title: 'Motor Disabled',
          description: 'Vehicle safely immobilized. Engine state: STOPPED.',
          severity: 'red'
        });

        // Optionally update Firebase RTDB
        try {
          update(ref(database, 'controls'), {
            motorState: 'STOPPED',
            immobilizer: 'ENGAGED',
            lastUpdated: Date.now()
          });
        } catch (e) {
          // ignore firebase offline
        }
      }
    }, 1200);
  };

  const restartVehicle = () => {
    addLog('INFO', 'Restart Command Received. Verifying Owner Authorization...');
    setTimeout(() => {
      setTelemetry(prev => ({
        ...prev,
        engineStatus: 'RUNNING',
        vehicleSpeed: 12,
        motorRPM: 850,
        pwmOutput: 30,
        immobilizerStatus: 'ARMED',
        vehicleStatus: 'SAFE'
      }));
      setImmobilization(prev => ({
        ...prev,
        isStopping: false,
        statusText: 'Ready'
      }));
      addLog('SUCCESS', 'Engine Relays Engaged. Vehicle Restarted Safely.');
      addAlert({
        iconType: 'shield',
        title: 'Vehicle Restarted',
        description: 'Authorized engine restart successful.',
        severity: 'green'
      });
    }, 800);
  };

  const toggleSideLock = () => {
    setTelemetry(prev => {
      const isLocked = prev.sideLockStatus === 'LOCKED';
      const nextStatus = isLocked ? 'BROKEN' : 'LOCKED';
      const timeStr = new Date().toLocaleTimeString();

      if (nextStatus === 'BROKEN') {
        addLog('WARNING', 'Side Lock Tamper Sensor Triggered!');
        addLog('INFO', 'Automatic Security SMS Sent to Emergency Contact');
        addLog('INFO', 'Emergency Call Initiated to +91 98765 43210');
        addAlert({
          iconType: 'warning',
          title: 'Side Lock Broken',
          description: 'Physical tampering detected on handlebar side lock.',
          severity: 'red'
        });
      } else {
        addLog('SUCCESS', 'Side Lock Sensor Reset & Secured');
      }

      return {
        ...prev,
        sideLockStatus: nextStatus,
        sideLockTriggerTime: nextStatus === 'BROKEN' ? timeStr : undefined,
        vehicleStatus: nextStatus === 'BROKEN' ? 'THREAT_DETECTED' : 'SAFE'
      };
    });
  };

  const triggerHorn = () => {
    addLog('INFO', 'Horn Command Dispatched -> ESP32 Buzzer Active (3s)');
    addAlert({
      iconType: 'phone',
      title: 'Horn Activated',
      description: 'Vehicle horn sounded remotely.',
      severity: 'green'
    });
  };

  const flashHeadlight = () => {
    addLog('INFO', 'Headlight Pulse Command Dispatched -> 4x Strobe Flash');
    addAlert({
      iconType: 'shield',
      title: 'Headlights Flashed',
      description: 'Strobe headlights flashed remotely.',
      severity: 'green'
    });
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
    setIsSimulatorActive(prev => {
      const next = !prev;
      addLog('INFO', `Telemetry Mode Switch: ${next ? 'Live Simulation Stream' : 'Firebase RTDB Sync'}`);
      return next;
    });
  };

  const clearAlerts = () => {
    setAlerts([]);
    addLog('INFO', 'Alert Notifications Cleared');
  };

  const markAlertAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addLog('SUCCESS', 'System Parameters Updated Successfully');
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
