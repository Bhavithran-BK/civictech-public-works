import {
  CitizenReport,
  ConflictCheckResult,
  DashboardSummary,
  DelayRecord,
  Department,
  Project,
  ProjectStatus,
  ReportKind,
  User,
} from './types';
import {
  MOCK_DASHBOARD_SUMMARY,
  MOCK_DEPARTMENTS,
  MOCK_PROJECTS,
  MOCK_USER,
} from './mockData';
import { normalizeProject } from './geo';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// In-memory store for optimistic local mutations when backend is pending
let localProjects: Project[] = [...MOCK_PROJECTS];

function getAuthHeader(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('digonce_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

// Distance calculation between coordinate points in meters (Haversine)
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ==========================================
// Standalone Citizen API Functions
// ==========================================

export async function fetchProjects(workType?: string, status?: string): Promise<Project[]> {
  try {
    const params = new URLSearchParams();
    if (workType && workType !== 'all') params.append('type', workType);
    if (status && status !== 'all') params.append('status', status);

    const url = `${BASE_URL}/projects${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch projects');
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeProject) : [];
  } catch (error) {
    console.error('API Error in fetchProjects, fallback to cache:', error);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('digonce_projects_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.map(normalizeProject) : [];
      }
    }
    return localProjects.map(normalizeProject);
  }
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  try {
    const res = await fetch(`${BASE_URL}/projects/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Project not found');
    const data = await res.json();
    return data ? normalizeProject(data) : null;
  } catch (error) {
    console.error('API Error in fetchProjectById:', error);
    const found = localProjects.find((p) => p.id === id);
    return found ? normalizeProject(found) : null;
  }
}

export async function postCitizenReport(
  projectId: string,
  report: {
    kind: string;
    description: string;
    reportedLat: number;
    reportedLng: number;
    reporterHandle: string;
  }
): Promise<{ success: boolean; report: CitizenReport; newHealthScore: number; status: Project['status'] }> {
  try {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });

    if (res.ok) {
      const data = await res.json();
      const reportObj = data.report || data;
      const distance = reportObj.distanceMeters ?? reportObj.distance_m ?? 0;
      const verified = reportObj.verified ?? true;
      const newHealthScore = data.newHealthScore ?? data.new_health_score ?? data.health_score ?? 85;
      const status = data.status || 'on_track';

      return {
        success: true,
        report: {
          ...reportObj,
          distanceMeters: distance,
          distance_m: distance,
          verified,
        },
        newHealthScore,
        status,
      };
    }
  } catch (err) {
    console.warn('Backend unavailable, saving report locally:', err);
  }

  // Graceful local offline fallback
  const p = localProjects.find((x) => x.id === projectId);
  const minDistance = 28;
  const mockReport: CitizenReport = {
    id: `rep-${Date.now()}`,
    projectId,
    project_id: projectId,
    kind: report.kind as ReportKind,
    reportedLat: report.reportedLat,
    reportedLng: report.reportedLng,
    lat: report.reportedLat,
    lng: report.reportedLng,
    notes: report.description,
    description: report.description,
    verified: true,
    distanceMeters: minDistance,
    distance_m: minDistance,
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString(),
    reporterHandle: report.reporterHandle || 'Resident Citizen',
  };

  const newScore = p ? Math.max(15, (p.health_score ?? p.healthScore ?? 85) - (report.kind === 'progress_verified' ? -5 : 12)) : 80;
  const newStatus = (report.kind === 'no_activity' ? 'stalled' : report.kind === 'safety_hazard' ? 'at_risk' : p?.status || 'on_track') as Project['status'];

  if (p) {
    p.healthScore = newScore;
    p.health_score = newScore;
    p.status = newStatus;
    if (!p.citizenReports) p.citizenReports = [];
    p.citizenReports.unshift(mockReport);
  }

  return {
    success: true,
    report: mockReport,
    newHealthScore: newScore,
    status: newStatus,
  };
}

export async function postProjectDelay(
  projectId: string,
  delay: {
    reason: string;
    newEndDate: string;
    officerName: string;
  }
): Promise<{ success: boolean; project: Project }> {
  const res = await fetch(`${BASE_URL}/projects/${projectId}/delays`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(delay),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to log delay');
  }

  return await res.json();
}

// ==========================================
// Department Admin & Core API Object
// ==========================================

export const api = {
  // Authentication
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof window !== 'undefined' && data.access_token) {
          localStorage.setItem('digonce_token', data.access_token);
        }
        return data;
      }
    } catch {
      // Fallback open access for demo if backend isn't up
    }

    const mockToken = `jwt-demo-${Date.now()}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('digonce_token', mockToken);
    }
    return {
      access_token: mockToken,
      user: {
        ...MOCK_USER,
        email: email || MOCK_USER.email,
      },
    };
  },

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('digonce_token');
      if (token) return MOCK_USER;
    }
    return null;
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('digonce_token');
    }
  },

  // Dashboard Metrics
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const res = await fetch(`${BASE_URL}/dashboard/summary`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback to local computation
    }

    const counts = {
      on_track: localProjects.filter((p) => p.status === 'on_track').length,
      at_risk: localProjects.filter((p) => p.status === 'at_risk').length,
      delayed: localProjects.filter((p) => p.status === 'delayed').length,
      planned: localProjects.filter((p) => p.status === 'planned').length,
      completed: localProjects.filter((p) => p.status === 'completed').length,
      stalled: localProjects.filter((p) => p.status === 'stalled').length,
    };

    const overdue = localProjects.filter((p) => p.status === 'delayed' || p.status === 'stalled');

    return {
      ...MOCK_DASHBOARD_SUMMARY,
      total_projects: localProjects.length,
      status_counts: counts,
      overdue_projects_count: overdue.length,
      overdue_projects: overdue,
    };
  },

  // Projects
  async getProjects(filters?: {
    type?: string;
    department_id?: string;
    status?: string;
  }): Promise<Project[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.set('type', filters.type);
      if (filters?.department_id) params.set('department_id', filters.department_id);
      if (filters?.status) params.set('status', filters.status);

      const res = await fetch(`${BASE_URL}/projects?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data.map(normalizeProject) : [];
      }
    } catch {
      // Graceful fallback
    }

    let result = localProjects.map(normalizeProject);
    if (filters?.type && filters.type !== 'all') {
      result = result.filter((p) => p.type === filters.type);
    }
    if (filters?.department_id && filters.department_id !== 'all') {
      result = result.filter(
        (p) => (p.department_id || p.departmentId) === filters.department_id
      );
    }
    if (filters?.status && filters.status !== 'all') {
      result = result.filter((p) => p.status === filters.status);
    }
    return result;
  },

  async getProjectById(id: string): Promise<Project | null> {
    try {
      const res = await fetch(`${BASE_URL}/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        return data ? normalizeProject(data) : null;
      }
    } catch {
      // Fallback
    }

    const found = localProjects.find((p) => p.id === id);
    return found ? normalizeProject(found) : null;
  },

  async createProject(input: {
    title: string;
    purpose: string;
    type: Project['type'];
    department_id: string;
    contractor: string;
    budget: number;
    start_date: string;
    end_date: string;
    location_name: string;
    ward?: string;
    coordinates: [number, number][];
  }): Promise<Project> {
    try {
      const res = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const dept = MOCK_DEPARTMENTS.find((d) => d.id === input.department_id);
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      ...input,
      department_name: dept?.name || 'Municipal Works',
      departmentName: dept?.name || 'Municipal Works',
      original_end_date: input.end_date,
      status: 'planned',
      health_score: 100,
      healthScore: 100,
      latest_delay_reason: null,
    };
    localProjects.unshift(newProj);
    return newProj;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    try {
      const res = await fetch(`${BASE_URL}/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const index = localProjects.findIndex((p) => p.id === id);
    if (index !== -1) {
      localProjects[index] = { ...localProjects[index], ...updates };
      return localProjects[index];
    }
    throw new Error('Project not found');
  },

  async logDelay(id: string, reason: string, newEndDate: string): Promise<Project> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Delay reason is mandatory and cannot be empty.');
    }

    try {
      const res = await fetch(`${BASE_URL}/projects/${id}/delays`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ reason, new_end_date: newEndDate }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const index = localProjects.findIndex((p) => p.id === id);
    if (index !== -1) {
      const p = localProjects[index];
      const updated: Project = {
        ...p,
        end_date: newEndDate,
        endDate: newEndDate,
        plannedEndDate: newEndDate,
        latest_delay_reason: reason,
        status: 'delayed' as ProjectStatus,
        health_score: Math.max(20, (p.health_score ?? p.healthScore ?? 100) - 25),
        healthScore: Math.max(20, (p.healthScore ?? p.health_score ?? 100) - 25),
      };
      localProjects[index] = updated;
      return updated;
    }
    throw new Error('Project not found');
  },

  // Conflict Engine Check
  async checkConflict(input: {
    start_date: string;
    end_date: string;
    coordinates: [number, number][];
    buffer_meters?: number;
  }): Promise<ConflictCheckResult> {
    try {
      const res = await fetch(`${BASE_URL}/projects/conflict-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const inputStart = new Date(input.start_date).getTime();
    const inputEnd = new Date(input.end_date).getTime();
    const buffer = input.buffer_meters || 50;

    const clashes = [];

    for (const proj of localProjects) {
      const sDate = proj.start_date || proj.startDate || '';
      const eDate = proj.end_date || proj.plannedEndDate || '';
      const projStart = new Date(sDate).getTime();
      const projEnd = new Date(eDate).getTime();

      const isDateOverlapping = inputStart <= projEnd && inputEnd >= projStart;
      const isRecentlyDug =
        proj.status === 'completed' &&
        inputStart >= projEnd &&
        inputStart - projEnd < 90 * 24 * 60 * 60 * 1000;

      if (!isDateOverlapping && !isRecentlyDug) continue;

      let minDistance = Infinity;
      const coords: [number, number][] = Array.isArray(proj.coordinates)
        ? proj.coordinates
        : proj.corridorPath || [];

      for (const [inLng, inLat] of input.coordinates) {
        for (const pt of coords) {
          if (Array.isArray(pt)) {
            const [pLng, pLat] = pt;
            const d = getDistanceMeters(inLat, inLng, pLat, pLng);
            if (d < minDistance) minDistance = d;
          }
        }
      }

      if (minDistance <= buffer) {
        const deptName = proj.department_name || proj.departmentName || 'Public Works';
        clashes.push({
          project_id: proj.id,
          title: proj.title,
          department: deptName,
          start_date: sDate,
          end_date: eDate,
          distance_meters: Math.round(minDistance),
          conflict_type: isDateOverlapping ? ('schedule_overlap' as const) : ('recently_dug' as const),
          description: isDateOverlapping
            ? `Clashes with ${deptName} schedule (${sDate} to ${eDate}) within ${Math.round(minDistance)}m on same street.`
            : `Road was recently dug and completed by ${deptName} on ${eDate}. Repaving moratorium applies.`,
        });
      }
    }

    if (clashes.length > 0) {
      return {
        has_conflict: true,
        clash_count: clashes.length,
        conflicting_projects: clashes,
        suggested_joint_window: {
          start_date: clashes[0].start_date,
          end_date: input.end_date > clashes[0].end_date ? input.end_date : clashes[0].end_date,
          recommendation:
            'Conduct joint utility trenching coordination before road surface is sealed to avoid repeated excavation penalties.',
        },
      };
    }

    return {
      has_conflict: false,
      clash_count: 0,
      conflicting_projects: [],
      suggested_joint_window: null,
    };
  },

  async getDepartments(): Promise<Department[]> {
    return MOCK_DEPARTMENTS;
  },
};
