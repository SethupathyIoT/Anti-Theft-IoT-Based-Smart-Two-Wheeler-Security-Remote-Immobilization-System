import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// Smooth interpolation helper — eases toward target value at 60fps
function useSmoothValue(target: number, speed: number = 0.08): number {
  const [display, setDisplay] = useState(target);
  const currentRef = useRef(target);
  const rafRef = useRef<number>(0);

  const animate = useCallback(() => {
    const diff = target - currentRef.current;
    if (Math.abs(diff) < 0.005) {
      currentRef.current = target;
      setDisplay(target);
      return;
    }
    currentRef.current += diff * speed;
    setDisplay(currentRef.current);
    rafRef.current = requestAnimationFrame(animate);
  }, [target, speed]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  return display;
}

// Arc geometry helpers
const CX = 100;
const CY = 100;
const RADIUS = 78;
const ARC_START_ANGLE = 135;  // degrees (7:30 position)
const ARC_SWEEP = 270;        // degrees of total arc sweep
const MAX_SPEED = 10;

function polarToXY(angleDeg: number, r: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function speedToAngle(speed: number): number {
  return ARC_START_ANGLE + (speed / MAX_SPEED) * ARC_SWEEP;
}

// Describe SVG arc path
function describeArc(startAngle: number, endAngle: number, r: number): string {
  const start = polarToXY(startAngle, r);
  const end = polarToXY(endAngle, r);
  const sweep = endAngle - startAngle;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export const SpeedometerGauge: React.FC = () => {
  const { telemetry, historyData } = useTelemetry();

  const rawSpeed = Number(telemetry.vehicleSpeed) || 0;
  const clampedSpeed = Math.min(MAX_SPEED, Math.max(0, rawSpeed));

  // Smooth animated values (60fps interpolation)
  const smoothSpeed = useSmoothValue(clampedSpeed, 0.07);
  const smoothNeedleAngle = useSmoothValue(speedToAngle(clampedSpeed), 0.06);

  // Arc paths
  const trackPath = describeArc(ARC_START_ANGLE, ARC_START_ANGLE + ARC_SWEEP, RADIUS);
  const valuePath = smoothSpeed > 0.01
    ? describeArc(ARC_START_ANGLE, speedToAngle(smoothSpeed), RADIUS)
    : '';

  // Needle tip coordinates
  const needleTip = polarToXY(smoothNeedleAngle, RADIUS - 10);
  const needleTail = polarToXY(smoothNeedleAngle + 180, 14);
  const needleLeft = polarToXY(smoothNeedleAngle + 90, 3.5);
  const needleRight = polarToXY(smoothNeedleAngle - 90, 3.5);

  // Major ticks: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
  const majorTicks = Array.from({ length: 11 }, (_, i) => i);
  // Minor ticks between majors
  const minorTicks = Array.from({ length: 41 }, (_, i) => i * 0.25).filter(v => v % 1 !== 0);

  // Speed zone color
  const getSpeedColor = (s: number): string => {
    if (s <= 3) return '#22C55E';   // green — safe
    if (s <= 6) return '#3B82F6';   // blue — normal
    if (s <= 8) return '#F59E0B';   // amber — caution
    return '#EF4444';               // red — limit
  };

  const currentColor = getSpeedColor(smoothSpeed);

  return (
    <div className="space-y-6">
      {/* Radial Speedometer & RPM Gauge Card */}
      <div className="glass-card p-6 relative overflow-hidden flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Speed & RPM Gauge</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              0 – {MAX_SPEED} km/h
            </span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              PWM: {telemetry.pwmOutput}%
            </span>
          </div>
        </div>

        {/* SVG Speedometer */}
        <div className="relative w-80 h-80 flex items-center justify-center select-none">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              {/* Gradient for the active arc */}
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22C55E" />
                <stop offset="40%" stopColor="#3B82F6" />
                <stop offset="75%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
              {/* Glow filter for the active arc */}
              <filter id="arcGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              {/* Glow for needle tip */}
              <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              {/* Radial glow behind center */}
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={currentColor} stopOpacity="0.2" />
                <stop offset="100%" stopColor={currentColor} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Subtle outer ring */}
            <circle cx={CX} cy={CY} r={RADIUS + 12} fill="none" stroke="#0F1A2E" strokeWidth="0.5" />

            {/* Background track arc */}
            <path
              d={trackPath}
              fill="none"
              stroke="#1A2744"
              strokeWidth="10"
              strokeLinecap="round"
            />

            {/* Inner shadow track */}
            <path
              d={trackPath}
              fill="none"
              stroke="#0D1526"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Minor tick marks */}
            {minorTicks.map((val) => {
              const angle = speedToAngle(val);
              const outer = polarToXY(angle, RADIUS + 2);
              const inner = polarToXY(angle, RADIUS - 3);
              return (
                <line
                  key={`minor-${val}`}
                  x1={outer.x} y1={outer.y}
                  x2={inner.x} y2={inner.y}
                  stroke="#1E2D4A"
                  strokeWidth="0.5"
                />
              );
            })}

            {/* Major tick marks */}
            {majorTicks.map((val) => {
              const angle = speedToAngle(val);
              const outer = polarToXY(angle, RADIUS + 4);
              const inner = polarToXY(angle, RADIUS - 6);
              const isActive = smoothSpeed >= val;
              return (
                <line
                  key={`major-${val}`}
                  x1={outer.x} y1={outer.y}
                  x2={inner.x} y2={inner.y}
                  stroke={isActive ? currentColor : '#2A3A5C'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity={isActive ? 1 : 0.5}
                />
              );
            })}

            {/* Major tick labels */}
            {majorTicks.filter((_, i) => i % 2 === 0).map((val) => {
              const angle = speedToAngle(val);
              const pos = polarToXY(angle, RADIUS + 16);
              const isActive = smoothSpeed >= val;
              return (
                <text
                  key={`label-${val}`}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="7"
                  fontWeight="700"
                  fontFamily="ui-monospace, monospace"
                  fill={isActive ? '#CBD5E1' : '#475569'}
                >
                  {val}
                </text>
              );
            })}

            {/* Active value arc — with glow */}
            {smoothSpeed > 0.01 && (
              <>
                {/* Glow layer */}
                <path
                  d={valuePath}
                  fill="none"
                  stroke="url(#gaugeGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  filter="url(#arcGlow)"
                  opacity="0.5"
                />
                {/* Main arc */}
                <path
                  d={valuePath}
                  fill="none"
                  stroke="url(#gaugeGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Center ambient glow circle */}
            <circle cx={CX} cy={CY} r="28" fill="url(#centerGlow)" />

            {/* Needle — SVG polygon for pixel-perfect rendering */}
            <polygon
              points={`${needleTip.x},${needleTip.y} ${needleLeft.x},${needleLeft.y} ${needleTail.x},${needleTail.y} ${needleRight.x},${needleRight.y}`}
              fill={currentColor}
              filter="url(#needleGlow)"
              opacity="0.95"
            />

            {/* Center hub outer ring */}
            <circle cx={CX} cy={CY} r="9" fill="#0B1220" stroke="#1E2D4A" strokeWidth="1.5" />
            {/* Center hub inner dot */}
            <circle cx={CX} cy={CY} r="4" fill={currentColor} opacity="0.9" />
            {/* Center hub highlight */}
            <circle cx={CX} cy={CY} r="2" fill="white" opacity="0.3" />
          </svg>

          {/* Central Digital Display — overlaid on SVG */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none" style={{ paddingTop: '72px' }}>
            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-[0.2em]">SPEED</span>
            <div className="flex items-baseline gap-1">
              <span
                className="text-5xl font-black font-mono tracking-tighter drop-shadow-lg"
                style={{ color: currentColor }}
              >
                {smoothSpeed.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400">km/h</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <Zap className="w-3 h-3" />
              <span>{telemetry.motorRPM} RPM</span>
            </div>
          </div>
        </div>

        {/* Sub-metrics row */}
        <div className="w-full grid grid-cols-3 gap-3 pt-4 border-t border-[#1E2D4A]/60 text-center">
          <div className="p-2.5 rounded-xl bg-[#0B1220]/60 border border-[#1E2D4A]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Direction</span>
            <span className="text-xs font-bold text-blue-400 flex items-center justify-center gap-1 mt-0.5">
              <Compass className="w-3 h-3" />
              {telemetry.motorDirection}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0B1220]/60 border border-[#1E2D4A]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">PWM Output</span>
            <span className="text-xs font-bold text-emerald-400 mt-0.5 block font-mono">{telemetry.pwmOutput}%</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0B1220]/60 border border-[#1E2D4A]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Draw</span>
            <span className="text-xs font-bold text-amber-400 mt-0.5 block font-mono">{telemetry.motorCurrent} A</span>
          </div>
        </div>
      </div>

      {/* Real-time Line Chart */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Real-Time Telemetry Trends</h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Speed (0–10)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> RPM (÷100)
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
                <YAxis stroke="#64748B" tick={{ fontSize: 10 }} domain={[0, 10]} />
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
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey={(d: Record<string, number>) => Math.min(10, Math.round(d.rpm / 100))}
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={false}
                  name="RPM (÷100)"
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
