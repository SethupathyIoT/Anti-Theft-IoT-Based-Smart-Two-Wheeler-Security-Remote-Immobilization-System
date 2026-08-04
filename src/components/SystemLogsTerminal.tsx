import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2, ArrowDownCircle } from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const SystemLogsTerminal: React.FC = () => {
  const { logs } = useTelemetry();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'DANGER':
        return <span className="text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40">DANGER</span>;
      case 'WARNING':
        return <span className="text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">WARN</span>;
      case 'SUCCESS':
        return <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">SUCCESS</span>;
      case 'INFO':
      default:
        return <span className="text-blue-400 font-bold bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">INFO</span>;
    }
  };

  return (
    <div className="glass-card p-5 flex flex-col h-72">
      {/* Terminal Window Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#1E2D4A]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">System Terminal Logs</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">STREAM ACTIVE</span>
        </div>
      </div>

      {/* Terminal Content Body */}
      <div ref={containerRef} className="flex-1 bg-[#070C14] rounded-xl p-3.5 border border-[#1E2D4A] overflow-y-auto font-mono text-xs space-y-2 select-text">
        {logs.length === 0 ? (
          <p className="text-slate-600 text-center py-8">Terminal output stream initialized...</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 hover:bg-[#131C2E]/50 p-1 rounded transition-colors">
              <span className="text-slate-500 text-[11px] whitespace-nowrap">{log.timestamp}</span>
              <div className="text-[10px] uppercase font-semibold">
                {getLevelBadge(log.level)}
              </div>
              <span className={`leading-relaxed ${
                log.level === 'DANGER' 
                  ? 'text-red-300 font-semibold' 
                  : log.level === 'WARNING' 
                  ? 'text-amber-300' 
                  : log.level === 'SUCCESS' 
                  ? 'text-emerald-300' 
                  : 'text-slate-300'
              }`}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
