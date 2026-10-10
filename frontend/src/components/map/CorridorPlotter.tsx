'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  RotateCcw,
  Trash2,
  Crosshair,
  Navigation,
  Info,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';

interface CorridorPlotterProps {
  coordinates: [number, number][]; // GeoJSON standard: [longitude, latitude]
  onChange: (coords: [number, number][]) => void;
  onLocationDetected?: (roadName: string, ward: string) => void;
}

// Key Chennai municipal zones for instant zoom
const CHENNAI_REGIONS = [
  { name: 'Central Chennai / Saidapet', lat: 13.0232, lng: 80.2241, ward: 'Ward 142 (Zone 10)' },
  { name: 'T. Nagar / Commercial Hub', lat: 13.0412, lng: 80.2335, ward: 'Ward 136 (Zone 10)' },
  { name: 'Velachery / 100ft Corridor', lat: 12.9816, lng: 80.2175, ward: 'Ward 177 (Zone 13)' },
  { name: 'OMR IT Expressway / Perungudi', lat: 12.9515, lng: 80.2435, ward: 'Ward 184 (Zone 14)' },
  { name: 'Anna Nagar / West Zone', lat: 13.0850, lng: 80.2100, ward: 'Ward 101 (Zone 08)' },
  { name: 'Guindy / Industrial Estate', lat: 13.0067, lng: 80.2030, ward: 'Ward 160 (Zone 12)' },
  { name: 'North Chennai / Royapuram', lat: 13.1100, lng: 80.2950, ward: 'Ward 049 (Zone 05)' },
  { name: 'Tambaram / South Gateway', lat: 12.9249, lng: 80.1478, ward: 'Zone South Tambaram' },
];

function calculatePathDistanceMeters(pts: [number, number][]): number {
  if (pts.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [lng1, lat1] = pts[i];
    const [lng2, lat2] = pts[i + 1];
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += R * c;
  }
  return Math.round(total);
}

export default function CorridorPlotter({
  coordinates,
  onChange,
  onLocationDetected
}: CorridorPlotterProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Manual GPS Inputs
  const [manualStartLat, setManualStartLat] = useState('13.0285');
  const [manualStartLng, setManualStartLng] = useState('80.2285');
  const [manualEndLat, setManualEndLat] = useState('13.0189');
  const [manualEndLng, setManualEndLng] = useState('80.2215');
  const [showManualInputs, setShowManualInputs] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] =
        coordinates.length > 0
          ? [coordinates[0][1], coordinates[0][0]]
          : [13.0428, 80.2526];

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(initialCenter, 13);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Click to add coordinate vertex
      map.on('click', (e: L.LeafletMouseEvent) => {
        const newLng = Number(e.latlng.lng.toFixed(5));
        const newLat = Number(e.latlng.lat.toFixed(5));
        const nextCoords: [number, number][] = [...coordinates, [newLng, newLat]];
        onChange(nextCoords);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync click event handler with updated coordinates state
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.off('click');
    map.on('click', (e: L.LeafletMouseEvent) => {
      const newLng = Number(e.latlng.lng.toFixed(5));
      const newLat = Number(e.latlng.lat.toFixed(5));
      const nextCoords: [number, number][] = [...coordinates, [newLng, newLat]];
      onChange(nextCoords);
    });
  }, [coordinates, onChange]);

  // Redraw markers and polyline whenever coordinates change
  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!layerGroup || !map) return;

    layerGroup.clearLayers();

    if (coordinates.length === 0) return;

    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
    const leafletPoints: [number, number][] = coordinates.map(([lng, lat]) => [lat, lng]);

    // Draw connecting corridor polyline
    if (leafletPoints.length > 1) {
      const polyline = L.polyline(leafletPoints, {
        color: '#1d4ed8',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: undefined
      });
      polyline.addTo(layerGroup);
    }

    // Draw numbered waypoint markers
    leafletPoints.forEach(([lat, lng], idx) => {
      const isStart = idx === 0;
      const isEnd = idx === leafletPoints.length - 1 && idx > 0;

      let badgeColor = '#2563eb';
      let label = `${idx + 1}`;

      if (isStart) {
        badgeColor = '#16a34a';
        label = 'START';
      } else if (isEnd) {
        badgeColor = '#dc2626';
        label = 'END';
      }

      const markerHtml = `
        <div style="
          background-color: ${badgeColor};
          color: white;
          font-weight: 700;
          font-size: 10px;
          line-height: 1;
          padding: 3px 6px;
          border-radius: 9999px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          white-space: nowrap;
          transform: translate(-50%, -50%);
          display: inline-block;
        ">
          ${label}
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-corridor-vertex',
        html: markerHtml,
        iconSize: [30, 20],
        iconAnchor: [15, 10]
      });

      const marker = L.marker([lat, lng], { icon });
      marker.bindTooltip(
        `<div style="font-size: 11px;">Point ${idx + 1}: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>`,
        { direction: 'top', offset: [0, -10] }
      );
      marker.addTo(layerGroup);
    });
  }, [coordinates]);

  const handleUndo = () => {
    if (coordinates.length > 0) {
      const next = coordinates.slice(0, -1);
      onChange(next);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const handleFocusRegion = (region: typeof CHENNAI_REGIONS[0]) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([region.lat, region.lng], 14, { duration: 0.6 });
    }
    if (onLocationDetected) {
      onLocationDetected(region.name, region.ward);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 15, { duration: 0.6 });
        }
      },
      (err) => {
        console.warn('Geolocation failed', err);
      }
    );
  };

  const handleApplyManualCoordinates = () => {
    const sLat = parseFloat(manualStartLat);
    const sLng = parseFloat(manualStartLng);
    const eLat = parseFloat(manualEndLat);
    const eLng = parseFloat(manualEndLng);

    if (isNaN(sLat) || isNaN(sLng) || isNaN(eLat) || isNaN(eLng)) {
      alert('Please enter valid numeric latitude and longitude values.');
      return;
    }

    const newCoords: [number, number][] = [
      [sLng, sLat],
      [eLng, eLat]
    ];
    onChange(newCoords);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds([
        [sLat, sLng],
        [eLat, eLng]
      ], { padding: [40, 40], maxZoom: 15 });
    }
  };

  const distanceMeters = calculatePathDistanceMeters(coordinates);

  return (
    <div className="space-y-3">
      {/* Top Map Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-blue-700" />
            Quick Region Focus:
          </span>
          <select
            onChange={(e) => {
              const reg = CHENNAI_REGIONS.find((r) => r.name === e.target.value);
              if (reg) handleFocusRegion(reg);
            }}
            defaultValue=""
            className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="" disabled>Select Chennai Zone / Region...</option>
            {CHENNAI_REGIONS.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCurrentLocation}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700 transition-colors"
            title="Focus to current GPS location"
          >
            <Crosshair className="w-3.5 h-3.5 text-slate-600" />
            <span>My Location</span>
          </button>

          <button
            type="button"
            onClick={() => setShowManualInputs(!showManualInputs)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>{showManualInputs ? 'Hide GPS Inputs' : 'Manual GPS'}</span>
          </button>

          <button
            type="button"
            disabled={coordinates.length === 0}
            onClick={handleUndo}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700 transition-colors disabled:opacity-40"
            title="Undo last plotted point"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>Undo</span>
          </button>

          <button
            type="button"
            disabled={coordinates.length === 0}
            onClick={handleClear}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-xs font-medium text-red-700 transition-colors disabled:opacity-40"
            title="Clear all plotted points"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Optional Manual GPS Coordinate Box */}
      {showManualInputs && (
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-2">
          <div className="font-semibold text-blue-900 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-700" />
            Enter Direct GPS Waypoints (Start & End):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] text-slate-600 font-medium block">Start Lat</label>
              <input
                type="text"
                value={manualStartLat}
                onChange={(e) => setManualStartLat(e.target.value)}
                placeholder="13.0285"
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-medium block">Start Lng</label>
              <input
                type="text"
                value={manualStartLng}
                onChange={(e) => setManualStartLng(e.target.value)}
                placeholder="80.2285"
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-medium block">End Lat</label>
              <input
                type="text"
                value={manualEndLat}
                onChange={(e) => setManualEndLat(e.target.value)}
                placeholder="13.0189"
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-medium block">End Lng</label>
              <input
                type="text"
                value={manualEndLng}
                onChange={(e) => setManualEndLng(e.target.value)}
                placeholder="80.2215"
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyManualCoordinates}
            className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-medium"
          >
            Plot GPS Corridor
          </button>
        </div>
      )}

      {/* Interactive Leaflet Map Container */}
      <div className="relative w-full h-[320px] rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

        {/* Live Instruction & Status Pill */}
        <div className="absolute top-2.5 left-2.5 z-10 bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-md shadow text-xs">
          {coordinates.length === 0 ? (
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Click anywhere on the map to plot Point 1 (Start of Trench)</span>
            </div>
          ) : coordinates.length === 1 ? (
            <div className="flex items-center gap-1.5 text-amber-800 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Click a second point on the road to complete the corridor</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {coordinates.length} waypoints plotted • ~{distanceMeters > 1000 ? `${(distanceMeters / 1000).toFixed(2)} km` : `${distanceMeters} m`} trench length
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Plotted Point Summary */}
      <div className="text-xs text-slate-500 flex flex-wrap items-center justify-between gap-1">
        <span>
          Click on the map to add more trench vertices along curves or intersections. Minimum 2 points required.
        </span>
        <span className="font-mono text-[11px] text-slate-700">
          Vertices: <strong>{coordinates.length}</strong>
        </span>
      </div>
    </div>
  );
}
