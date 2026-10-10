'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Project, ProjectStatus } from '@/lib/types';
import { DeptNav } from '@/components/DeptNav';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  AlertCircle,
  AlertOctagon,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  HardHat,
  IndianRupee,
  Loader2,
  Save,
  ShieldAlert,
} from 'lucide-react';

function EditProjectContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [contractor, setContractor] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('on_track');
  const [endDate, setEndDate] = useState('');
  const [originalEndDate, setOriginalEndDate] = useState('');

  // Mandatory Delay Reason
  const [delayReason, setDelayReason] = useState('');
  const [isExtendingDate, setIsExtendingDate] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    api
      .getProjectById(projectId)
      .then((data) => {
        if (data) {
          setProject(data);
          setTitle(data.title);
          setPurpose(data.purpose);
          setContractor(data.contractor);
          setBudget(data.budget.toString());
          setStatus(data.status);
          setEndDate(data.end_date);
          setOriginalEndDate(data.original_end_date);
          setDelayReason(data.latest_delay_reason || '');
        }
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  // Track if officer has moved the end date beyond the recorded end date
  useEffect(() => {
    if (project && endDate) {
      if (new Date(endDate) > new Date(project.end_date)) {
        setIsExtendingDate(true);
      } else {
        setIsExtendingDate(false);
      }
    }
  }, [endDate, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // CRITICAL MVP RULE: Delay cannot be saved without a reason
    if (isExtendingDate || status === 'delayed') {
      if (!delayReason || delayReason.trim().length < 5) {
        setErrorMessage(
          'CRITICAL VALIDATION ERROR: A mandatory reason is required to log a schedule delay or extend project dates.'
        );
        return;
      }
    }

    setSaving(true);
    try {
      if (isExtendingDate) {
        // Call delay endpoint with mandatory reason
        await api.logDelay(projectId, delayReason, endDate);
      }

      await api.updateProject(projectId, {
        title,
        purpose,
        contractor,
        budget: parseFloat(budget) || project?.budget || 0,
        status: isExtendingDate ? 'delayed' : status,
      });

      setSuccessMessage('Project details and schedule update recorded successfully.');
      setTimeout(() => {
        router.push('/dept/dashboard');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save updates. Please check connection.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <DeptNav />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <DeptNav />
        <div className="p-8 text-center text-slate-600">Project not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DeptNav />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <button
          onClick={() => router.push('/dept/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Authority Dashboard</span>
        </button>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Update Project & Log Delays
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {project.location_name} • {project.department_name}
            </p>
          </div>
          <StatusBadge status={project.status} healthScore={project.health_score} />
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs font-semibold text-rose-800 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p>{errorMessage}</p>
              <p className="font-normal text-[11px] text-rose-600 mt-0.5">
                Civic accountability rules require every delay to be justified with an official public note.
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Title (What)
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Scope / Purpose
              </label>
              <textarea
                rows={3}
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contractor (Who)
                </label>
                <input
                  type="text"
                  required
                  value={contractor}
                  onChange={(e) => setContractor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Budget (INR ₹)
                </label>
                <input
                  type="number"
                  required
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="on_track">On track (Green)</option>
                  <option value="at_risk">At risk (Yellow)</option>
                  <option value="delayed">Delayed (Red)</option>
                  <option value="planned">Planned (Grey)</option>
                  <option value="completed">Completed (Blue)</option>
                  <option value="stalled">Stalled (Auto-Escalated)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Completion End Date (When)
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-[11px] text-slate-400 mt-1">
                  Original planned date: <span className="font-mono">{originalEndDate}</span>
                </div>
              </div>
            </div>

            {/* MANDATORY DELAY REASON SECTION */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isExtendingDate || status === 'delayed'
                  ? 'bg-rose-50 border-rose-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="delayReason"
                  className={`text-xs font-bold flex items-center gap-1.5 ${
                    isExtendingDate || status === 'delayed'
                      ? 'text-rose-900'
                      : 'text-slate-700'
                  }`}
                >
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>
                    Mandatory Reason for Delay{' '}
                    {(isExtendingDate || status === 'delayed') && (
                      <span className="text-rose-600 font-extrabold">* (REQUIRED)</span>
                    )}
                  </span>
                </label>
                {(isExtendingDate || status === 'delayed') && (
                  <span className="text-[10px] font-bold uppercase bg-rose-200 text-rose-800 px-2 py-0.5 rounded">
                    Submission Blocked Without Reason
                  </span>
                )}
              </div>

              <textarea
                id="delayReason"
                rows={3}
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                placeholder="State the technical or logistical reason for timeline slippage (e.g. utility relocation, monsoon inundation, contractor dispute)..."
                className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                  isExtendingDate || status === 'delayed'
                    ? 'bg-white border-rose-300 text-slate-900 focus:ring-rose-500'
                    : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-500'
                }`}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                This explanation directly populates the public project timeline and citizen tracking view.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/dept/dashboard')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Project Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function EditProjectPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <EditProjectContent />
    </React.Suspense>
  );
}
