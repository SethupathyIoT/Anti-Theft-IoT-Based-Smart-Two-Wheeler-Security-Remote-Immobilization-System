import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Truck
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const SettingsPage: React.FC = () => {
  const { settings, telemetry, updateSettings } = useTelemetry();

  // Flag to toggle emergency contacts card visibility (can be set to true whenever you want to re-enable it)
  const SHOW_EMERGENCY_CONTACTS = false;

  const [formData, setFormData] = useState({
    ...settings,
    vehicleId: settings.vehicleId || telemetry.vehicleId,
    model: settings.model || telemetry.model,
    ownerName: settings.ownerName || telemetry.owner,
    registration: settings.registration || telemetry.registration
  });

  // Sync local form data when settings or telemetry arrive from Firebase
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...settings,
      vehicleId: settings.vehicleId || telemetry.vehicleId || prev.vehicleId,
      model: settings.model || telemetry.model || prev.model,
      ownerName: settings.ownerName || telemetry.owner || prev.ownerName,
      registration: settings.registration || telemetry.registration || prev.registration
    }));
  }, [settings, telemetry]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    alert("Vehicle Profile & Settings saved successfully!");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-[#1E2D4A] pb-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-400" />
          IoT System & Vehicle Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Update your vehicle profile specifications (Vehicle ID, Model, Owner Name, and Registration Number)
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Vehicle Profile Information */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#1E2D4A] pb-3">
            <Truck className="w-4 h-4 text-emerald-400" />
            Vehicle Profile Specifications
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Vehicle ID</label>
              <input
                type="text"
                value={formData.vehicleId}
                onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
                placeholder="e.g. TW-2026-4WD"
                className="w-full bg-[#0B1220] border border-[#1E2D4A] rounded-xl px-3.5 py-2.5 text-blue-400 font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Vehicle Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g. Smart E-Scooter Pro"
                className="w-full bg-[#0B1220] border border-[#1E2D4A] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Owner Name</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="e.g. System Admin"
                className="w-full bg-[#0B1220] border border-[#1E2D4A] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Registration Number (Reg No)</label>
              <input
                type="text"
                value={formData.registration}
                onChange={e => setFormData({ ...formData, registration: e.target.value })}
                placeholder="e.g. TN-39-AB-1234"
                className="w-full bg-[#0B1220] border border-[#1E2D4A] rounded-xl px-3.5 py-2.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contacts & Alerts (Hidden for now - switch SHOW_EMERGENCY_CONTACTS to true to re-enable) */}
        {SHOW_EMERGENCY_CONTACTS && (
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#1E2D4A] pb-3">
              Emergency Contacts & Dispatch Options
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Primary Emergency Contact (SMS & Call)</label>
                <input
                  type="text"
                  value={formData.emergencyContact1}
                  onChange={e => setFormData({ ...formData, emergencyContact1: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#0B1220] border border-[#1E2D4A] rounded-xl px-3.5 py-2.5 text-amber-400 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Secondary Emergency Contact</label>
                <input
                  type="text"
                  value={formData.emergencyContact2}
                  onChange={e => setFormData({ ...formData, emergencyContact2: e.target.value })}
                  placeholder="+91 91234 56789"
                  className="w-full bg-[#0B1220] border border-[#1E2D4A] rounded-xl px-3.5 py-2.5 text-amber-400 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t border-[#1E2D4A]">
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
        )}

        {/* Submit Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configuration Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
