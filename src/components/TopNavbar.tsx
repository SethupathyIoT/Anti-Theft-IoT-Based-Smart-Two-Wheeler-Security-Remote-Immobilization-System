import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Moon, 
  Sun, 
  Wifi, 
  Clock, 
  Activity, 
  CheckCircle2, 
  X, 
  Sliders, 
  Radio 
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const TopNavbar: React.FC = () => {
  const { 
    telemetry, 
    alerts, 
    isSimulatorActive, 
    toggleSimulator, 
    clearAlerts,
    markAlertAsRead 
  } = useTelemetry();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  const unreadCount = alerts.filter(a => !a.read).length;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateString = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      setCurrentTime(`${dateString} • ${timeString}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-20 bg-[#0B1220]/80 backdrop-blur-xl border-b border-[#1E2D4A] fixed top-0 right-0 left-72 z-20 px-8 flex items-center justify-between">
      {/* Left Side Status Indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 bg-[#131C2E] border border-emerald-500/30 px-3.5 py-1.5 rounded-full shadow-inner">
          <span className="online-dot"></span>
          <span className="text-xs font-semibold text-emerald-400 tracking-wide">
            {telemetry.esp32Online ? 'System Online' : 'System Offline'}
          </span>
        </div>

        {/* Live Simulator Toggle Switch */}
        <button
          onClick={toggleSimulator}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            isSimulatorActive 
              ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' 
              : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
          }`}
          title="Switch between Live Telemetry Simulator and Firebase RTDB Sync"
        >
          <Radio className={`w-3.5 h-3.5 ${isSimulatorActive ? 'animate-pulse text-blue-400' : 'text-emerald-400'}`} />
          <span>{isSimulatorActive ? 'Telemetry Stream: Active' : 'Firebase RTDB: Connected'}</span>
        </button>
      </div>

      {/* Right Side Tools & Controls */}
      <div className="flex items-center gap-6">
        {/* Connection Quality */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-400 bg-[#131C2E] px-3 py-1.5 rounded-xl border border-[#1E2D4A]">
          <Wifi className="w-4 h-4 text-emerald-400" />
          <span>Latency: <strong className="text-emerald-400 font-mono">{telemetry.commandLatencyMs} ms</strong></span>
        </div>

        {/* Live Timestamp */}
        <div className="hidden xl:flex items-center gap-2 text-xs font-medium text-slate-300 bg-[#131C2E] px-3.5 py-1.5 rounded-xl border border-[#1E2D4A]">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>{currentTime}</span>
        </div>

        {/* Notifications Dropdown Container */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-[#131C2E] border border-[#1E2D4A] text-slate-300 hover:text-white hover:border-blue-500/50 transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-[#0B1220] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#131C2E] border border-[#1E2D4A] rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 border-b border-[#1E2D4A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  <span className="text-xs bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full">
                    {alerts.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={clearAlerts}
                    className="text-xs text-slate-400 hover:text-red-400 font-medium transition-colors"
                  >
                    Clear All
                  </button>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#1E2D4A]/50 p-2 space-y-1">
                {alerts.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No recent security alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => markAlertAsRead(alert.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-colors ${
                        alert.read ? 'bg-transparent hover:bg-[#1E2D4A]/40' : 'bg-blue-600/10 hover:bg-blue-600/20 border-l-2 border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold ${
                          alert.severity === 'red' ? 'text-red-400' : alert.severity === 'orange' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {alert.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{alert.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-snug">{alert.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-xl bg-[#131C2E] border border-[#1E2D4A] text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-all"
          title="Toggle Theme"
        >
          {darkMode ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#1E2D4A]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-md shadow-blue-500/20">
            <div className="w-full h-full bg-[#0B1220] rounded-[10px] flex items-center justify-center font-bold text-sm text-blue-400">
              S
            </div>
          </div>
          <div className="hidden sm:block text-left">
            <h4 className="text-xs font-bold text-white leading-tight">{telemetry.owner}</h4>
            <p className="text-[11px] text-slate-400">System Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};
