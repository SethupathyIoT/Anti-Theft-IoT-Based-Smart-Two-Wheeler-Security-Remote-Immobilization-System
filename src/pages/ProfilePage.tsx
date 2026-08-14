import React from 'react';
import { User, ShieldCheck, Cpu, Radio, Award, Clock } from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const ProfilePage: React.FC = () => {
  const { telemetry } = useTelemetry();

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1E2D4A] pb-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <User className="w-6 h-6 text-blue-400" />
          Vehicle Owner & IoT Device Profile
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Registered owner specifications, hardware serial numbers, and subscription details
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Owner Profile Card */}
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-1 shadow-xl shadow-blue-500/20">
            <div className="w-full h-full bg-[#0B1220] rounded-[14px] flex items-center justify-center font-black text-4xl text-blue-400">
              S
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{telemetry.owner}</h3>
            <p className="text-xs text-blue-400 font-semibold mt-0.5">Primary Registered Vehicle Owner</p>
          </div>

          <div className="w-full pt-4 border-t border-[#1E2D4A] space-y-2 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-slate-400">Vehicle ID:</span>
              <span className="font-mono text-blue-400 font-bold">{telemetry.vehicleId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Registration:</span>
              <span className="text-amber-400 font-mono font-bold">{telemetry.registration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Model:</span>
              <span className="text-slate-200 font-medium">{telemetry.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Subscription:</span>
              <span className="text-emerald-400 font-bold">Enterprise Lifetime</span>
            </div>
          </div>
        </div>

        {/* ESP32 Hardware Diagnostics */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#1E2D4A] pb-3">
            <Cpu className="w-4 h-4 text-emerald-400" />
            ESP32 Microcontroller Diagnostic
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#1E2D4A]/40">
              <span className="text-slate-400">Board Status:</span>
              <span className={`font-bold flex items-center gap-1 ${
                telemetry.esp32Online ? 'text-emerald-400' : 'text-red-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  telemetry.esp32Online ? 'bg-emerald-400 animate-ping' : 'bg-red-400'
                }`}></span>
                {telemetry.esp32Online ? 'Online & Connected' : 'Hardware Offline'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#1E2D4A]/40">
              <span className="text-slate-400">Firmware:</span>
              <span className="font-mono text-white font-bold">{telemetry.firmwareVersion}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#1E2D4A]/40">
              <span className="text-slate-400">Local IP:</span>
              <span className="font-mono text-blue-400">192.168.1.104</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Flash Memory:</span>
              <span className="font-mono text-slate-300">4 MB Dual SPI</span>
            </div>
          </div>
        </div>

        {/* SIM & GSM Network Specs */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#1E2D4A] pb-3">
            <Radio className="w-4 h-4 text-purple-400" />
            SIM800L GSM Module Metadata
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#1E2D4A]/40">
              <span className="text-slate-400">GSM Operator:</span>
              <span className="text-slate-200 font-bold">{telemetry.networkOperator}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#1E2D4A]/40">
              <span className="text-slate-400">Signal RSSI:</span>
              <span className="font-mono text-purple-400 font-bold">{telemetry.signalStrength} dBm (Excellent)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">SIM ICCID:</span>
              <span className="font-mono text-slate-400 text-[10px]">8991400038291048102F</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
