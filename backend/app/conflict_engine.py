from shapely.geometry import LineString, Point
from geopy.distance import geodesic
from typing import List, Dict, Any
from datetime import datetime

def check_spatial_temporal_conflicts(
    new_corridor: List[List[float]],
    new_start: str,
    new_end: str,
    new_dept_id: str,
    existing_projects: List[Dict[str, Any]],
    distance_threshold_m: float = 30.0
) -> List[Dict[str, Any]]:
    """
    Core Dig-Once conflict detection engine:
    Computes spatial proximity between road LineStrings and checks temporal overlap.
    """
    conflicts = []
    
    if len(new_corridor) < 2:
        return conflicts

    try:
        new_start_dt = datetime.strptime(new_start, "%Y-%m-%d")
        new_end_dt = datetime.strptime(new_end, "%Y-%m-%d")
    except Exception:
        return conflicts

    # Convert coordinates [lat, lng] to Point comparisons
    for ep in existing_projects:
        # Don't conflict with self
        if ep.get("departmentId") == new_dept_id:
            continue
            
        ep_corridor = ep.get("corridorPath", [])
        if len(ep_corridor) < 2:
            continue

        try:
            ep_start_dt = datetime.strptime(ep["startDate"], "%Y-%m-%d")
            ep_end_dt = datetime.strptime(ep["plannedEndDate"], "%Y-%m-%d")
        except Exception:
            continue

        # Check temporal overlap or recent trench within 90 days
        temporal_clash = (new_start_dt <= ep_end_dt) and (new_end_dt >= ep_start_dt)
        recent_dig_clash = abs((new_start_dt - ep_end_dt).days) <= 90

        if not (temporal_clash or recent_dig_clash):
            continue

        # Check geospatial distance between corridor points
        min_dist_m = float("inf")
        for p1 in new_corridor:
            for p2 in ep_corridor:
                d = geodesic((p1[0], p1[1]), (p2[0], p2[1])).meters
                if d < min_dist_m:
                    min_dist_m = d

        if min_dist_m <= distance_threshold_m:
            conflict_type = "spatial_temporal" if temporal_clash else "recent_paving_destruction"
            suggested = (
                f"Schedule Joint Trenching: Both {ep.get('departmentName')} and this project coincide within {int(min_dist_m)}m on this road."
                if temporal_clash
                else f"Road was paved recently by {ep.get('departmentName')}. Trenching will destroy new asphalt."
            )
            avoidable_savings = round(min(ep.get("budgetInr", 1000000), 3400000), 2)

            conflicts.append({
                "conflictingProjectId": ep["id"],
                "conflictingProjectTitle": ep["title"],
                "departmentName": ep.get("departmentName", "Utility Board"),
                "overlapDistanceMeters": round(min_dist_m, 1),
                "conflictType": conflict_type,
                "suggestedAction": suggested,
                "estimatedAvoidableCostInr": avoidable_savings
            })

    return conflicts

def calculate_health_score(project: Dict[str, Any]) -> int:
    """
    Project health score (0 to 100) based on schedule slippage,
    citizen 'no activity' reports, and days since last official update.
    """
    score = 100
    
    # Days since official update
    days_stale = project.get("lastOfficialUpdateDaysAgo", 0)
    if days_stale > 14:
        score -= min(30, (days_stale - 14) * 2)

    # Delays logged
    delays_count = len(project.get("delays", []))
    score -= delays_count * 15

    # Citizen check-ins
    for rep in project.get("citizenReports", []):
        if rep.get("verified", False):
            if rep.get("kind") == "no_activity":
                score -= 18
            elif rep.get("kind") == "safety_hazard":
                score -= 15
            elif rep.get("kind") == "poor_quality":
                score -= 10
            elif rep.get("kind") == "progress_verified":
                score = min(100, score + 5)

    return max(5, min(100, score))
