import React from 'react';
import { MapPin, Radio } from 'lucide-react';

export const HeroSecurityOverlay: React.FC = () => {
  return (
    <div className="hero-security-overlay absolute inset-0 pointer-events-none overflow-hidden z-[2]">
      {/* Radar scanning rings — centered behind bike */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="hero-radar-ring hero-radar-ring-1" />
        <div className="hero-radar-ring hero-radar-ring-2" />
        <div className="hero-radar-ring hero-radar-ring-3" />
        <div className="hero-radar-sweep" />
      </div>

      {/* GPS tracking pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="hero-pulse-ring" />
        <div className="hero-pulse-ring hero-pulse-ring-delay" />
      </div>

      {/* Subtle route trace */}
      <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
        <path
          d="M 100 350 Q 200 280 350 300 T 550 250 T 700 200"
          fill="none"
          stroke="url(#routeGradient)"
          strokeWidth="1"
          strokeDasharray="8 6"
          className="hero-route-path"
        />
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
            <stop offset="50%" stopColor="#60A5FA" stopOpacity="1" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Glowing GPS location pin */}
      <div className="absolute top-[16%] right-[10%] md:right-[14%] hero-float-icon">
        <div className="relative">
          <div className="hero-gps-pulse absolute inset-0 rounded-full" />
          <div className="relative bg-blue-500/15 backdrop-blur-md border border-blue-400/30 p-2.5 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            <MapPin className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          </div>
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-mono text-blue-400/60 whitespace-nowrap tracking-wider">
            LIVE GPS
          </span>
        </div>
      </div>

      {/* Digital HUD readout */}
      <div className="absolute top-[16%] left-[10%] md:left-[14%] hero-float-icon hero-float-icon-delay">
        <div className="bg-black/30 backdrop-blur-md border border-blue-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="text-[9px] font-mono text-emerald-400/70 tracking-widest">TRACKING</span>
        </div>
      </div>

      {/* Center-bottom ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-24 bg-gradient-to-t from-blue-500/15 via-blue-600/5 to-transparent blur-2xl" />
    </div>
  );
};
