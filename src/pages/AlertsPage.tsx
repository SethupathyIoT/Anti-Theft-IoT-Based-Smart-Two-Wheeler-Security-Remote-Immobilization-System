import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  Trash2, 
  ShieldAlert, 
  Phone, 
  MessageSquare, 
  OctagonAlert, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const AlertsPage: React.FC = () => {
  const { alerts, clearAlerts, markAlertAsRead, addLog } = useTelemetry();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const handleTriggerSms = () => {
    addLog('INFO', 'Emergency SMS dispatched manually via SIM800L to +91 98765 43210');
    alert("SMS Emergency Broadcast Dispatched successfully!");
  };

  const handleTriggerCall = () => {
    addLog('INFO', 'Emergency Voice Call initiated via SIM800L to +91 98765 43210');
    alert("Emergency Voice Call Initiated!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2D4A] pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-red-400" />
            Security Alert Management Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time theft alarms, tamper logs, and automated dispatch triggers
          </p>
        </div>

        {/* Quick Action Triggers */}
        <div className="flex items-center gap-3">
          <button
            onClick={clearAlerts}
            className="px-3.5 py-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search security alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B1220] border border-[#1E2D4A] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-semibold">Filter:</span>
          {['all', 'red', 'orange', 'green'].map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                severityFilter === sev
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#0B1220] text-slate-400 border border-[#1E2D4A] hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed Grid */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-500 text-sm">
            No matching security alerts found.
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div 
              key={alert.id}
              onClick={() => markAlertAsRead(alert.id)}
              className={`glass-card p-4 flex items-start justify-between gap-4 transition-all cursor-pointer ${
                !alert.read ? 'border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${
                  alert.severity === 'red' 
                    ? 'bg-red-500/20 text-red-400 glow-red' 
                    : alert.severity === 'orange' 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {alert.severity === 'red' ? <OctagonAlert className="w-5 h-5" /> : alert.severity === 'orange' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-bold text-white">{alert.title}</h4>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      alert.severity === 'red' 
                        ? 'bg-red-500/20 text-red-400' 
                        : alert.severity === 'orange' 
                        ? 'bg-amber-500/20 text-amber-400' 
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{alert.description}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 block">{alert.timestamp}</span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {alert.read ? 'Read' : 'Unread'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
