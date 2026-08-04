import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, RefreshCw, Navigation, ExternalLink, Satellite, Compass } from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

// Custom SVG div icon for dark red vehicle marker
const customVehicleIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 8px rgba(239,68,68,0.8));">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23EF4444" stroke="%23FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a10 10 0 0 0-10 10c0 5.25 10 10 10 10s10-4.75 10-10A10 10 0 0 0 12 2z"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Component to dynamically re-center Leaflet map
const MapRecenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export const LiveGpsMap: React.FC = () => {
  const { telemetry } = useTelemetry();

  const isGpsValid = telemetry.gpsLatitude !== 0 && telemetry.gpsLongitude !== 0;
  const position: [number, number] = isGpsValid ? [telemetry.gpsLatitude, telemetry.gpsLongitude] : [11.0168, 76.9558];
  
  const routeHistory: [number, number][] = isGpsValid ? [position] : [];

  const handleOpenGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${telemetry.gpsLatitude},${telemetry.gpsLongitude}`, '_blank');
  };

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Map Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E2D4A] pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live GPS Map Tracker</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {}}
            className="p-1.5 rounded-lg bg-[#0B1220] border border-[#1E2D4A] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1"
            title="Refresh GPS Signal"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenGoogleMaps}
            className="p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Google Maps</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="h-60 w-full rounded-xl overflow-hidden border border-[#1E2D4A] relative z-0 shadow-inner">
        <MapContainer 
          center={position} 
          zoom={15} 
          scrollWheelZoom={false} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <Marker position={position} icon={customVehicleIcon}>
            <Popup>
              <div className="text-xs text-slate-900 font-bold p-1">
                <div>🛵 {telemetry.model}</div>
                <div>ID: {telemetry.vehicleId}</div>
                <div>Speed: {telemetry.vehicleSpeed} km/h</div>
              </div>
            </Popup>
          </Marker>
          <Polyline positions={routeHistory} color="#3B82F6" weight={4} dashArray="5, 10" />
          <MapRecenter center={position} />
        </MapContainer>
      </div>

      {/* Location Metadata Bar */}
      <div className="bg-[#0B1220]/80 p-3 rounded-xl border border-[#1E2D4A] space-y-2">
        <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
          <span className="text-slate-400">Current Location:</span>
          <span className="text-blue-400 font-mono text-[11px]">Lat: {telemetry.gpsLatitude.toFixed(4)}, Lng: {telemetry.gpsLongitude.toFixed(4)}</span>
        </div>
        <p className="text-xs text-slate-300 font-medium">{telemetry.gpsAddress}</p>
        
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#1E2D4A]/50 text-center text-[10px]">
          <div>
            <span className="text-slate-400 block">GPS Speed</span>
            <span className="text-emerald-400 font-bold font-mono">{telemetry.gpsSpeed} km/h</span>
          </div>
          <div>
            <span className="text-slate-400 block">Satellites</span>
            <span className="text-blue-400 font-bold font-mono">
              {telemetry.satellites !== undefined ? telemetry.satellites : telemetry.satelliteCount} Sats
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Accuracy</span>
            <span className="text-amber-400 font-bold font-mono">{telemetry.gpsAccuracy} m</span>
          </div>
          <div>
            <span className="text-slate-400 block">Heading</span>
            <span className="text-slate-200 font-bold font-mono">{telemetry.heading}°</span>
          </div>
        </div>
      </div>
    </div>
  );
};
