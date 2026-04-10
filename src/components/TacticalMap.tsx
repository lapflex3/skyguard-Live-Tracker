import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RadarTarget } from '../types';
import { Search, Map as MapIcon, Layers, Ruler, X, Target as TargetIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

// Fix Leaflet icon issue
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface TacticalMapProps {
  targets: RadarTarget[];
  center: [number, number];
  range: number;
}

const MapController = ({ center, zoom }: { center: [number, number], zoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

const DistanceTool = ({ active, onPointAdded, points }: { active: boolean, onPointAdded: (latlng: L.LatLng) => void, points: L.LatLng[] }) => {
  useMapEvents({
    click(e) {
      if (active) {
        onPointAdded(e.latlng);
      }
    },
  });

  if (points.length < 2) return null;

  return (
    <>
      <Polyline positions={points.map(p => [p.lat, p.lng])} color="#00ff41" weight={2} dashArray="5, 5" />
      {points.map((p, i) => (
        <Marker 
          key={i} 
          position={[p.lat, p.lng]} 
          icon={L.divIcon({
            className: 'bg-radar-green w-2 h-2 rounded-full border border-white',
            iconSize: [8, 8]
          })} 
        />
      ))}
    </>
  );
};

export const TacticalMap: React.FC<TacticalMapProps> = ({ targets, center, range }) => {
  const [mapType, setMapType] = useState<'street' | 'satellite' | 'dark'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState(8);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<L.LatLng[]>([]);
  const [distance, setDistance] = useState<number | null>(null);

  const tileLayers = {
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase();
    
    // Search in targets first
    const target = targets.find(t => t.id.toLowerCase().includes(query) || t.type.toLowerCase().includes(query));
    if (target) {
      setMapCenter([target.lat, target.lng]);
      setMapZoom(12);
      return;
    }

    // Mock geocoding for common locations
    const locations: Record<string, [number, number]> = {
      'kuala lumpur': [3.139, 101.686],
      'singapore': [1.3521, 103.8198],
      'tokyo': [35.6762, 139.6503],
      'washington': [38.9072, -77.0369],
      'base alpha': [3.139, 101.686],
      'sector 7': [3.5, 102.0]
    };

    if (locations[query]) {
      setMapCenter(locations[query]);
      setMapZoom(10);
    }
  };

  const addMeasurePoint = (latlng: L.LatLng) => {
    setMeasurePoints(prev => {
      const newPoints = [...prev, latlng];
      if (newPoints.length >= 2) {
        let total = 0;
        for (let i = 0; i < newPoints.length - 1; i++) {
          total += newPoints[i].distanceTo(newPoints[i+1]);
        }
        setDistance(total / 1000); // km
      }
      return newPoints;
    });
  };

  const clearMeasure = () => {
    setMeasurePoints([]);
    setDistance(null);
  };

  return (
    <div className="w-full h-full glass-panel rounded-lg overflow-hidden relative">
      {/* Search Box */}
      <div className="absolute top-4 left-4 z-[1000] w-64">
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location or target..."
            className="w-full bg-military-bg/80 backdrop-blur-md border border-radar-dim px-3 py-2 pl-9 text-[10px] text-radar-green focus:outline-none focus:border-radar-green rounded"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-radar-dim" />
        </form>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <div className="glass-panel p-1 flex flex-col gap-1 rounded">
          <button 
            onClick={() => setMapType('dark')}
            className={`p-1.5 rounded transition-all ${mapType === 'dark' ? 'bg-radar-green text-military-bg' : 'text-radar-green hover:bg-radar-dim'}`}
            title="Tactical View"
          >
            <Layers size={16} />
          </button>
          <button 
            onClick={() => setMapType('satellite')}
            className={`p-1.5 rounded transition-all ${mapType === 'satellite' ? 'bg-radar-green text-military-bg' : 'text-radar-green hover:bg-radar-dim'}`}
            title="Satellite View"
          >
            <MapIcon size={16} />
          </button>
          <button 
            onClick={() => setMapType('street')}
            className={`p-1.5 rounded transition-all ${mapType === 'street' ? 'bg-radar-green text-military-bg' : 'text-radar-green hover:bg-radar-dim'}`}
            title="Street View"
          >
            <Layers size={16} />
          </button>
        </div>

        <div className="glass-panel p-1 flex flex-col gap-1 rounded">
          <button 
            onClick={() => {
              setIsMeasuring(!isMeasuring);
              if (isMeasuring) clearMeasure();
            }}
            className={`p-1.5 rounded transition-all ${isMeasuring ? 'bg-threat-high text-white' : 'text-radar-green hover:bg-radar-dim'}`}
            title="Measure Distance"
          >
            <Ruler size={16} />
          </button>
        </div>

        {distance !== null && (
          <div className="glass-panel p-2 text-[10px] text-radar-green font-mono flex items-center gap-2">
            <span>DIST: {(distance || 0).toFixed(2)} KM</span>
            <button onClick={clearMeasure} className="hover:text-threat-high"><X size={12} /></button>
          </div>
        )}

        <div className="glass-panel p-2 text-[10px] uppercase font-mono">
          LAT: {(mapCenter[0] || 0).toFixed(4)}<br/>
          LNG: {(mapCenter[1] || 0).toFixed(4)}
        </div>
      </div>

      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileLayers[mapType]}
        />
        <MapController center={mapCenter} zoom={mapZoom} />
        <DistanceTool active={isMeasuring} onPointAdded={addMeasurePoint} points={measurePoints} />
        
        {/* Radar Range Circle */}
        <Circle 
          center={center} 
          radius={range * 1000} 
          pathOptions={{ color: '#00ff41', fillColor: '#00ff41', fillOpacity: 0.05, weight: 1, dashArray: '5, 10' }} 
        />

        {targets.map(target => (
          <React.Fragment key={target.id}>
            {/* Intercepting Indicator */}
            {target.status === 'intercepting' && (
              <Circle 
                center={[target.lat, target.lng]}
                radius={5000}
                pathOptions={{ color: '#ff3131', weight: 1, fillOpacity: 0.1 }}
                className="animate-pulse"
              />
            )}

            <Marker 
              position={[target.lat, target.lng]}
              icon={L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="${target.threatLevel === 'high' ? 'threat-pulse-high' : ''} ${target.status === 'intercepting' ? 'intercept-pulse' : ''}" style="
                  width: 14px; 
                  height: 14px; 
                  background: ${
                    target.type === 'gold' ? '#ffd700' : 
                    target.type === 'petroleum' ? '#333333' :
                    target.threatLevel === 'friendly' ? '#3b82f6' : 
                    target.threatLevel === 'high' ? '#ff3131' : 
                    target.threatLevel === 'medium' ? '#ffcc00' : '#00ff41'
                  }; 
                  border: 2px solid ${target.type === 'petroleum' ? '#ffd700' : 'white'};
                  border-radius: ${target.type === 'gold' ? '50%' : target.threatLevel === 'high' ? '0' : '2px'};
                  transform: rotate(${target.heading + (target.threatLevel === 'high' ? 45 : 0)}deg);
                  box-shadow: 0 0 10px ${
                    target.type === 'gold' ? 'rgba(255, 215, 0, 0.8)' :
                    target.threatLevel === 'high' ? 'rgba(255, 49, 49, 0.8)' : 
                    target.threatLevel === 'friendly' ? 'rgba(59, 130, 246, 0.8)' : 'transparent'
                  };
                ">
                  ${target.status === 'intercepting' ? '<div class="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>' : ''}
                </div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
              })}
            >
              <Popup>
                <div className="text-xs font-mono bg-military-bg p-2 text-radar-green">
                  <div className="font-bold border-bottom border-radar-dim mb-1 flex items-center gap-2">
                    {target.id} {target.status === 'intercepting' && <TargetIcon size={12} className="text-threat-high animate-spin" />}
                  </div>
                  <div>TYPE: {target.type.toUpperCase()}</div>
                  <div>STATUS: <span className={target.status === 'intercepting' ? 'text-threat-high' : ''}>{target.status.toUpperCase()}</span></div>
                  <div>{target.alt < 0 ? 'DEPTH' : 'ALT'}: {Math.abs(target.alt)}m</div>
                  <div>SPD: {target.speed}km/h</div>
                  <div className="mt-1 text-threat-high">THREAT: {target.threatLevel.toUpperCase()}</div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
};
