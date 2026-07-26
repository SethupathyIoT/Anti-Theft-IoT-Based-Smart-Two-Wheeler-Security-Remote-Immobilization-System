import React from 'react';
import { 
  Bell, 
  ShieldCheck, 
  Lock, 
  Phone, 
  MessageSquare, 
  OctagonAlert, 
  AlertTriangle,
  Radio
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const RecentAlertsTimeline: React.FC = () => {
  const { alerts } = useTelemetry();

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case 'shield': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'lock': return <Lock className="w-4 h-4 text-emerald-400" />;
      case 'phone': return <Phone className="w-4 h-4 text-amber-400" />;
      case 'sms': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'stop': return <OctagonAlert className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#1E2D4A] pb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Security Alerts</h3>
        </div>
        <span className="text-xs font-mono font-semibold text-slate-400">Timeline Stream</span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1E2D4A]">
        {alerts.slice(0, 5).map((alert) => (
          <div key={alert.id} className="relative group">
            {/* Timeline Circle Bullet */}
            <div className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-[#0B1220] ${
              alert.severity === 'red' ? 'bg-red-500 ring-4 ring-red-500/20' : alert.severity === 'orange' ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />

            <div className={`p-3 rounded-xl border transition-all ${
              alert.severity === 'red' 
                ? 'bg-red-500/10 border-red-500/30 text-red-100' 
                : alert.severity === 'orange' 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-100' 
                : 'bg-[#0B1220]/60 border-[#1E2D4A] text-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {getAlertIcon(alert.iconType, alert.severity)}
                  <h4 className="text-xs font-bold">{alert.title}</h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{alert.timestamp}</span>
              </div>
              <p className="text-xs text-slate-300 leading-snug">{alert.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
