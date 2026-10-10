import {
  ConflictCheckResult,
  DashboardSummary,
  Department,
  Project,
  ProjectStatus,
  User,
} from './types';
import {
  MOCK_DASHBOARD_SUMMARY,
  MOCK_DEPARTMENTS,
  MOCK_PROJECTS,
  MOCK_USER,
} from './mockData';

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

    // Default open access response
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
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('digonce_token');
    if (!token) return null;
    return MOCK_USER;
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
        headers: { ...getAuthHeader() },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Graceful fallback
    }

    // Dynamic stats calculated from local projects
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
        return await res.json();
      }
    } catch {
      // Graceful fallback
    }

    let result = [...localProjects];
    if (filters?.type && filters.type !== 'all') {
      result = result.filter((p) => p.type === filters.type);
    }
    if (filters?.department_id && filters.department_id !== 'all') {
      result = result.filter((p) => p.department_id === filters.department_id);
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
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const found = localProjects.find((p) => p.id === id);
    return found || null;
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
      original_end_date: input.end_date,
      status: 'planned',
      health_score: 100,
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
        latest_delay_reason: reason,
        status: 'delayed' as ProjectStatus,
        health_score: Math.max(20, p.health_score - 25),
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

    // Local spatial & temporal conflict calculation
    const inputStart = new Date(input.start_date).getTime();
    const inputEnd = new Date(input.end_date).getTime();
    const buffer = input.buffer_meters || 50;

    const clashes = [];

    for (const proj of localProjects) {
      const projStart = new Date(proj.start_date).getTime();
      const projEnd = new Date(proj.end_date).getTime();

      // Check date range overlap or recently dug within 90 days
      const isDateOverlapping = inputStart <= projEnd && inputEnd >= projStart;
      const isRecentlyDug =
        proj.status === 'completed' &&
        inputStart >= projEnd &&
        inputStart - projEnd < 90 * 24 * 60 * 60 * 1000;

      if (!isDateOverlapping && !isRecentlyDug) continue;

      // Check distance between any coordinate points
      let minDistance = Infinity;
      for (const [inLng, inLat] of input.coordinates) {
        for (const [pLng, pLat] of proj.coordinates) {
          const d = getDistanceMeters(inLat, inLng, pLat, pLng);
          if (d < minDistance) minDistance = d;
        }
      }

      if (minDistance <= buffer) {
        clashes.push({
          project_id: proj.id,
          title: proj.title,
          department: proj.department_name,
          start_date: proj.start_date,
          end_date: proj.end_date,
          distance_meters: Math.round(minDistance),
          conflict_type: isDateOverlapping ? ('schedule_overlap' as const) : ('recently_dug' as const),
          description: isDateOverlapping
            ? `Clashes with ${proj.department_name} schedule (${proj.start_date} to ${proj.end_date}) within ${Math.round(minDistance)}m on same street.`
            : `Road was recently dug and completed by ${proj.department_name} on ${proj.end_date}. Repaving moratorium applies.`,
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
