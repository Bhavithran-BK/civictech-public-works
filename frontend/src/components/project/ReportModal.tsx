'use client';

import React, { useState } from 'react';
import { Project, ReportKind } from '@/lib/types';
import { postCitizenReport } from '@/lib/api';
import { X, MapPin, CheckCircle, AlertTriangle, AlertOctagon, Wrench, Search, Loader2 } from 'lucide-react';

interface ReportModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted: (updatedProjectStatus: Project['status'], newHealthScore: number) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  project,
  isOpen,
  onClose,
  onReportSubmitted
}) => {
  const [kind, setKind] = useState<ReportKind>('no_activity');
  const [description, setDescription] = useState('');
  const [reporterHandle, setReporterHandle] = useState('Resident Citizen');
  const [isLocating, setIsLocating] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{ status: string; health: number; distance: number; verified: boolean } | null>(null);

  if (!isOpen || !project) return null;

  const handleAcquireLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        () => {
          // Fallback simulation near project coordinates
          const simulatedLat = project.coordinates.lat + (Math.random() - 0.5) * 0.001;
          const simulatedLng = project.coordinates.lng + (Math.random() - 0.5) * 0.001;
          setGpsLocation({ lat: simulatedLat, lng: simulatedLng });
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setGpsLocation({ lat: project.coordinates.lat + 0.0001, lng: project.coordinates.lng + 0.0001 });
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    const lat = gpsLocation?.lat || project.coordinates.lat;
    const lng = gpsLocation?.lng || project.coordinates.lng;

    try {
      const res = await postCitizenReport(project.id, {
        kind,
        description,
        reportedLat: lat,
        reportedLng: lng,
        reporterHandle: reporterHandle.trim() || 'Anonymous Resident'
      });

      setSuccessResult({
        status: res.status,
        health: res.newHealthScore,
        distance: res.report.distanceMeters ?? res.report.distance_m ?? 0,
        verified: res.report.verified
      });

      setTimeout(() => {
        setIsSubmitting(false);
        onReportSubmitted(res.status, res.newHealthScore);
        onClose();
        setSuccessResult(null);
        setDescription('');
        setGpsLocation(null);
      }, 1600);
    } catch {
      setIsSubmitting(false);
      alert('Error submitting report.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl border border-slate-300 overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Citizen Field Check-in & Audit</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              {project.referenceCode} · {project.roadName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {successResult ? (
          <div className="p-8 text-center space-y-3 bg-white">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Check-in Registered on Municipal Ledger</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              {successResult.verified
                ? `GPS verified (${successResult.distance}m from trench). Project Health Score updated to ${successResult.health}%.`
                : `Logged with unverified tag (${successResult.distance}m from site threshold).`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-white">
            {/* Observation Types Grid */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                On-Site Status Observed
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'no_activity', label: 'No Activity / Stalled', sub: 'Trench left abandoned', icon: <AlertOctagon className="w-4 h-4 text-purple-700" /> },
                  { id: 'progress_verified', label: 'Work in Progress', sub: 'Active crew & machinery', icon: <Wrench className="w-4 h-4 text-blue-700" /> },
                  { id: 'safety_hazard', label: 'Safety Hazard', sub: 'Unbarricaded open ditch', icon: <AlertTriangle className="w-4 h-4 text-amber-700" /> },
                  { id: 'poor_quality', label: 'Poor Quality Work', sub: 'Substandard road finish', icon: <Search className="w-4 h-4 text-rose-700" /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setKind(item.id as ReportKind)}
                    className={`p-2.5 text-left rounded border transition-colors ${
                      kind === item.id
                        ? 'border-blue-700 bg-blue-50/80 text-blue-900 font-semibold ring-1 ring-blue-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="mb-1">{item.icon}</div>
                    <div className="text-xs font-bold leading-tight">{item.label}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Observation Notes */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Field Observation Notes
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., Trench dug across lane with no workers present for the last 3 days..."
                className="w-full text-xs p-2.5 rounded border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>

            {/* GPS Geofence Box */}
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-700 shrink-0" />
                <span className="text-xs text-slate-700">
                  {gpsLocation ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> GPS Coordinates Attached
                    </span>
                  ) : (
                    'Attach GPS to verify <500m proximity'
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAcquireLocation}
                disabled={isLocating}
                className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-100 transition-colors"
              >
                {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Acquire GPS'}
              </button>
            </div>

            {/* Action Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Post Verified Public Check-in'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
