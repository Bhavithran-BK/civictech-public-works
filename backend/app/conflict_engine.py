from shapely.geometry import LineString, Point
from geopy.distance import geodesic
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta

def check_spatial_temporal_conflicts(
    new_corridor: List[List[float]],
    new_start: str,
    new_end: str,
    new_dept_id: str,
    existing_projects: List[Dict[str, Any]],
    distance_threshold_m: float = 35.0
) -> List[Dict[str, Any]]:
    """
    Novelty 1: Dig-Once Spatio-Temporal Conflict Detection & Joint Trench Window Generator
    - Checks corridor proximity within 35m
    - Detects temporal clashes and recent paving destruction within 90 days
    - Calculates mathematically optimal Joint Window [Start, End]
    - Computes tangible Taxpayer Cost Savings (Avoidable Paving Destruction)
    """
    conflicts = []
    
    if len(new_corridor) < 2:
        return conflicts

    try:
        new_start_dt = datetime.strptime(new_start, "%Y-%m-%d")
        new_end_dt = datetime.strptime(new_end, "%Y-%m-%d")
    except Exception:
        return conflicts

    for ep in existing_projects:
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

        temporal_clash = (new_start_dt <= ep_end_dt) and (new_end_dt >= ep_start_dt)
        recent_dig_clash = abs((new_start_dt - ep_end_dt).days) <= 90

        if not (temporal_clash or recent_dig_clash):
            continue

        # Compute minimum distance between LineString corridors
        min_dist_m = float("inf")
        for p1 in new_corridor:
            for p2 in ep_corridor:
                d = geodesic((p1[0], p1[1]), (p2[0], p2[1])).meters
                if d < min_dist_m:
                    min_dist_m = d

        if min_dist_m <= distance_threshold_m:
            # Optimal Joint Window: Starts at the earliest date, ends at the latest date + buffer
            joint_start = min(new_start_dt, ep_start_dt).strftime("%Y-%m-%d")
            joint_end = max(new_end_dt, ep_end_dt).strftime("%Y-%m-%d")

            conflict_type = "spatial_temporal" if temporal_clash else "recent_paving_destruction"
            suggested = (
                f"Schedule Joint Trenching ({joint_start} to {joint_end}): {ep.get('departmentName')} & this agency share road corridor within {int(min_dist_m)}m. Coordinate duct laying once."
                if temporal_clash
                else f"Road was paved recently by {ep.get('departmentName')}. Excavation now destroys ₹{(ep.get('budgetInr', 1000000)*0.35/100000):.1f}L of fresh bituminous wearing course."
            )

            # Avoidable municipal repaving cost: ~35% of total road project budget
            avoidable_savings = round((ep.get("budgetInr", 2000000) * 0.35), 2)

            conflicts.append({
                "conflictingProjectId": ep["id"],
                "conflictingProjectTitle": ep["title"],
                "departmentName": ep.get("departmentName", "Utility Board"),
                "overlapDistanceMeters": round(min_dist_m, 1),
                "conflictType": conflict_type,
                "suggestedAction": suggested,
                "estimatedAvoidableCostInr": avoidable_savings,
                "jointWindowStart": joint_start,
                "jointWindowEnd": joint_end
            })

    return conflicts

def calculate_health_score(project: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    """
    Novelty 2: Proof-of-Work Project Health Score Engine
    Returns (score, breakdown_details) with clear auditability.
    
    Formula:
    Base = 100
    - Slippage Penalty: -3 points per day past planned deadline
    - Stale Updates: -2 points per day if no official update in >14 days
    - Verified Inactive Reports: -18 points per verified 'no_activity' report
    - Safety Hazards: -15 points per verified hazard
    + Progress Boost: +5 points for verified active work
    """
    score = 100
    penalties = {}

    # 1. Schedule Slippage
    planned_end = project.get("plannedEndDate")
    slippage_days = 0
    if planned_end:
        try:
            planned_dt = datetime.strptime(planned_end, "%Y-%m-%d")
            today = datetime.now()
            if today > planned_dt and project.get("status") not in ["completed"]:
                slippage_days = (today - planned_dt).days
                slip_penalty = min(40, slippage_days * 3)
                score -= slip_penalty
                penalties["schedule_slippage"] = f"-{slip_penalty} pts ({slippage_days} days overdue)"
        except Exception:
            pass

    # 2. Stale Cadence
    days_stale = project.get("lastOfficialUpdateDaysAgo", 0)
    if days_stale > 14:
        stale_penalty = min(25, (days_stale - 14) * 2)
        score -= stale_penalty
        penalties["stale_official_cadence"] = f"-{stale_penalty} pts ({days_stale} days without engineer update)"

    # 3. Delays explicitly logged
    delays_count = len(project.get("delays", []))
    if delays_count > 0:
        score -= delays_count * 15
        penalties["logged_delays"] = f"-{delays_count * 15} pts ({delays_count} formal delay extensions)"

    # 4. Verified Citizen Sensor Feedback
    citizen_penalty = 0
    no_activity_count = 0
    verified_reports = [r for r in project.get("citizenReports", []) if r.get("verified", False)]
    
    for rep in verified_reports:
        kind = rep.get("kind")
        if kind == "no_activity":
            citizen_penalty += 18
            no_activity_count += 1
        elif kind == "safety_hazard":
            citizen_penalty += 15
        elif kind == "poor_quality":
            citizen_penalty += 10
        elif kind == "progress_verified":
            score = min(100, score + 5)

    if citizen_penalty > 0:
        score -= citizen_penalty
        penalties["citizen_audit_penalties"] = f"-{citizen_penalty} pts from verified field check-ins"

    final_score = max(5, min(100, score))

    breakdown = {
        "finalScore": final_score,
        "penalties": penalties,
        "verifiedReportsCount": len(verified_reports),
        "noActivityCount": no_activity_count,
        "autoFlagStalled": final_score < 35 or no_activity_count >= 3
    }

    return final_score, breakdown
