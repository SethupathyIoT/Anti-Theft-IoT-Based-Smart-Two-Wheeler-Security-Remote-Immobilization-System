import React from 'react';
import { 
  Activity, 
  Cpu, 
  Radio, 
  Zap, 
  Gauge, 
  Thermometer, 
  BatteryCharging 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useTelemetry } from '../context/TelemetryContext';

export const LiveMonitorPage: React.FC = () => {
  const { telemetry, historyData } = useTelemetry();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#1E2D4A] pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-400" />
            High-Frequency Live Sensor Oscilloscope
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry waveform stream & ESP32 raw sensor feeds
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#131C2E] border border-blue-500/30 px-3.5 py-1.5 rounded-full text-xs text-blue-400 font-mono font-semibold">
          <Radio className="w-3.5 h-3.5 animate-pulse text-blue-400" />
          <span>Sampling Rate: 1000 ms</span>
        </div>
      </div>

      {/* Main Sensor Waveforms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Speed & Motor RPM Oscilloscope */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-400" />
              Vehicle Speed Waveform (km/h)
            </span>
            <span className="text-sm font-black text-blue-400 font-mono">{telemetry.vehicleSpeed} km/h</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="speedArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#131C2E', borderColor: '#1E2D4A', fontSize: '12px' }} />
                <Area type="monotone" dataKey="speed" stroke="#3B82F6" fillOpacity={1} fill="url(#speedArea)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Motor Current & Power Load Waveform */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Motor Current Load Waveform (Amps)
            </span>
            <span className="text-sm font-black text-amber-400 font-mono">{telemetry.motorCurrent} A</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="currentArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#131C2E', borderColor: '#1E2D4A', fontSize: '12px' }} />
                <Area type="monotone" dataKey="current" stroke="#F59E0B" fillOpacity={1} fill="url(#currentArea)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sensor Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase block">ESP32 Core Temp</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{telemetry.motorDriverTemp} °C</span>
            <Thermometer className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase block">Battery Voltage</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-blue-400">{telemetry.batteryVoltage} V</span>
            <BatteryCharging className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase block">GSM Signal RSSI</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-purple-400">{telemetry.signalStrength} dBm</span>
            <Radio className="w-6 h-6 text-purple-400" />
          </div>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase block">Immobilizer Relay</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xl font-bold text-emerald-400">{telemetry.immobilizerStatus}</span>
            <Cpu className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
