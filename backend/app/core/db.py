from datetime import date, datetime
import json
import math
import os
from pathlib import Path
import sys
import threading
from typing import Any, Dict, List, Optional, Tuple
import uuid

from app.services.conflict_engine import check_spatial_temporal_conflicts
from app.services.health_score import calculate_health_score

_LOCK = threading.Lock()


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two GPS points in metres."""
    r = 6371000.0  # Earth radius in metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def find_mock_data_path() -> Optional[Path]:
    """Locate docs/mock-data.json relative to repository root or backend."""
    candidates = [
        Path(__file__).resolve().parent.parent.parent.parent / "docs" / "mock-data.json",
        Path(__file__).resolve().parent.parent.parent / "docs" / "mock-data.json",
        Path("docs/mock-data.json"),
        Path("../docs/mock-data.json"),
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def get_disk_storage_path() -> Path:
    return Path(__file__).resolve().parent.parent.parent / "local_db.json"


class DatabaseStore:
    def __init__(self):
        self.departments: List[Dict[str, Any]] = []
        self.users: List[Dict[str, Any]] = []
        self.projects: List[Dict[str, Any]] = []
        self.project_updates: Dict[str, List[Dict[str, Any]]] = {}
        self.delays: Dict[str, List[Dict[str, Any]]] = {}
        self.reports: Dict[str, List[Dict[str, Any]]] = {}
        self.subscriptions: Dict[str, List[Dict[str, Any]]] = {}
        self.loaded: bool = False
        self._load_seed_data()

    def _save_to_disk(self):
        """Persists database state to disk so records survive server restarts."""
        # Do not persist ephemeral mutations during automated pytest execution
        if "pytest" in sys.modules or os.getenv("TESTING") == "true":
            return
        try:
            path = get_disk_storage_path()
            state = {
                "departments": self.departments,
                "users": self.users,
                "projects": self.projects,
                "project_updates": self.project_updates,
                "delays": self.delays,
                "reports": self.reports,
                "subscriptions": self.subscriptions,
            }
            with open(path, "w", encoding="utf-8") as f:
                json.dump(state, f, indent=2, default=str)
        except Exception as e:
            print(f"Warning: Failed to persist local_db.json: {e}")

    def reset(self, force_mock: bool = True):
        """Resets in-memory state back to clean mock seed data for isolated test runs."""
        with _LOCK:
            self.departments = []
            self.users = []
            self.projects = []
            self.project_updates = {}
            self.delays = {}
            self.reports = {}
            self.subscriptions = {}
            mock_path = find_mock_data_path()
            if force_mock and mock_path:
                try:
                    with open(mock_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        self.departments = data.get("departments", [])
                        self.users = data.get("users", [])
                        for p in data.get("projects", []):
                            pid = p["id"]
                            self.project_updates[pid] = []
                            self.delays[pid] = []
                            self.reports[pid] = []
                            self.subscriptions[pid] = []
                            if p.get("latest_delay_reason"):
                                self.delays[pid].append({
                                    "id": f"del-{pid}-1",
                                    "project_id": pid,
                                    "reason": p["latest_delay_reason"],
                                    "old_end_date": p.get("original_end_date", p["end_date"]),
                                    "new_end_date": p["end_date"],
                                    "logged_by": "usr-01",
                                    "created_at": datetime.now().isoformat(),
                                })
                            self.project_updates[pid].append({
                                "id": f"upd-{pid}-1",
                                "project_id": pid,
                                "author_id": "usr-01",
                                "note": f"Initial project record registered for {p['title']}.",
                                "created_at": p["start_date"],
                            })
                            self.projects.append(p)
                        self.loaded = True
                        return
                except Exception as ex:
                    print(f"Notice: Failed to reload seed in reset: {ex}")
            self._load_seed_data()

    def _load_seed_data(self):
        # 1. Check if persistent local_db.json exists from previous run
        disk_path = get_disk_storage_path()
        if disk_path.exists():
            try:
                with open(disk_path, "r", encoding="utf-8") as f:
                    state = json.load(f)
                    self.departments = state.get("departments", [])
                    self.users = state.get("users", [])
                    self.projects = state.get("projects", [])
                    self.project_updates = state.get("project_updates", {})
                    self.delays = state.get("delays", {})
                    self.reports = state.get("reports", {})
                    self.subscriptions = state.get("subscriptions", {})
                    self.loaded = True
                    return
            except Exception as ex:
                print(f"Notice: local_db.json read error, falling back to mock seed: {ex}")

        # 2. Otherwise initialize from docs/mock-data.json
        mock_path = find_mock_data_path()
        if mock_path:
            try:
                with open(mock_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.departments = data.get("departments", [])
                    self.users = data.get("users", [])
                    raw_projects = data.get("projects", [])
                    for p in raw_projects:
                        pid = p["id"]
                        self.project_updates[pid] = []
                        self.delays[pid] = []
                        self.reports[pid] = []
                        self.subscriptions[pid] = []

                        # If project has latest delay reason, seed initial delay
                        if p.get("latest_delay_reason"):
                            self.delays[pid].append(
                                {
                                    "id": f"del-{pid}-1",
                                    "project_id": pid,
                                    "reason": p["latest_delay_reason"],
                                    "old_end_date": p.get("original_end_date", p["end_date"]),
                                    "new_end_date": p["end_date"],
                                    "logged_by": "usr-01",
                                    "created_at": datetime.now().isoformat(),
                                }
                            )

                        # Seed initial update
                        self.project_updates[pid].append(
                            {
                                "id": f"upd-{pid}-1",
                                "project_id": pid,
                                "author_id": "usr-01",
                                "note": f"Initial project record registered for {p['title']}.",
                                "created_at": p["start_date"],
                            }
                        )

                        self.projects.append(p)
                    self.loaded = True
                    return
            except Exception as ex:
                print(f"Warning: Failed to load mock-data.json: {ex}")

        # Fallback baseline seeds if file not found
        self.departments = [
            {
                "id": "dept-01",
                "name": "Greater Chennai Corporation - Roads & Bridges",
                "code": "GCC-ROADS",
                "type": "Roads & Bridges",
                "contact_email": "roads@chennaicorporation.gov.in",
            },
            {
                "id": "dept-02",
                "name": "Chennai Metro Water Supply & Sewerage Board",
                "code": "CMWSSB",
                "type": "Water Supply & Sewerage",
                "contact_email": "waterworks@cmwssb.tn.gov.in",
            },
        ]
        self.users = [
            {
                "id": "usr-01",
                "email": "officer.roads@cityworks.gov",
                "full_name": "K. Rajesh (Executive Engineer)",
                "department_id": "dept-01",
                "department_name": "Greater Chennai Corporation - Roads & Bridges",
                "role": "officer",
            }
        ]

    def get_departments(self) -> List[Dict[str, Any]]:
        with _LOCK:
            return list(self.departments)

    def get_department_by_id(self, dept_id: str) -> Optional[Dict[str, Any]]:
        with _LOCK:
            for d in self.departments:
                if d["id"] == dept_id:
                    return dict(d)
            return None

    def get_users(self) -> List[Dict[str, Any]]:
        with _LOCK:
            return list(self.users)

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        with _LOCK:
            for u in self.users:
                if u["email"].lower() == email.lower():
                    return dict(u)
            return None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        with _LOCK:
            for u in self.users:
                if u["id"] == user_id:
                    return dict(u)
            return None

    def get_projects(
        self,
        project_type: Optional[str] = None,
        department_id: Optional[str] = None,
        status: Optional[str] = None,
        bbox: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        with _LOCK:
            results = list(self.projects)

        if project_type and project_type != "all":
            results = [p for p in results if p.get("type") == project_type]
        if department_id and department_id != "all":
            results = [p for p in results if p.get("department_id") == department_id]
        if status and status != "all":
            results = [p for p in results if p.get("status") == status]

        # Bounding box filter: minLng,minLat,maxLng,maxLat
        if bbox:
            try:
                parts = [float(x.strip()) for x in bbox.split(",")]
                if len(parts) == 4:
                    min_lng, min_lat, max_lng, max_lat = parts
                    filtered = []
                    for p in results:
                        coords = p.get("coordinates", [])
                        # Project matches if any vertex is inside bbox
                        inside = any(
                            min_lng <= pt[0] <= max_lng and min_lat <= pt[1] <= max_lat
                            for pt in coords
                        )
                        if inside:
                            filtered.append(p)
                    results = filtered
            except Exception:
                pass

        return results

    def get_project_by_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        with _LOCK:
            for p in self.projects:
                if p["id"] == project_id:
                    res = dict(p)
                    res["updates"] = list(self.project_updates.get(project_id, []))
                    res["delays"] = list(self.delays.get(project_id, []))
                    res["reports"] = list(self.reports.get(project_id, []))
                    return res
            return None

    def create_project(self, data: Dict[str, Any]) -> Dict[str, Any]:
        with _LOCK:
            dept = next((d for d in self.departments if d["id"] == data["department_id"]), None)
            dept_name = dept["name"] if dept else "Municipal Department"

            new_project = {
                "id": data.get("id") or f"proj-{uuid.uuid4().hex[:8]}",
                "title": data["title"],
                "purpose": data["purpose"],
                "type": data["type"],
                "department_id": data["department_id"],
                "department_name": dept_name,
                "contractor": data["contractor"],
                "budget": float(data["budget"]),
                "start_date": data["start_date"],
                "end_date": data["end_date"],
                "original_end_date": data.get("original_end_date", data["end_date"]),
                "status": data.get("status", "planned"),
                "health_score": int(data.get("health_score", 100)),
                "location_name": data["location_name"],
                "ward": data.get("ward"),
                "latest_delay_reason": None,
                "coordinates": data["coordinates"],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }

            self.projects.insert(0, new_project)
            self.project_updates[new_project["id"]] = [
                {
                    "id": f"upd-{uuid.uuid4().hex[:8]}",
                    "project_id": new_project["id"],
                    "author_id": None,
                    "note": f"Project registered with budget ₹{new_project['budget']:,.2f}.",
                    "created_at": datetime.now().isoformat(),
                }
            ]
            self.delays[new_project["id"]] = []
            self.reports[new_project["id"]] = []
            self.subscriptions[new_project["id"]] = []
            self._save_to_disk()
            return dict(new_project)

    def update_project(self, project_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with _LOCK:
            for p in self.projects:
                if p["id"] == project_id:
                    for k, v in updates.items():
                        if v is not None:
                            p[k] = v
                    p["updated_at"] = datetime.now().isoformat()
                    self._save_to_disk()
                    return dict(p)
            return None

    def add_project_update(self, project_id: str, note: str, author_id: Optional[str] = None) -> Dict[str, Any]:
        with _LOCK:
            for p in self.projects:
                if p["id"] == project_id:
                    update_entry = {
                        "id": f"upd-{uuid.uuid4().hex[:8]}",
                        "project_id": project_id,
                        "author_id": author_id,
                        "note": note,
                        "created_at": datetime.now().isoformat(),
                    }
                    if project_id not in self.project_updates:
                        self.project_updates[project_id] = []
                    self.project_updates[project_id].insert(0, update_entry)
                    p["updated_at"] = datetime.now().isoformat()
                    self._save_to_disk()
                    return update_entry
        raise ValueError(f"Project {project_id} not found")

    def log_delay(
        self,
        project_id: str,
        reason: str,
        new_end_date: str,
        logged_by: Optional[str] = None,
    ) -> Dict[str, Any]:
        with _LOCK:
            for p in self.projects:
                if p["id"] == project_id:
                    old_end = p["end_date"]
                    delay_entry = {
                        "id": f"del-{uuid.uuid4().hex[:8]}",
                        "project_id": project_id,
                        "reason": reason,
                        "old_end_date": old_end,
                        "new_end_date": new_end_date,
                        "logged_by": logged_by,
                        "created_at": datetime.now().isoformat(),
                    }
                    if project_id not in self.delays:
                        self.delays[project_id] = []
                    self.delays[project_id].insert(0, delay_entry)

                    p["end_date"] = new_end_date
                    p["latest_delay_reason"] = reason
                    p["delays"] = self.delays[project_id]
                    p["reports"] = self.reports.get(project_id, [])

                    # Recalculate health score
                    new_score, breakdown = calculate_health_score(p)
                    p["health_score"] = new_score
                    p["status"] = breakdown["derived_status"]
                    p["updated_at"] = datetime.now().isoformat()
                    self._save_to_disk()
                    return dict(p)
        raise ValueError(f"Project {project_id} not found")

    def add_citizen_report(
        self,
        project_id: str,
        kind: str,
        lat: float,
        lng: float,
        photo_url: Optional[str] = None,
        notes: Optional[str] = None,
        reporter_contact: Optional[str] = None,
    ) -> Dict[str, Any]:
        with _LOCK:
            target_project = next((p for p in self.projects if p["id"] == project_id), None)
            if not target_project:
                raise ValueError(f"Project {project_id} not found")

            # Calculate distance from report GPS to nearest project vertex
            coords = target_project.get("coordinates", [])
            min_dist = float("inf")
            for pt in coords:
                pt_lng, pt_lat = pt[0], pt[1]
                dist = haversine_distance_meters(lat, lng, pt_lat, pt_lng)
                if dist < min_dist:
                    min_dist = dist

            is_verified = min_dist <= 500.0  # GPS verification radius (500 metres)

            report_entry = {
                "id": f"rep-{uuid.uuid4().hex[:8]}",
                "project_id": project_id,
                "kind": kind,
                "photo_url": photo_url,
                "lat": lat,
                "lng": lng,
                "distance_m": round(min_dist, 1),
                "verified": is_verified,
                "notes": notes,
                "reporter_contact": reporter_contact,
                "created_at": datetime.now().isoformat(),
            }

            if project_id not in self.reports:
                self.reports[project_id] = []
            self.reports[project_id].insert(0, report_entry)

            # Recalculate health score and auto-status
            target_project["reports"] = self.reports[project_id]
            target_project["delays"] = self.delays.get(project_id, [])
            new_score, breakdown = calculate_health_score(target_project)
            target_project["health_score"] = new_score
            target_project["status"] = breakdown["derived_status"]
            target_project["updated_at"] = datetime.now().isoformat()
            self._save_to_disk()

            report_entry["new_health_score"] = new_score
            report_entry["status"] = breakdown["derived_status"]

            return report_entry

    def add_subscription(self, project_id: str, email: str) -> Dict[str, Any]:
        with _LOCK:
            target_project = next((p for p in self.projects if p["id"] == project_id), None)
            if not target_project:
                raise ValueError(f"Project {project_id} not found")

            if project_id not in self.subscriptions:
                self.subscriptions[project_id] = []

            # Check duplicate subscription
            for s in self.subscriptions[project_id]:
                if s["email"].lower() == email.lower():
                    return {"message": "Already subscribed to project updates"}

            sub_entry = {
                "id": f"sub-{uuid.uuid4().hex[:8]}",
                "project_id": project_id,
                "email": email,
                "created_at": datetime.now().isoformat(),
            }
            self.subscriptions[project_id].append(sub_entry)
            self._save_to_disk()
            return {"message": "Subscribed successfully"}

    def get_dashboard_summary(self) -> Dict[str, Any]:
        with _LOCK:
            projects = list(self.projects)
            today = date.today()

            counts = {
                "on_track": sum(1 for p in projects if p.get("status") == "on_track"),
                "at_risk": sum(1 for p in projects if p.get("status") == "at_risk"),
                "delayed": sum(1 for p in projects if p.get("status") == "delayed"),
                "planned": sum(1 for p in projects if p.get("status") == "planned"),
                "completed": sum(1 for p in projects if p.get("status") == "completed"),
                "stalled": sum(1 for p in projects if p.get("status") == "stalled"),
            }

            overdue_projects = []
            for p in projects:
                if p.get("status") not in ["completed"]:
                    end_str = p.get("end_date")
                    if end_str:
                        try:
                            end_dt = datetime.strptime(end_str[:10], "%Y-%m-%d").date()
                            if today > end_dt:
                                overdue_projects.append(p)
                        except Exception:
                            pass

            total_open_reports = sum(len(r_list) for r_list in self.reports.values())

            # Count unresolved reports older than 72 hours
            unresponsive_72h = 0
            for r_list in self.reports.values():
                for r in r_list:
                    c_str = r.get("created_at")
                    if c_str:
                        try:
                            c_dt = datetime.fromisoformat(c_str)
                            if (datetime.now() - c_dt).total_seconds() > 72 * 3600:
                                unresponsive_72h += 1
                        except Exception:
                            pass

            return {
                "total_projects": len(projects),
                "status_counts": counts,
                "overdue_projects_count": len(overdue_projects),
                "open_reports_count": total_open_reports,
                "unresponsive_reports_72h": unresponsive_72h,
                "duplicate_dig_savings_est_inr": 48500000.0,
                "recent_conflicts_prevented": 7,
                "overdue_projects": overdue_projects,
            }


db = DatabaseStore()

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

_engine = None


def get_engine():
    """Returns singleton SQLAlchemy engine for PostgreSQL / Supabase."""
    global _engine
    if _engine is None:
        _engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    return _engine


def get_db_session():
    """Dependency / generator yielding a database session for transactions."""
    engine = get_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def init_postgres_schema(engine=None):
    """Executes docs/schema.sql against a target PostgreSQL / PostGIS database."""
    eng = engine or get_engine()
    schema_path = Path(__file__).resolve().parent.parent.parent.parent / "docs" / "schema.sql"
    if not schema_path.exists():
        schema_path = Path("docs/schema.sql")

    if schema_path.exists():
        with open(schema_path, "r", encoding="utf-8") as f:
            sql_statements = f.read()
        with eng.connect() as conn:
            conn.execute(text(sql_statements))
            conn.commit()
