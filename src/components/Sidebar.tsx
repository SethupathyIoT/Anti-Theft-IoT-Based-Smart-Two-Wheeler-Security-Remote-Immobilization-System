import React from 'react';
import { 
  Shield, 
  Home, 
  Gauge, 
  Activity, 
  Bell, 
  Sliders, 
  History, 
  Settings as SettingsIcon, 
  User, 
  LogOut, 
  Cpu, 
  Wifi, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { telemetry, alerts } = useTelemetry();
  const unreadAlerts = alerts.filter(a => !a.read).length;

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: Gauge },
    { id: 'live-monitor', label: 'Live Monitor', icon: Activity },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: unreadAlerts > 0 ? unreadAlerts : null },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="w-72 bg-[#0B1220]/95 backdrop-blur-xl border-r border-[#1E2D4A] flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Top Header Logo */}
      <div className="p-5 flex items-center gap-3 border-b border-[#1E2D4A]">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-wide leading-tight">
            Smart Security
          </h1>
          <p className="text-xs text-blue-400 font-medium">
            Two-Wheeler IoT SaaS
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-md shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131C2E]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Vehicle Information Card */}
      <div className="p-4 m-3 bg-[#131C2E] border border-[#1E2D4A] rounded-2xl">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1E2D4A]">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicle Profile</span>
          <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
            telemetry.esp32Online 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              telemetry.esp32Online ? 'bg-emerald-400 animate-ping' : 'bg-red-400'
            }`}></span>
            {telemetry.esp32Online ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Vehicle ID:</span>
            <span className="font-mono text-blue-400 font-bold">{telemetry.vehicleId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Model:</span>
            <span className="text-slate-200 font-medium">{telemetry.model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Owner:</span>
            <span className="text-slate-200 font-medium">{telemetry.owner}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Reg No:</span>
            <span className="text-amber-400 font-mono font-semibold">{telemetry.registration}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-[#1E2D4A]/50">
            <span className="text-slate-400">Firmware:</span>
            <span className="text-emerald-400 font-mono font-semibold">{telemetry.firmwareVersion}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
