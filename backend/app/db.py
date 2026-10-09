import json
import os
from typing import List, Dict, Any, Optional
from geopy.distance import geodesic
from app.conflict_engine import calculate_health_score, check_spatial_temporal_conflicts

DB_FILE = os.path.join(os.path.dirname(__file__), "projects_db.json")

# Initial realistic seeded database matching our frontend dataset
SEED_DATA: List[Dict[str, Any]] = [
  {
    "id": "prj-101",
    "referenceCode": "GCC-WD172-RD-04",
    "title": "Anna Salai Smart Arterial Paving & Storm Drain Rebuild",
    "purpose": "Re-laying bituminous asphalt wearing course and widening stormwater culverts ahead of the northeast monsoon.",
    "type": "road",
    "departmentId": "dept-roads",
    "departmentName": "Greater Chennai Corporation (GCC)",
    "contractor": "L&T Infrastructure Engineering Ltd",
    "budgetInr": 18500000,
    "startDate": "2026-08-15",
    "plannedEndDate": "2026-10-30",
    "status": "delayed",
    "healthScore": 54,
    "wardNumber": 172,
    "wardName": "Teynampet Central",
    "roadName": "Anna Salai Arterial Corridor",
    "coordinates": { "lat": 13.0428, "lng": 80.2526 },
    "corridorPath": [
      [13.0480, 80.2560],
      [13.0450, 80.2540],
      [13.0428, 80.2526],
      [13.0390, 80.2500]
    ],
    "lastOfficialUpdateDaysAgo": 9,
    "unresolvedReportsCount": 4,
    "delays": [
      {
        "id": "del-1",
        "projectId": "prj-101",
        "reason": "Underground fiber optical cables from non-empaneled telcos damaged during excavator milling.",
        "previousEndDate": "2026-09-30",
        "newEndDate": "2026-10-30",
        "loggedAt": "2026-09-28",
        "officerName": "S. Ramanathan (Executive Engineer, GCC)"
      }
    ],
    "citizenReports": [
      {
        "id": "rep-1",
        "projectId": "prj-101",
        "kind": "no_activity",
        "description": "Road has been dug up for 8 days with zero machinery or crew present. Causing severe morning bottle-neck.",
        "reportedLat": 13.0430,
        "reportedLng": 80.2528,
        "distanceMeters": 28,
        "verified": True,
        "createdAt": "2026-10-08",
        "reporterHandle": "Citizen #4092"
      }
    ],
    "conflicts": []
  },
  {
    "id": "prj-102",
    "referenceCode": "CMWSSB-PL-2026-89",
    "title": "Adyar Riverbank Feeder Sewage Pipeline Replacement",
    "purpose": "Replacing deteriorated ductile iron sewer line to curb domestic backflows during cloudburst surges.",
    "type": "water_pipeline",
    "departmentId": "dept-water",
    "departmentName": "CMWSSB (Metro Water)",
    "contractor": "Southern Waterworks Consortia",
    "budgetInr": 9200000,
    "startDate": "2026-09-01",
    "plannedEndDate": "2026-11-20",
    "status": "on_track",
    "healthScore": 88,
    "wardNumber": 173,
    "wardName": "Adyar North",
    "roadName": "Gandhi Mandapam Road",
    "coordinates": { "lat": 13.0125, "lng": 80.2435 },
    "corridorPath": [
      [13.0150, 80.2410],
      [13.0135, 80.2425],
      [13.0125, 80.2435],
      [13.0100, 80.2450]
    ],
    "lastOfficialUpdateDaysAgo": 2,
    "unresolvedReportsCount": 0,
    "delays": [],
    "citizenReports": [],
    "conflicts": []
  },
  {
    "id": "prj-103",
    "referenceCode": "TANGEDCO-CAB-441",
    "title": "Underground 33kV HT Cable Conversion Project",
    "purpose": "Eliminating hazardous overhead wires by laying shielded 33kV high tension cables beneath public footway.",
    "type": "electricity",
    "departmentId": "dept-power",
    "departmentName": "TANGEDCO (Electricity Board)",
    "contractor": "PowerGrid Solutions Pvt Ltd",
    "budgetInr": 12400000,
    "startDate": "2026-07-10",
    "plannedEndDate": "2026-09-15",
    "status": "stalled",
    "healthScore": 28,
    "wardNumber": 155,
    "wardName": "Mylapore Heritage",
    "roadName": "Luz Church Road",
    "coordinates": { "lat": 13.0368, "lng": 80.2612 },
    "corridorPath": [
      [13.0390, 80.2590],
      [13.0380, 80.2600],
      [13.0368, 80.2612],
      [13.0345, 80.2630]
    ],
    "lastOfficialUpdateDaysAgo": 21,
    "unresolvedReportsCount": 7,
    "delays": [
      {
        "id": "del-2",
        "projectId": "prj-103",
        "reason": "Contractor dispute over trench restoration unit rates.",
        "previousEndDate": "2026-08-30",
        "newEndDate": "2026-09-15",
        "loggedAt": "2026-08-25",
        "officerName": "M. Anbazhagan (Divisional Engineer)"
      }
    ],
    "citizenReports": [
      {
        "id": "rep-4",
        "projectId": "prj-103",
        "kind": "no_activity",
        "description": "Trench left abandoned for past 3 weeks. Mud has washed into shops during last night rain.",
        "reportedLat": 13.0370,
        "reportedLng": 80.2615,
        "distanceMeters": 30,
        "verified": True,
        "createdAt": "2026-10-06",
        "reporterHandle": "Mylapore Merchant Union"
      }
    ],
    "conflicts": []
  }
]

def load_projects() -> List[Dict[str, Any]]:
    if not os.path.exists(DB_FILE):
        save_projects(SEED_DATA)
        return SEED_DATA
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return SEED_DATA

def save_projects(projects: List[Dict[str, Any]]):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(projects, f, indent=2)

def get_all_projects(work_type: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
    projects = load_projects()
    # Compute active clashes dynamically
    for p in projects:
        p["conflicts"] = check_spatial_temporal_conflicts(
            new_corridor=p.get("corridorPath", []),
            new_start=p.get("startDate", ""),
            new_end=p.get("plannedEndDate", ""),
            new_dept_id=p.get("departmentId", ""),
            existing_projects=projects
        )
    
    if work_type and work_type != "all":
        projects = [p for p in projects if p.get("type") == work_type]
    if status and status != "all":
        projects = [p for p in projects if p.get("status") == status]
    return projects

def get_project_by_id(project_id: str) -> Optional[Dict[str, Any]]:
    projects = get_all_projects()
    for p in projects:
        if p["id"] == project_id:
            return p
    return None

def add_citizen_report_db(project_id: str, report_data: Dict[str, Any]) -> Dict[str, Any]:
    projects = load_projects()
    for p in projects:
        if p["id"] == project_id:
            proj_coord = p["coordinates"]
            # GPS verification calculation
            dist = geodesic(
                (report_data["reportedLat"], report_data["reportedLng"]),
                (proj_coord["lat"], proj_coord["lng"])
            ).meters
            
            is_verified = dist <= 500.0
            
            import time
            new_rep = {
                "id": f"rep-{int(time.time() * 1000)}",
                "projectId": project_id,
                "kind": report_data["kind"],
                "description": report_data["description"],
                "reportedLat": report_data["reportedLat"],
                "reportedLng": report_data["reportedLng"],
                "distanceMeters": int(dist),
                "verified": is_verified,
                "createdAt": "2026-10-10",
                "reporterHandle": report_data.get("reporterHandle", "Anonymous Resident")
            }
            
            if "citizenReports" not in p:
                p["citizenReports"] = []
            p["citizenReports"].insert(0, new_rep)
            
            # Recalculate Health Score with breakdown
            new_score, breakdown = calculate_health_score(p)
            p["healthScore"] = new_score
            
            # Auto-flip status rule based on algorithmic audit breakdown
            if breakdown["autoFlagStalled"]:
                p["status"] = "stalled"
            elif new_score < 65:
                p["status"] = "delayed"
            elif new_score < 75:
                p["status"] = "at_risk"
            else:
                p["status"] = "on_track"
                
            save_projects(projects)
            return {"report": new_rep, "project": p, "breakdown": breakdown}
            
    raise ValueError("Project not found")

def log_delay_db(project_id: str, delay_data: Dict[str, Any]) -> Dict[str, Any]:
    if not delay_data.get("reason", "").strip():
        raise ValueError("Mandatory delay reason is required per municipal accountability policy")
        
    projects = load_projects()
    for p in projects:
        if p["id"] == project_id:
            import time
            delay_entry = {
                "id": f"del-{int(time.time() * 1000)}",
                "projectId": project_id,
                "reason": delay_data["reason"],
                "previousEndDate": p["plannedEndDate"],
                "newEndDate": delay_data["newEndDate"],
                "loggedAt": "2026-10-10",
                "officerName": delay_data.get("officerName", "Ward Executive Engineer")
            }
            if "delays" not in p:
                p["delays"] = []
            p["delays"].insert(0, delay_entry)
            p["plannedEndDate"] = delay_data["newEndDate"]
            p["status"] = "delayed"
            new_score, _ = calculate_health_score(p)
            p["healthScore"] = new_score
            save_projects(projects)
            return p
    raise ValueError("Project not found")
