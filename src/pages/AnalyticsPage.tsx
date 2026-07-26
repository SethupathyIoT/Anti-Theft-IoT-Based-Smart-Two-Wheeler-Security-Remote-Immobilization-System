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

const weeklyData = [
  { day: 'Mon', speed: 22, battery: 12.6, alerts: 1, distance: 14.2 },
  { day: 'Tue', speed: 28, battery: 12.5, alerts: 0, distance: 18.5 },
  { day: 'Wed', speed: 32, battery: 12.4, alerts: 2, distance: 24.0 },
  { day: 'Thu', speed: 18, battery: 12.4, alerts: 0, distance: 12.8 },
  { day: 'Fri', speed: 35, battery: 12.3, alerts: 1, distance: 29.4 },
  { day: 'Sat', speed: 42, battery: 12.2, alerts: 3, distance: 38.1 },
  { day: 'Sun', speed: 25, battery: 12.4, alerts: 0, distance: 19.6 },
];

export const AnalyticsPage: React.FC = () => {
  const { historyData, telemetry } = useTelemetry();

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1E2D4A] pb-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-400" />
          IoT Telemetry & Performance Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Historical trends, weekly activity metrics, battery discharge, and signal diagnostic logs
        </p>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Weekly Distance</span>
          <div className="text-2xl font-black text-blue-400 font-mono mt-1">156.6 km</div>
          <span className="text-[11px] text-emerald-400 font-medium">↑ +12.4% vs last week</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Avg Daily Speed</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">28.9 km/h</div>
          <span className="text-[11px] text-slate-400 font-medium">Peak: 45 km/h</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Security Alerts</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">7 Events</div>
          <span className="text-[11px] text-amber-400 font-medium">1 Lock Tamper Trigger</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">System Uptime</span>
          <div className="text-2xl font-black text-purple-400 font-mono mt-1">99.8%</div>
          <span className="text-[11px] text-emerald-400 font-medium">ESP32 & GSM Stable</span>
        </div>
      </div>

      {/* Weekly Activity & Distance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Weekly Distance Traveled (km)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                <XAxis dataKey="day" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#131C2E', borderColor: '#1E2D4A', fontSize: '12px' }} />
                <Bar dataKey="distance" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Battery Discharge & Voltage Spectrum */}
        <div className="glass-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Battery Health & Voltage Spectrum (7-Day Trend)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                <XAxis dataKey="day" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} domain={[11.5, 13.0]} />
                <Tooltip contentStyle={{ backgroundColor: '#131C2E', borderColor: '#1E2D4A', fontSize: '12px' }} />
                <Line type="monotone" dataKey="battery" stroke="#22C55E" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
