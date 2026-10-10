'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ConflictCheckResult, Department, ProjectType } from '@/lib/types';
import { DeptNav } from '@/components/DeptNav';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  HardHat,
  IndianRupee,
  Layers,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Info,
  Navigation,
  Compass,
} from 'lucide-react';

const CorridorPlotter = dynamic(() => import('@/components/map/CorridorPlotter'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-500 font-medium">
      Loading OpenStreetMap Corridor Studio...
    </div>
  ),
});

const ROAD_PRESETS = [
  {
    name: 'Anna Salai (Saidapet Corridor)',
    ward: 'Ward 142 (Zone 10)',
    coords: [
      [80.2285, 13.0285],
      [80.2241, 13.0232],
      [80.2215, 13.0189],
    ] as [number, number][],
    clashNote: 'Known active road resurfacing project here (Oct - Nov 2026)',
  },
  {
    name: '100 Feet Bypass Road, Velachery',
    ward: 'Ward 177 (Zone 13)',
    coords: [
      [80.2175, 12.9816],
      [80.2203, 12.9784],
      [80.2228, 12.9756],
    ] as [number, number][],
    clashNote: 'Known storm water drain works active here',
  },
  {
    name: 'Sir Theagaraya Road, T. Nagar',
    ward: 'Ward 136 (Zone 10)',
    coords: [
      [80.2335, 13.0412],
      [80.2369, 13.0401],
    ] as [number, number][],
    clashNote: 'Recently dug and repaved within 60 days',
  },
  {
    name: 'OMR IT Corridor Service Lane, Perungudi',
    ward: 'Ward 184 (Zone 14)',
    coords: [
      [80.2468, 12.9661],
      [80.2435, 12.9515],
    ] as [number, number][],
    clashNote: 'Drainage channel construction corridor',
  },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [type, setType] = useState<ProjectType>('pipeline');
  const [departmentId, setDepartmentId] = useState('dept-02');
  const [contractor, setContractor] = useState('');
  const [budget, setBudget] = useState('25000000');
  const [startDate, setStartDate] = useState('2026-10-28');
  const [endDate, setEndDate] = useState('2026-12-15');
  const [locationName, setLocationName] = useState(ROAD_PRESETS[0].name);
  const [ward, setWard] = useState(ROAD_PRESETS[0].ward);
  const [coordinates, setCoordinates] = useState<[number, number][]>(ROAD_PRESETS[0].coords);
  const [corridorMode, setCorridorMode] = useState<'map' | 'presets'>('map');

  // Live Conflict State
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [conflictResult, setConflictResult] = useState<ConflictCheckResult | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    api.getDepartments().then(setDepartments);
  }, []);

  // Run live conflict check on date / geometry changes
  useEffect(() => {
    if (!startDate || !endDate || coordinates.length === 0) return;

    if (new Date(endDate) < new Date(startDate)) {
      setConflictResult(null);
      return;
    }

    let isMounted = true;
    setCheckingConflict(true);

    const timer = setTimeout(async () => {
      try {
        const result = await api.checkConflict({
          start_date: startDate,
          end_date: endDate,
          coordinates,
          buffer_meters: 50,
        });
        if (isMounted) {
          setConflictResult(result);
        }
      } catch (err) {
        console.error('Conflict check error', err);
      } finally {
        if (isMounted) setCheckingConflict(false);
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [startDate, endDate, coordinates]);

  const handleSelectPreset = (preset: typeof ROAD_PRESETS[0]) => {
    setLocationName(preset.name);
    setWard(preset.ward);
    setCoordinates(preset.coords);
  };

  const handleApplyJointWindow = () => {
    if (conflictResult?.suggested_joint_window) {
      setStartDate(conflictResult.suggested_joint_window.start_date);
      setEndDate(conflictResult.suggested_joint_window.end_date);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (new Date(endDate) < new Date(startDate)) {
      setFormError('End date cannot be earlier than start date.');
      return;
    }

    if (!title.trim() || !purpose.trim() || !contractor.trim()) {
      setFormError('Please complete all mandatory project fields.');
      return;
    }

    if (coordinates.length < 2) {
      setFormError('Please plot at least 2 points on the interactive map to define the road corridor.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createProject({
        title,
        purpose,
        type,
        department_id: departmentId,
        contractor,
        budget: parseFloat(budget) || 1000000,
        start_date: startDate,
        end_date: endDate,
        location_name: locationName,
        ward,
        coordinates,
      });
      router.push('/dept/dashboard');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save project. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <DeptNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Schedule New Public Works Project
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Inputs are automatically validated against the PostGIS inter-department Dig-Once conflict engine.
          </p>
        </div>

        {formError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* LIVE CONFLICT ENGINE WARNING BANNER */}
        {checkingConflict && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Checking GIS geospatial buffer & timeline for overlapping works...</span>
          </div>
        )}

        {conflictResult && conflictResult.has_conflict && (
          <div className="mb-6 bg-gradient-to-r from-yellow-50 to-red-50 border border-yellow-400 rounded p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-500 text-white rounded shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-yellow-900 uppercase tracking-wide">
                    DigOnce Conflict Warning: {conflictResult.clash_count} Clash Detected
                  </h3>
                  <span className="text-[10px] font-bold bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded">
                    High Risk of Duplicate Digging
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {conflictResult.conflicting_projects.map((clash: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded border border-yellow-200 text-xs text-gray-800"
                    >
                      <div className="font-bold text-gray-900 flex items-center justify-between">
                        <span>{clash.title}</span>
                        <span className="text-[11px] font-semibold text-red-600">
                          {clash.distance_meters}m distance
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">
                        Department: <strong className="text-gray-800">{clash.department}</strong>
                      </p>
                      <p className="text-gray-600">
                        Schedule: <span className="font-mono">{clash.start_date}</span> to{' '}
                        <span className="font-mono">{clash.end_date}</span>
                      </p>
                      {clash.description && (
                        <p className="text-yellow-900 font-medium mt-1 bg-yellow-100 p-1.5 rounded">
                          ⚠️ {clash.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {conflictResult.suggested_joint_window && (
                  <div className="mt-4 pt-3 border-t border-yellow-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-yellow-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-700" />
                        Suggested Joint Coordination Window:
                      </span>
                      <p className="text-xs font-semibold text-gray-900 mt-0.5">
                        {conflictResult.suggested_joint_window.start_date} →{' '}
                        {conflictResult.suggested_joint_window.end_date}
                      </p>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        {conflictResult.suggested_joint_window.recommendation}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyJointWindow}
                      className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded shadow-sm shrink-0 self-start sm:self-auto transition-colors"
                    >
                      Align to Joint Window
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* The Project Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded border border-gray-200 p-5 sm:p-8 shadow-sm space-y-6">
          {/* Road Corridor & Location Definition Studio */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-700" />
                  Road Trench Corridor & Geography
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Plot points anywhere on the city map or select a quick corridor scenario to test real-time clash radar.
                </p>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCorridorMode('map')}
                  className={`text-xs px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                    corridorMode === 'map'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Plot Anywhere on Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCorridorMode('presets')}
                  className={`text-xs px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                    corridorMode === 'presets'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Demo Presets</span>
                </button>
              </div>
            </div>

            {corridorMode === 'map' ? (
              <div className="space-y-3">
                <CorridorPlotter
                  coordinates={coordinates}
                  onChange={setCoordinates}
                  onLocationDetected={(loc, w) => {
                    setLocationName(loc);
                    setWard(w);
                  }}
                />
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-blue-50/50 p-2 rounded border border-blue-100">
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    You can plot any road corridor across Greater Chennai or custom municipal limits. Click the map to draw the exact trench path.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-600">
                  Select a known corridor scenario to test Dig-Once spatio-temporal clash warnings:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROAD_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`text-xs p-3 rounded font-medium border text-left transition-all ${
                        locationName === p.name
                          ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-500'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{p.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${locationName === p.name ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {p.ward}
                        </span>
                      </div>
                      <div className={`text-[10px] mt-1 ${locationName === p.name ? 'text-blue-100' : 'text-gray-500'}`}>
                        {p.clashNote}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Project Title (What) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Trunk Water Distribution Conduit Replacement"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Purpose & Scope of Work <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Detail the civic objective, depth of trenching, or road resurfacing specifications..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Infrastructure Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ProjectType)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="pipeline">Pipeline (Water / Sewerage / Gas)</option>
                <option value="road">Road Resurfacing / Pavement</option>
                <option value="drain">Storm Water Drain / Culvert</option>
                <option value="electrical">Electrical (Power Cables / RMUs)</option>
                <option value="telecom">Telecom & Smart City Fiber</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Department (Who) <span className="text-red-500">*</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Awarded Contractor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                placeholder="e.g. Larsen & Toubro Infra"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Budget (INR ₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Scheduled Start Date (When) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Scheduled End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Road / Street Location Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Ward / Zone
              </label>
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/dept/dashboard')}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-medium rounded shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording Project...</span>
                </>
              ) : (
                <>
                  <span>Create & Publish Schedule</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
