import React from 'react';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { LiveMonitorPage } from './pages/LiveMonitorPage';
import { AlertsPage } from './pages/AlertsPage';
import { ControlPage } from './pages/ControlPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { Esp32Page } from './pages/Esp32Page';
import { ProfilePage } from './pages/ProfilePage';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useTelemetry();

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'live-monitor':
        return <LiveMonitorPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'control':
        return <ControlPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      case 'esp32':
        return <Esp32Page />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 flex">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Top Navbar Header */}
      <TopNavbar />

      {/* Main Content View Container */}
      <main className="flex-1 ml-72 pt-24 px-8 pb-12 overflow-x-hidden">
        {renderCurrentTab()}
      </main>
    </div>
  );
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dashboard Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-6 text-white text-center">
          <div className="max-w-md p-6 bg-[#131C2E] border border-red-500/40 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-red-400">Dashboard Render Error</h2>
            <p className="text-xs text-slate-300 font-mono bg-[#0B1220] p-3 rounded border border-slate-800 text-left overflow-auto max-h-40">
              {this.state.error?.toString()}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold hover:bg-blue-500"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <TelemetryProvider>
        <AppContent />
      </TelemetryProvider>
    </ErrorBoundary>
  );
}

export default App;
