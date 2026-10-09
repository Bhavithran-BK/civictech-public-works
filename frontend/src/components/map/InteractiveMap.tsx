'use client';

import React, { useEffect, useRef } from 'react';
import { Project, ProjectStatus } from '@/lib/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  projects: Project[];
  selectedProjectId?: string | null;
  onSelectProject: (project: Project) => void;
  center?: [number, number];
  zoom?: number;
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  on_track: '#16a34a',
  at_risk: '#ca8a04',
  delayed: '#dc2626',
  stalled: '#9333ea',
  planned: '#64748b',
  completed: '#2563eb'
};

export default function InteractiveMap({
  projects,
  selectedProjectId,
  onSelectProject,
  center = [13.0428, 80.2526],
  zoom = 13
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(center, zoom);

      // High performance CartoDB Voyager raster tiles (sleek civic style)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.attribution({ position: 'bottomleft', prefix: '© OpenStreetMap contributors | GCC PostGIS' }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;

    if (layerGroup) {
      layerGroup.clearLayers();

      projects.forEach((proj) => {
        const isSelected = proj.id === selectedProjectId;
        const color = STATUS_COLORS[proj.status] || '#64748b';

        // 1. Draw road trench corridor (LineString)
        if (proj.corridorPath && proj.corridorPath.length > 1) {
          const polyline = L.polyline(proj.corridorPath, {
            color: color,
            weight: isSelected ? 8 : 5,
            opacity: isSelected ? 0.95 : 0.75,
            dashArray: proj.status === 'planned' ? '6, 8' : undefined,
            lineCap: 'round',
            lineJoin: 'round'
          });

          polyline.on('click', () => onSelectProject(proj));
          polyline.addTo(layerGroup);
        }

        // 2. Draw Centroid pin
        const hasConflict = proj.conflicts && proj.conflicts.length > 0;
        const markerHtml = `
          <div class="relative group cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
            <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white font-bold text-xs" style="background-color: ${color}">
              ${proj.type === 'road' ? '🛣️' : proj.type === 'electricity' ? '⚡' : proj.type === 'metro' ? '🚇' : '💧'}
            </div>
            ${
              hasConflict
                ? `<span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 border-2 border-white rounded-full animate-ping"></span>
                   <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 border-2 border-white rounded-full"></span>`
                : ''
            }
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-civic-pin',
          html: markerHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([proj.coordinates.lat, proj.coordinates.lng], { icon: customIcon });

        marker.on('click', () => {
          onSelectProject(proj);
          map.panTo([proj.coordinates.lat, proj.coordinates.lng], { animate: true });
        });

        marker.addTo(layerGroup);
      });
    }
  }, [projects, selectedProjectId, onSelectProject, center, zoom]);

  // Center pan when selected project changes
  useEffect(() => {
    if (selectedProjectId && mapInstanceRef.current) {
      const activeProj = projects.find((p) => p.id === selectedProjectId);
      if (activeProj) {
        mapInstanceRef.current.flyTo(
          [activeProj.coordinates.lat, activeProj.coordinates.lng],
          15,
          { duration: 0.8 }
        );
      }
    }
  }, [selectedProjectId, projects]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Map Legend Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-md text-xs pointer-events-auto">
        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Trench Corridors
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> On Track</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> At Risk</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Delayed</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Stalled</span>
        </div>
      </div>
    </div>
  );
}
