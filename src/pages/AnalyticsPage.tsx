import React from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Activity, Gauge, Zap, BatteryCharging, Signal } from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const AnalyticsPage: React.FC = () => {
  const { historyData, telemetry, alerts } = useTelemetry();

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1E2D4A] pb-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-400" />
          IoT Telemetry & Performance Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Historical trends, motor load curves, battery discharge, and live sensor feeds
        </p>
      </div>

      {/* Top 2 Real Hardware KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Live Vehicle Speed</span>
          <div className="text-2xl font-black text-blue-400 font-mono mt-1">{telemetry.vehicleSpeed} km/h</div>
          <span className="text-[11px] text-slate-400 font-medium">Motor RPM: {telemetry.motorRPM}</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Security Alerts</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">{alerts.length} Events</div>
          <span className="text-[11px] text-amber-400 font-medium">
            {telemetry.sideLockStatus === 'BROKEN' ? 'Tamper Active' : 'System Secure'}
          </span>
        </div>
      </div>

      {/* Real-time Hardware Telemetry Buffer Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Live Speed Buffer (km/h)
          </h3>
          <div className="h-64">
            {historyData.length < 2 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Awaiting live sensor stream from ESP32...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                  <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#131C2E', borderColor: '#1E2D4A', fontSize: '12px' }} />
                  <Bar dataKey="speed" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Speed (km/h)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Motor RPM Buffer */}
        <div className="glass-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Motor Speed & RPM Curve
          </h3>
          <div className="h-64">
            {historyData.length < 2 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Awaiting live motor RPM stream...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                  <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#131C2E', borderColor: '#1E2D4A', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="rpm" stroke="#22C55E" strokeWidth={2.5} dot={false} name="RPM" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
