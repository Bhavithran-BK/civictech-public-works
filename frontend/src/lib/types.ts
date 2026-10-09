// Types strictly aligned with openapi.yaml and mock-data.json

export type ProjectStatus =
  | 'on_track'
  | 'at_risk'
  | 'delayed'
  | 'planned'
  | 'completed'
  | 'stalled';

export type ProjectType =
  | 'road'
  | 'drain'
  | 'pipeline'
  | 'electrical'
  | 'telecom';

export interface Department {
  id: string;
  name: string;
  code: string;
  type: string;
  contact_email?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  department_id?: string;
  department_name?: string;
  role: 'public' | 'officer' | 'admin';
}

export interface Project {
  id: string;
  title: string;
  purpose: string;
  type: ProjectType;
  department_id: string;
  department_name: string;
  contractor: string;
  budget: number;
  start_date: string;
  end_date: string;
  original_end_date: string;
  status: ProjectStatus;
  health_score: number;
  location_name: string;
  ward?: string;
  latest_delay_reason?: string | null;
  coordinates: [number, number][]; // [lng, lat] LineString vertices
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  author_id?: string;
  note: string;
  created_at: string;
}

export interface DelayRecord {
  id: string;
  project_id: string;
  reason: string;
  old_end_date: string;
  new_end_date: string;
  logged_by?: string;
  created_at: string;
}

export interface CitizenReport {
  id: string;
  project_id: string;
  kind: 'progress_verified' | 'no_activity' | 'safety_hazard';
  photo_url?: string;
  lat: number;
  lng: number;
  distance_m: number;
  verified: boolean;
  notes?: string;
  created_at: string;
}

export interface DashboardSummary {
  total_projects: number;
  status_counts: {
    on_track: number;
    at_risk: number;
    delayed: number;
    planned: number;
    completed: number;
    stalled: number;
  };
  overdue_projects_count: number;
  open_reports_count: number;
  unresponsive_reports_72h: number;
  duplicate_dig_savings_est_inr: number;
  recent_conflicts_prevented: number;
  overdue_projects?: Project[];
}

export interface ConflictingProject {
  project_id: string;
  title: string;
  department: string;
  start_date: string;
  end_date: string;
  distance_meters: number;
  conflict_type: 'schedule_overlap' | 'recently_dug';
  description?: string;
}

export interface ConflictCheckResult {
  has_conflict: boolean;
  clash_count: number;
  conflicting_projects: ConflictingProject[];
  suggested_joint_window?: {
    start_date: string;
    end_date: string;
    recommendation: string;
  } | null;
}
