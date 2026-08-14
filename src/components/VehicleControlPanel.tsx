import React, { useState } from 'react';
import { 
  OctagonAlert, 
  RotateCcw, 
  Volume2, 
  Sun, 
  ShieldAlert, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  Radio, 
  Sliders, 
  Thermometer, 
  Zap, 
  Activity, 
  Lock 
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const VehicleControlPanel: React.FC = () => {
  const { 
    telemetry, 
    immobilization, 
    triggerRemoteStop, 
    restartVehicle, 
    triggerHorn, 
    flashHeadlight, 
    toggleEmergencyOverride 
  } = useTelemetry();

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const handleStopClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmStop = () => {
    setShowConfirmModal(false);
    triggerRemoteStop();
  };

  const isStopped = telemetry.engineStatus === 'STOPPED';

  return (
    <div className="space-y-6">
      {/* Primary Vehicle Remote Immobilization Panel */}
      <div className="glass-card p-6 border-red-500/30 relative overflow-hidden flex flex-col items-center text-center">
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Remote Immobilization</h3>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
            telemetry.immobilizerStatus === 'ENGAGED' 
              ? 'bg-red-500/20 text-red-400 border-red-500/30' 
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}>
            Immobilizer: {telemetry.immobilizerStatus}
          </span>
        </div>

        {/* Large Glowing Red Emergency STOP Button */}
        <div className="my-3 w-full flex flex-col items-center">
          <button
            onClick={handleStopClick}
            className="w-48 h-48 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 text-white font-black text-xl flex flex-col items-center justify-center gap-2 shadow-2xl transition-all duration-300 transform active:scale-95 btn-emergency-pulse hover:scale-105 border-4 border-red-400/50 cursor-pointer"
          >
            <OctagonAlert className="w-12 h-12 text-white animate-bounce" />
            <span className="tracking-wider text-2xl font-extrabold">STOP VEHICLE</span>
            <span className="text-[10px] font-semibold text-red-100 uppercase tracking-widest bg-red-900/40 px-2 py-0.5 rounded-full">
              EMERGENCY CUTOFF
            </span>
          </button>

          <p className="text-xs text-slate-300 mt-4 max-w-xs font-medium">
            Gradually reduce motor PWM speed and safely bring the vehicle to a full stop.
          </p>
        </div>

        {/* Active Immobilization Timeline & Progress Display */}
        {(immobilization.isStopping || immobilization.progressPercent > 0) && (
          <div className="w-full mt-5 p-4 rounded-xl bg-[#0B1220] border border-red-500/30 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <Radio className="w-4 h-4 animate-spin text-red-400" />
                {immobilization.statusText}
              </span>
              <span className="text-xs font-mono text-slate-400 font-semibold">
                {immobilization.progressPercent}%
              </span>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-3 border border-slate-700">
              <div 
                className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${immobilization.progressPercent}%` }}
              />
            </div>

            {/* Timeline Speed Decrement Steps */}
            <div className="grid grid-cols-7 gap-1 text-center my-3">
              {[18, 15, 12, 9, 6, 3, 0].map((spd, idx) => {
                const isPassed = immobilization.currentSpeed <= spd && immobilization.isStopping;
                const isCurrent = immobilization.currentSpeed === spd;
                return (
                  <div 
                    key={idx} 
                    className={`py-1.5 px-0.5 rounded-lg border text-[10px] font-mono font-bold transition-all ${
                      isCurrent 
                        ? 'bg-red-500 text-white border-red-400 scale-110 shadow-lg shadow-red-500/40' 
                        : isPassed 
                        ? 'bg-red-950/40 text-red-400 border-red-900/50' 
                        : 'bg-[#131C2E] text-slate-500 border-[#1E2D4A]'
                    }`}
                  >
                    {spd === 0 ? 'OFF' : `${spd}k`}
                  </div>
                );
              })}
            </div>

            {/* ESP32 Ack & Latency metadata */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#1E2D4A]">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ESP32 Ack: Verified
              </span>
              <span>Latency: <strong className="text-white font-mono">{telemetry.commandLatencyMs} ms</strong></span>
              <span>Est: <strong className="text-amber-400 font-mono">{immobilization.estimatedSecondsLeft}s</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Motor & Controller Diagnostic Telemetry */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3.5">
          <span className="text-[11px] text-slate-400 font-semibold block">Driver Temp</span>
          <div className="flex items-center gap-2 mt-1">
            <Thermometer className="w-4 h-4 text-rose-400" />
            <span className="text-base font-bold text-white font-mono">{telemetry.motorDriverTemp || 32} °C</span>
          </div>
        </div>

        <div className="glass-card p-3.5">
          <span className="text-[11px] text-slate-400 font-semibold block">Controller Voltage</span>
          <div className="flex items-center gap-2 mt-1">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-base font-bold text-white font-mono">{telemetry.controllerVoltage || 5.0} V</span>
          </div>
        </div>

        <div className="glass-card p-3.5">
          <span className="text-[11px] text-slate-400 font-semibold block">PWM Output %</span>
          <div className="flex items-center gap-2 mt-1">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span className="text-base font-bold text-white font-mono">{telemetry.pwmOutput} %</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto glow-red">
              <OctagonAlert className="w-6 h-6" />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Confirm Remote Immobilization</h3>
              <p className="text-xs text-slate-300 mt-2">
                Are you sure you want to stop the vehicle remotely? This will send a high-priority motor shutdown signal to the ESP32 controller.
              </p>
            </div>

            <div className="bg-[#0B1220] p-3 rounded-xl border border-[#1E2D4A] text-xs space-y-1 font-mono text-slate-300">
              <div>Target Vehicle: <strong className="text-blue-400">{telemetry.vehicleId}</strong></div>
              <div>Current Speed: <strong className="text-amber-400">{telemetry.vehicleSpeed} km/h</strong></div>
              <div>ESP32 Status: <strong className="text-emerald-400">Online</strong></div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#1E2D4A] text-slate-300 hover:bg-[#1E2D4A] text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStop}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/40 transition-all"
              >
                Confirm Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
