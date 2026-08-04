import React, { useState } from 'react';
import { 
  Sliders, 
  Volume2, 
  Sun, 
  Lock, 
  Unlock, 
  RotateCcw, 
  Cpu, 
  Zap, 
  ShieldAlert 
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const ControlPage: React.FC = () => {
  const { 
    telemetry, 
    triggerRemoteStop, 
    restartVehicle, 
    toggleSideLock, 
    triggerHorn, 
    flashHeadlight, 
    addLog 
  } = useTelemetry();

  const [testPwm, setTestPwm] = useState<number>(telemetry.pwmOutput);

  const handleApplyPwm = () => {
    addLog('INFO', `Manual PWM Test Output set to ${testPwm}% via Control Console`);
    alert(`PWM Duty Cycle set to ${testPwm}% on ESP32 GPIO18`);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1E2D4A] pb-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Sliders className="w-6 h-6 text-blue-400" />
          Vehicle Actuator & Relay Diagnostic Console
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Direct hardware relay overrides, solenoid actuator testing, and PWM modulation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actuator Controls */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#1E2D4A] pb-3">
            Hardware Actuators
          </h3>

          {/* Side Lock Solenoid Testing */}
          <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1E2D4A] flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Solenoid Side Lock</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Current Status: <strong className={telemetry.sideLockStatus === 'LOCKED' ? 'text-emerald-400' : 'text-red-400'}>{telemetry.sideLockStatus}</strong>
              </p>
            </div>
            <button
              onClick={toggleSideLock}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2"
            >
              {telemetry.sideLockStatus === 'LOCKED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>Toggle Lock</span>
            </button>
          </div>
        </div>

        {/* PWM & Speed Modulation */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#1E2D4A] pb-3">
            Motor PWM Modulation
          </h3>

          <div className="space-y-4 bg-[#0B1220] p-5 rounded-xl border border-[#1E2D4A]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300">PWM Output Ratio</span>
              <span className="text-lg font-black text-blue-400 font-mono">{testPwm}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={testPwm}
              onChange={(e) => setTestPwm(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0% (STOP)</span>
              <span>50% (ECO)</span>
              <span>100% (FULL)</span>
            </div>

            <button
              onClick={handleApplyPwm}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
            >
              Apply PWM Signal to ESP32 Motor Driver
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#0B1220] border border-[#1E2D4A]">
              <span className="text-slate-400 block">Motor Relay</span>
              <strong className="text-emerald-400 font-bold mt-1 block">CLOSED (Active)</strong>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1220] border border-[#1E2D4A]">
              <span className="text-slate-400 block">Ignition Cutoff Relay</span>
              <strong className="text-blue-400 font-bold mt-1 block">READY (Normal)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
