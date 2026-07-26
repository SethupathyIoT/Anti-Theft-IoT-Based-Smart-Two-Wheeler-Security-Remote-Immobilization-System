import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Phone, 
  Wifi, 
  Database, 
  ShieldAlert, 
  Key, 
  Cpu, 
  Save, 
  CheckCircle2 
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, addLog } = useTelemetry();

  const [formData, setFormData] = useState(settings);
  const [isUpdatingOta, setIsUpdatingOta] = useState(false);
  const [otaProgress, setOtaProgress] = useState(0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    alert("Settings saved successfully!");
  };

  const handleOtaUpdate = () => {
    setIsUpdatingOta(true);
    setOtaProgress(10);
    addLog('INFO', 'Initiating OTA Firmware Update [v1.0.0 -> v1.0.1]');

    const interval = setInterval(() => {
      setOtaProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUpdatingOta(false);
          addLog('SUCCESS', 'ESP32 Firmware Flash Successful [v1.0.1 active]');
          alert("ESP32 Firmware upgraded to v1.0.1!");
          return 100;
        }
        return prev + 15;
      });
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1E2D4A] pb-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-400" />
          IoT System & Hardware Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage owner profiles, emergency SMS contacts, threshold limits, MQTT brokers, and OTA flasher
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Owner & Contact Information */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#1E2D4A] pb-3">
            <User className="w-4 h-4 text-blue-400" />
            Owner & Emergency Contacts
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Owner Full Name</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full bg-[#0B1220] border border-[#1E2D4A] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Primary Emergency Contact (SMS & Call)</label>
              <input
                type="text"
                value={formData.emergencyContact1}
                onChange={e => setFormData({ ...formData, emergencyContact1: e.target.value })}
                className="w-full bg-[#0B1220] border border-[#1E2D4A] rounded-xl px-3.5 py-2.5 text-amber-400 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Secondary Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContact2}
                onChange={e => setFormData({ ...formData, emergencyContact2: e.target.value })}
                className="w-full bg-[#0B1220] border border-[#1E2D4A] rounded-xl px-3.5 py-2.5 text-amber-400 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.smsEnabled}
                  onChange={e => setFormData({ ...formData, smsEnabled: e.target.checked })}
                  className="rounded bg-[#0B1220] border-[#1E2D4A] text-blue-600 focus:ring-0"
                />
                Auto SMS on Tamper
              </label>

              <label className="flex items-center gap-2 text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.callEnabled}
                  onChange={e => setFormData({ ...formData, callEnabled: e.target.checked })}
                  className="rounded bg-[#0B1220] border-[#1E2D4A] text-blue-600 focus:ring-0"
                />
                Auto Call on Tamper
              </label>
            </div>
          </div>
        </div>

        {/* Security & Threshold Limits */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#1E2D4A] pb-3">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Safety Thresholds & Authorization PIN
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Speed Warning Threshold (km/h)</label>
              <input
                type="number"
                value={formData.speedThreshold}
                onChange={e => setFormData({ ...formData, speedThreshold: Number(e.target.value) })}
                className="w-full bg-[#0B1220] border border-[#1E2D4A] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Emergency Immobilization PIN</label>
              <input
                type="password"
                value={formData.emergencyPin}
                onChange={e => setFormData({ ...formData, emergencyPin: e.target.value })}
                className="w-full bg-[#0B1220] border border-[#1E2D4A] rounded-xl px-3.5 py-2.5 text-emerald-400 font-mono tracking-widest focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Firebase RTDB Endpoint URL</label>
              <input
                type="text"
                value={formData.firebaseUrl}
                onChange={e => setFormData({ ...formData, firebaseUrl: e.target.value })}
                className="w-full bg-[#0B1220] border border-[#1E2D4A] rounded-xl px-3.5 py-2.5 text-blue-400 font-mono text-[11px] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* OTA Firmware Updater Card */}
        <div className="glass-card p-6 space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#1E2D4A] pb-3">
            <Cpu className="w-4 h-4 text-emerald-400" />
            ESP32 Over-The-Air (OTA) Firmware Flasher
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0B1220] p-4 rounded-xl border border-[#1E2D4A]">
            <div>
              <div className="text-xs font-bold text-white">Current Version: v1.0.0</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Latest stable build: v1.0.1 (Fixes solenoid debounce delay)</p>
            </div>

            <button
              type="button"
              onClick={handleOtaUpdate}
              disabled={isUpdatingOta}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isUpdatingOta
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
              }`}
            >
              {isUpdatingOta ? `Flashing Firmware (${otaProgress}%)` : 'Flash OTA Firmware (v1.0.1)'}
            </button>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="lg:col-span-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configuration Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
