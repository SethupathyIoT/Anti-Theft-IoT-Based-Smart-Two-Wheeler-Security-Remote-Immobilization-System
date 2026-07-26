import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  ShieldCheck, 
  OctagonAlert, 
  Lock, 
  Phone 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTelemetry } from '../context/TelemetryContext';

interface HistoryEvent {
  id: string;
  date: string;
  time: string;
  type: string;
  description: string;
  location: string;
  status: string;
}

const mockHistoryEvents: HistoryEvent[] = [
  {
    id: "evt-101",
    date: "2026-07-26",
    time: "10:24:55",
    type: "Remote Immobilization",
    description: "Motor successfully stopped via dashboard remote command.",
    location: "Gandhipuram, Coimbatore",
    status: "Completed"
  },
  {
    id: "evt-102",
    date: "2026-07-26",
    time: "10:24:36",
    type: "Side Lock Tamper",
    description: "Handlebar solenoid side lock tamper switch triggered.",
    location: "Gandhipuram, Coimbatore",
    status: "Alert Triggered"
  },
  {
    id: "evt-103",
    date: "2026-07-26",
    time: "10:24:37",
    type: "SMS Notification",
    description: "Emergency SMS broadcast sent to +91 98765 43210.",
    location: "Cloud SIM800L Gateway",
    status: "Delivered"
  },
  {
    id: "evt-104",
    date: "2026-07-25",
    time: "18:40:12",
    type: "Engine Started",
    description: "Engine ignition authorized via RFID key tag.",
    location: "Cross Cut Road, Coimbatore",
    status: "Authorized"
  },
  {
    id: "evt-105",
    date: "2026-07-25",
    time: "17:15:00",
    type: "Geofence Check",
    description: "Vehicle within safe designated geofence radius.",
    location: "RS Puram, Coimbatore",
    status: "Safe"
  }
];

export const HistoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredEvents = mockHistoryEvents.filter(evt => {
    const matchesSearch = evt.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          evt.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || evt.type.toUpperCase().includes(filterType);
    return matchesSearch && matchesType;
  });

  const exportCSV = () => {
    const headers = ["ID", "Date", "Time", "Event Type", "Description", "Location", "Status"];
    const rows = filteredEvents.map(e => [e.id, e.date, e.time, `"${e.type}"`, `"${e.description}"`, `"${e.location}"`, e.status]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `theft_system_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Smart Two-Wheeler Security System - History Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const tableData = filteredEvents.map(e => [e.date + ' ' + e.time, e.type, e.description, e.location, e.status]);
    autoTable(doc, {
      startY: 28,
      head: [['Timestamp', 'Type', 'Description', 'Location', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`theft_system_history_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2D4A] pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-blue-400" />
            Security & Location History Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit trail of all vehicle security events, remote immobilizations, and SMS notifications
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportPDF}
            className="px-3.5 py-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 text-xs font-bold flex items-center gap-2 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search event logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B1220] border border-[#1E2D4A] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-semibold">Event Filter:</span>
          {['ALL', 'IMMOBILIZATION', 'LOCK', 'SMS'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#0B1220] text-slate-400 border border-[#1E2D4A] hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1220] border-b border-[#1E2D4A] text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Event Type</th>
                <th className="p-4">Description</th>
                <th className="p-4">Location</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D4A]/50 text-xs">
              {filteredEvents.map(evt => (
                <tr key={evt.id} className="hover:bg-[#1E2D4A]/30 transition-colors">
                  <td className="p-4 font-mono text-slate-300">
                    <div>{evt.date}</div>
                    <div className="text-[10px] text-slate-500">{evt.time}</div>
                  </td>
                  <td className="p-4 font-bold text-white">{evt.type}</td>
                  <td className="p-4 text-slate-300">{evt.description}</td>
                  <td className="p-4 text-blue-400 font-mono text-[11px]">{evt.location}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {evt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
