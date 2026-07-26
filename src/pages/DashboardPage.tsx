import React from 'react';
import { StatusCardsRow } from '../components/StatusCardsRow';
import { SpeedometerGauge } from '../components/SpeedometerGauge';
import { VehicleControlPanel } from '../components/VehicleControlPanel';
import { LiveGpsMap } from '../components/LiveGpsMap';
import { RecentAlertsTimeline } from '../components/RecentAlertsTimeline';
import { SystemLogsTerminal } from '../components/SystemLogsTerminal';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 6 Top KPI Status Cards Row */}
      <StatusCardsRow />

      {/* Main 3-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMN 1: Live Speed & RPM Gauge + Real-time Line Charts */}
        <div className="space-y-6">
          <SpeedometerGauge />
        </div>

        {/* COLUMN 2: Vehicle Control Panel (Emergency Stop, Multi-stage Sequence, Metrics) */}
        <div className="space-y-6">
          <VehicleControlPanel />
        </div>

        {/* COLUMN 3: Live GPS Map, Recent Security Alerts, System Terminal Logs */}
        <div className="space-y-6">
          <LiveGpsMap />
          <RecentAlertsTimeline />
          <SystemLogsTerminal />
        </div>
      </div>
    </div>
  );
};
