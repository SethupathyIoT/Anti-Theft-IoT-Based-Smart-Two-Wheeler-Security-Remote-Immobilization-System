import React, { useEffect, useRef, useState } from 'react';
import { Shield, Radio, Zap } from 'lucide-react';

export const HeroRaceHUD: React.FC = () => {
  const [speed, setSpeed] = useState(0);
  const [phase, setPhase] = useState('ORBIT SCAN');
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const phases = ['ORBIT SCAN', 'HERO REVEAL', 'LOW ANGLE', 'TOP TRACK', 'SIDE SWEEP', 'LOCK TARGET'];
    let phaseIdx = 0;

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const cycle = elapsed % 30;
      setSpeed(Math.round(80 + Math.sin(elapsed * 2.5) * 40 + Math.sin(elapsed * 0.7) * 20));
      phaseIdx = Math.floor((cycle / 30) * phases.length) % phases.length;
      setPhase(phases[phaseIdx]);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div className="hero-race-hud absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {/* Top HUD bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-blue-500/20 px-3 py-1.5 rounded-lg">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-400 tracking-widest">TRACKING ACTIVE</span>
        </div>
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-blue-500/20 px-3 py-1.5 rounded-lg">
          <Shield className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] font-mono text-blue-300 tracking-widest hidden sm:inline">{phase}</span>
        </div>
      </div>

      {/* Speed counter */}
      <div className="absolute bottom-8 left-6 md:left-10">
        <div className="bg-black/50 backdrop-blur-md border border-blue-500/25 rounded-xl px-4 py-3 min-w-[100px]">
          <span className="text-[9px] font-mono text-slate-400 tracking-widest block uppercase">Sim Speed</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl md:text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 tabular-nums">
              {speed}
            </span>
            <span className="text-xs font-mono text-blue-400/70">km/h</span>
          </div>
        </div>
      </div>

      {/* Anti-theft status */}
      <div className="absolute bottom-8 right-6 md:right-10">
        <div className="bg-black/50 backdrop-blur-md border border-emerald-500/25 rounded-xl px-4 py-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <div>
            <span className="text-[9px] font-mono text-slate-400 tracking-widest block">IMMObilize</span>
            <span className="text-xs font-bold font-mono text-emerald-400">ARMED</span>
          </div>
        </div>
      </div>

      {/* Speed tunnel lines (CSS) */}
      <div className="hero-speed-tunnel absolute inset-0" />

      {/* Vignette */}
      <div className="absolute inset-0 hero-vignette" />
    </div>
  );
};
