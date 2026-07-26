import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Gauge, 
  Zap, 
  BatteryCharging, 
  Signal, 
  AlertTriangle 
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const StatusCardsRow: React.FC = () => {
  const { telemetry, toggleSideLock } = useTelemetry();

  const isThreat = telemetry.vehicleStatus === 'THREAT_DETECTED';
  const isLockBroken = telemetry.sideLockStatus === 'BROKEN';
  const isEngineRunning = telemetry.engineStatus === 'RUNNING';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {/* Card 1: Vehicle Security Status */}
      <div className={`glass-card p-4 flex flex-col justify-between relative overflow-hidden ${
        isThreat ? 'glass-card-danger' : ''
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Vehicle Status</span>
            <h3 className={`text-xl font-extrabold mt-1 tracking-tight ${
              isThreat ? 'text-red-500 animate-pulse' : 'text-emerald-400'
            }`}>
              {isThreat ? 'THREAT DETECTED' : 'SAFE'}
            </h3>
          </div>
          <div className={`p-3 rounded-2xl ${
            isThreat ? 'bg-red-500/20 text-red-400 glow-red' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {isThreat ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 font-medium">
          {isThreat ? '🚨 Security breach active!' : '🛡️ No active threats detected'}
        </p>
      </div>

      {/* Card 2: Side Lock Status */}
      <div className={`glass-card p-4 flex flex-col justify-between relative overflow-hidden ${
        isLockBroken ? 'glass-card-danger' : ''
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Side Lock</span>
              <button 
                onClick={toggleSideLock} 
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold px-1.5 py-0.5 rounded border border-[#1E2D4A]"
                title="Test tamper sensor trigger"
              >
                Test Tamper
              </button>
            </div>
            <h3 className={`text-xl font-extrabold mt-1 tracking-tight ${
              isLockBroken ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {isLockBroken ? 'BROKEN' : 'LOCKED'}
            </h3>
          </div>
          <div className={`p-3 rounded-2xl ${
            isLockBroken ? 'bg-red-500/20 text-red-400 glow-red' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {isLockBroken ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
        </div>
        <div className="mt-3">
          {isLockBroken ? (
            <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 inline" />
              Tamper at {telemetry.sideLockTriggerTime || 'Just now'}
            </p>
          ) : (
            <p className="text-xs text-slate-400 font-medium">🔒 Solenoid Lock Engaged</p>
          )}
        </div>
      </div>

      {/* Card 3: Live Vehicle Speed */}
      <div className="glass-card p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live Speed</span>
            <div className="flex items-baseline gap-1 mt-1">
              <h3 className="text-2xl font-black text-blue-400 tracking-tight font-mono">
                {telemetry.vehicleSpeed}
              </h3>
              <span className="text-xs font-bold text-slate-400">km/h</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
            <Gauge className="w-6 h-6" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 font-medium flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
          Updated every 1s
        </p>
      </div>

      {/* Card 4: Engine Status */}
      <div className="glass-card p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Engine Status</span>
            <h3 className={`text-xl font-extrabold mt-1 tracking-tight ${
              isEngineRunning ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {telemetry.engineStatus}
            </h3>
          </div>
          <div className={`p-3 rounded-2xl ${
            isEngineRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            <Zap className="w-6 h-6" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 font-medium">
          {isEngineRunning ? '⚡ Motor Active & Running' : '🛑 Motor Disengaged'}
        </p>
      </div>

      {/* Card 5: Battery Voltage */}
      <div className="glass-card p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Battery Health</span>
            <div className="flex items-baseline gap-1 mt-1">
              <h3 className="text-xl font-bold text-emerald-400 font-mono">
                {telemetry.batteryVoltage} V
              </h3>
              <span className="text-xs font-semibold text-slate-400">({telemetry.batteryPercentage}%)</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
            <BatteryCharging className="w-6 h-6" />
          </div>
        </div>
        {/* Battery Progress Bar */}
        <div className="w-full bg-[#0B1220] h-2 rounded-full mt-3 overflow-hidden border border-[#1E2D4A]">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${telemetry.batteryPercentage}%` }}
          />
        </div>
      </div>

      {/* Card 6: GSM Signal */}
      <div className="glass-card p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">GSM Signal</span>
            <h3 className="text-lg font-bold text-blue-400 mt-1 tracking-tight">
              {telemetry.gsmSignal}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
            <Signal className="w-6 h-6" />
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 space-y-0.5">
          <div className="flex justify-between">
            <span>Operator:</span>
            <span className="text-slate-200 font-medium">{telemetry.networkOperator}</span>
          </div>
          <div className="flex justify-between">
            <span>Signal:</span>
            <span className="text-emerald-400 font-mono font-semibold">{telemetry.signalStrength} dBm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
