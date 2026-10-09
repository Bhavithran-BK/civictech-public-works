from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from app.schemas import (
    ProjectOut,
    ProjectCreate,
    CitizenReportCreate,
    CitizenReportOut,
    DelayCreate,
    DelayOut,
    ProjectConflictOut
)
from app.db import (
    get_all_projects,
    get_project_by_id,
    add_citizen_report_db,
    log_delay_db
)
from app.conflict_engine import check_spatial_temporal_conflicts

app = FastAPI(
    title="DigOnce Municipal Public Works API",
    description="Backend engine for spatial conflict detection, civic accountability, and citizen verification",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "service": "digonce-core-engine"}

@app.get("/api/v1/projects", response_model=List[ProjectOut])
def list_projects(
    type: Optional[str] = Query(None, description="Filter by utility type"),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """Public endpoint to query all active and planned road trench projects."""
    return get_all_projects(work_type=type, status=status)

@app.get("/api/v1/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: str):
    """Retrieve full audit record for a single project."""
    p = get_project_by_id(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p

@app.post("/api/v1/projects/{project_id}/reports")
def submit_citizen_report(project_id: str, payload: CitizenReportCreate):
    """Citizen field report submission with GPS Harversine geofence check."""
    try:
        result = add_citizen_report_db(project_id, payload.model_dump())
        return {
            "success": True,
            "report": result["report"],
            "newHealthScore": result["project"]["healthScore"],
            "status": result["project"]["status"]
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/v1/projects/{project_id}/delays")
def log_project_delay(project_id: str, payload: DelayCreate):
    """Officer logs a mandatory justification delay notice."""
    try:
        updated = log_delay_db(project_id, payload.model_dump())
        return {"success": True, "project": updated}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/projects/conflict-check", response_model=List[ProjectConflictOut])
def check_conflicts(
    corridorPath: List[List[float]],
    startDate: str,
    plannedEndDate: str,
    departmentId: str
):
    """
    Core Dig-Once Conflict Engine Endpoint:
    Checks if a planned road trench will overlap spatially or temporally with any other utility.
    """
    existing = get_all_projects()
    clashes = check_spatial_temporal_conflicts(
        new_corridor=corridorPath,
        new_start=startDate,
        new_end=plannedEndDate,
        new_dept_id=departmentId,
        existing_projects=existing
    )
    return clashes
