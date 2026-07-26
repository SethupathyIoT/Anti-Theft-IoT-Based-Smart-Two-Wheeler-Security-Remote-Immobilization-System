import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Activity, Gauge, Zap, Compass } from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const SpeedometerGauge: React.FC = () => {
  const { telemetry, historyData } = useTelemetry();

  // SVG Gauge calculations (0 to 80 km/h range mapped to 220 degree arc)
  const maxSpeed = 80;
  const currentSpeed = Math.min(maxSpeed, Math.max(0, telemetry.vehicleSpeed));
  const speedPercentage = currentSpeed / maxSpeed;
  
  // Circumference for radius R = 75
  const radius = 75;
  const circumference = 2 * Math.PI * radius; // ~471
  const maxArcLength = circumference * (220 / 360); // ~288
  const strokeDashoffset = maxArcLength * (1 - speedPercentage);

  return (
    <div className="space-y-6">
      {/* Radial Speedometer & RPM Gauge Card */}
      <div className="glass-card p-6 relative overflow-hidden flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Speed & RPM Gauge</h3>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            PWM: {telemetry.pwmOutput}%
          </span>
        </div>

        {/* Circular SVG Gauge */}
        <div className="relative w-64 h-64 flex items-center justify-center my-2">
          <svg className="w-full h-full transform -rotate-110" viewBox="0 0 200 200">
            {/* Outer Track Arc */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="#1E2D4A"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${maxArcLength} ${circumference}`}
            />
            {/* Animated Dynamic Value Arc */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="url(#speedGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${maxArcLength} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="70%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>
          </svg>

          {/* Central Gauge Text Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">CURRENT SPEED</span>
            <div className="flex items-baseline gap-1 my-0.5">
              <span className="text-4xl font-black text-white font-mono tracking-tight drop-shadow-md">
                {telemetry.vehicleSpeed}
              </span>
              <span className="text-sm font-bold text-blue-400">km/h</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <Zap className="w-3.5 h-3.5" />
              <span>{telemetry.motorRPM} RPM</span>
            </div>
          </div>
        </div>

        {/* Below Gauge Sub-metrics */}
        <div className="w-full grid grid-cols-3 gap-3 pt-4 border-t border-[#1E2D4A]/60 text-center">
          <div className="p-2 rounded-xl bg-[#0B1220]/60 border border-[#1E2D4A]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Direction</span>
            <span className="text-xs font-bold text-blue-400 flex items-center justify-center gap-1 mt-0.5">
              <Compass className="w-3 h-3" />
              {telemetry.motorDirection}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-[#0B1220]/60 border border-[#1E2D4A]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">PWM Output</span>
            <span className="text-xs font-bold text-emerald-400 mt-0.5 block font-mono">
              {telemetry.pwmOutput}%
            </span>
          </div>

          <div className="p-2 rounded-xl bg-[#0B1220]/60 border border-[#1E2D4A]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Draw</span>
            <span className="text-xs font-bold text-amber-400 mt-0.5 block font-mono">
              {telemetry.motorCurrent} A
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Line Chart: Speed vs Time & RPM vs Time */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Real-Time Telemetry Trends</h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Speed (km/h)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> RPM (/100)
            </span>
          </div>
        </div>

        <div className="h-52 w-full">
          {historyData.length < 2 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Initializing live stream data buffer...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10 }} domain={[0, 'dataMax + 10']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#131C2E', borderColor: '#1E2D4A', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="speed" 
                  stroke="#3B82F6" 
                  strokeWidth={2.5} 
                  dot={false}
                  activeDot={{ r: 5, fill: '#3B82F6' }} 
                  name="Speed (km/h)"
                />
                <Line 
                  type="monotone" 
                  dataKey={(d) => Math.round(d.rpm / 50)} 
                  stroke="#22C55E" 
                  strokeWidth={2} 
                  dot={false} 
                  name="RPM (/50)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
