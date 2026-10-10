export type ProjectStatus =
  | 'on_track'
  | 'at_risk'
  | 'delayed'
  | 'stalled'
  | 'planned'
  | 'completed';

export type WorkType =
  | 'road'
  | 'drain'
  | 'drainage'
  | 'pipeline'
  | 'water_pipeline'
  | 'electrical'
  | 'electricity'
  | 'telecom'
  | 'metro';

export type ProjectType = WorkType;

export type ReportKind =
  | 'progress_verified'
  | 'no_activity'
  | 'safety_hazard'
  | 'poor_quality';

export interface Coordinates {
  lat: number;
  lng: number;
}

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

export interface ProjectUpdate {
  id: string;
  projectId?: string;
  project_id?: string;
  author?: string;
  author_id?: string;
  authorRole?: string;
  note: string;
  createdAt?: string;
  created_at?: string;
  photos?: string[];
}

export interface DelayRecord {
  id: string;
  projectId?: string;
  project_id?: string;
  reason: string;
  previousEndDate?: string;
  old_end_date?: string;
  newEndDate?: string;
  new_end_date?: string;
  loggedAt?: string;
  created_at?: string;
  logged_by?: string;
  officerName?: string;
}

export interface CitizenReport {
  id: string;
  projectId?: string;
  project_id?: string;
  kind: ReportKind;
  description?: string;
  notes?: string;
  photoUrl?: string;
  photo_url?: string;
  reportedLat?: number;
  reportedLng?: number;
  lat?: number;
  lng?: number;
  distanceMeters?: number;
  distance_m?: number;
  verified: boolean;
  createdAt?: string;
  created_at?: string;
  reporterHandle?: string;
}

export interface ProjectConflict {
  conflictingProjectId?: string;
  conflictingProjectTitle?: string;
  departmentName?: string;
  overlapDistanceMeters?: number;
  conflictType?: 'spatial_temporal' | 'recent_paving_destruction' | 'schedule_overlap' | 'recently_dug';
  suggestedAction?: string;
  estimatedAvoidableCostInr?: number;
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

export interface Project {
  id: string;
  referenceCode?: string;
  title: string;
  purpose: string;
  type: WorkType;
  departmentId?: string;
  department_id?: string;
  departmentName?: string;
  department_name?: string;
  departmentBadgeColor?: string;
  contractor: string;
  budget?: number;
  budgetInr?: number;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  original_end_date?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  status: ProjectStatus;
  healthScore?: number;
  health_score?: number;
  wardNumber?: number;
  wardName?: string;
  ward?: string;
  roadName?: string;
  location_name?: string;
  coordinates?: Coordinates | [number, number][] | any;
  corridorPath?: [number, number][]; // [lat, lng] array
  lastOfficialUpdateDaysAgo?: number;
  unresolvedReportsCount?: number;
  delays?: DelayRecord[];
  updates?: ProjectUpdate[];
  citizenReports?: CitizenReport[];
  conflicts?: ProjectConflict[];
  latest_delay_reason?: string | null;
}

export interface FilterState {
  search: string;
  type: WorkType | 'all';
  status: ProjectStatus | 'all';
  department: string | 'all';
  ward: string | 'all';
}
