from datetime import date, datetime, timedelta
import json
import math
from typing import Any, Dict, List, Optional, Tuple
from shapely.geometry import LineString, mapping

from app.schemas.conflicts import ConflictCheckResult, ConflictingProject, JointWindow


def build_postgis_conflict_sql() -> str:
    """
    Returns the production PostGIS SQL query for spatial-temporal conflict detection.
    Leverages PostGIS spatial indexes (GIST on geom) and geodetic calculations in metres.
    """
    return """
        SELECT
            p.id,
            p.title,
            d.name AS department_name,
            p.start_date,
            p.end_date,
            p.budget,
            p.status,
            ST_Distance(
                p.geom::geography,
                ST_SetSRID(ST_GeomFromGeoJSON(:geom_geojson), 4326)::geography
            ) AS distance_meters,
            ST_Intersects(
                p.geom,
                ST_SetSRID(ST_GeomFromGeoJSON(:geom_geojson), 4326)
            ) AS is_intersecting
        FROM projects p
        JOIN departments d ON p.department_id = d.id
        WHERE (:new_dept_id IS NULL OR p.department_id != :new_dept_id)
          AND ST_DWithin(
              p.geom::geography,
              ST_SetSRID(ST_GeomFromGeoJSON(:geom_geojson), 4326)::geography,
              :buffer_meters
          )
          AND (
              (p.start_date <= :new_end_date AND p.end_date >= :new_start_date)
              OR
              (p.end_date < :new_start_date AND (:new_start_date - p.end_date) <= :lookback_days)
          )
        ORDER BY distance_meters ASC;
    """


def corridor_to_geojson_string(coords: List[List[float]]) -> str:
    """Converts [[lng, lat], ...] to a GeoJSON LineString JSON string."""
    geojson_dict = {
        "type": "LineString",
        "coordinates": coords,
    }
    return json.dumps(geojson_dict)


def _to_metric_linestring(
    coords: List[List[float]],
    ref_lat: float,
) -> Optional[LineString]:
    """
    Project [lng, lat] coordinates to local metric Euclidean space (in metres)
    using Equirectangular approximation centered on ref_lat.
    This enables continuous segment-to-segment distance calculation via Shapely.
    """
    if len(coords) < 2:
        return None

    # Handle coordinates whether given as [lng, lat] or [lat, lng]
    # In Chennai, lng is ~80.2, lat is ~13.0
    metric_points = []
    lat_rad = math.radians(ref_lat)
    meters_per_deg_lon = 111320.0 * math.cos(lat_rad)
    meters_per_deg_lat = 110540.0

    for pt in coords:
        if len(pt) < 2:
            continue
        c0, c1 = float(pt[0]), float(pt[1])
        # Auto-detect [lng, lat] vs [lat, lng] if values differ significantly
        if c0 > 60.0 and c1 < 40.0:  # standard [lng, lat]
            lon, lat = c0, c1
        elif c1 > 60.0 and c0 < 40.0:  # [lat, lng]
            lat, lon = c0, c1
        else:
            lon, lat = c0, c1

        x = lon * meters_per_deg_lon
        y = lat * meters_per_deg_lat
        metric_points.append((x, y))

    if len(metric_points) < 2:
        return None
    return LineString(metric_points)


def calculate_linestring_distance_meters(
    line1_coords: List[List[float]],
    line2_coords: List[List[float]],
) -> float:
    """
    Calculates the exact shortest Euclidean distance in metres between two
    continuous LineString corridors, accounting for continuous line segments,
    not just discrete vertices.
    """
    if len(line1_coords) < 2 or len(line2_coords) < 2:
        return float("inf")

    # Sample reference latitude
    sample_pt = line1_coords[0]
    ref_lat = sample_pt[1] if (sample_pt[0] > 60.0 and sample_pt[1] < 40.0) else sample_pt[0]

    ls1 = _to_metric_linestring(line1_coords, ref_lat)
    ls2 = _to_metric_linestring(line2_coords, ref_lat)

    if not ls1 or not ls2:
        return float("inf")

    # If the lines cross/intersect, distance is exactly 0.0
    if ls1.intersects(ls2):
        return 0.0

    return float(ls1.distance(ls2))


def check_spatial_temporal_conflicts(
    new_corridor: List[List[float]],
    new_start: str,
    new_end: str,
    new_dept_id: Optional[str] = None,
    existing_projects: Optional[List[Dict[str, Any]]] = None,
    buffer_meters: float = 50.0,
    lookback_days: int = 90,
    avoidable_cost_pct: float = 0.35,
) -> ConflictCheckResult:
    """
    Core DigOnce Spatial-Temporal Conflict Engine.
    Detects concurrent corridor trenching and recent road excavation moratorium violations.
    """
    if existing_projects is None:
        existing_projects = []

    if len(new_corridor) < 2:
        return ConflictCheckResult(
            has_conflict=False,
            clash_count=0,
            conflicting_projects=[],
            suggested_joint_window=None,
        )

    try:
        new_start_dt = datetime.strptime(new_start[:10], "%Y-%m-%d").date()
        new_end_dt = datetime.strptime(new_end[:10], "%Y-%m-%d").date()
    except Exception:
        return ConflictCheckResult(
            has_conflict=False,
            clash_count=0,
            conflicting_projects=[],
            suggested_joint_window=None,
        )

    clashing_projects: List[ConflictingProject] = []
    earliest_joint_date = new_start_dt
    latest_joint_date = new_end_dt
    primary_conflict_dept = ""

    for ep in existing_projects:
        ep_dept = ep.get("department_id") or ep.get("departmentId")
        # Exclude same department if specified
        if new_dept_id and ep_dept and ep_dept == new_dept_id:
            continue

        ep_corridor = ep.get("coordinates") or ep.get("corridorPath") or []
        if len(ep_corridor) < 2:
            continue

        ep_start_str = ep.get("start_date") or ep.get("startDate")
        ep_end_str = ep.get("end_date") or ep.get("plannedEndDate")
        if not ep_start_str or not ep_end_str:
            continue

        try:
            ep_start_dt = datetime.strptime(str(ep_start_str)[:10], "%Y-%m-%d").date()
            ep_end_dt = datetime.strptime(str(ep_end_str)[:10], "%Y-%m-%d").date()
        except Exception:
            continue

        # Check temporal relationship
        is_schedule_overlap = (new_start_dt <= ep_end_dt) and (new_end_dt >= ep_start_dt)
        is_recently_dug = (
            (new_start_dt > ep_end_dt) and ((new_start_dt - ep_end_dt).days <= lookback_days)
        )

        if not (is_schedule_overlap or is_recently_dug):
            continue

        # Compute continuous distance in metres
        min_dist_m = calculate_linestring_distance_meters(new_corridor, ep_corridor)

        if min_dist_m <= buffer_meters:
            dept_name = ep.get("department_name") or ep.get("departmentName") or "Public Works Agency"
            budget = float(ep.get("budget") or ep.get("budgetInr") or 2500000.0)
            avoidable_savings = round(budget * avoidable_cost_pct, 2)

            conflict_type = "schedule_overlap" if is_schedule_overlap else "recently_dug"
            if is_schedule_overlap:
                desc = (
                    f"Direct schedule clash with {dept_name} ({ep_start_str} to {ep_end_str}) "
                    f"within {int(min_dist_m)}m on this road corridor."
                )
            else:
                days_ago = (new_start_dt - ep_end_dt).days
                desc = (
                    f"Road was excavated and paved by {dept_name} {days_ago} days ago. "
                    f"Excavation moratorium applies; repeat digging destroys ₹{(avoidable_savings/100000):.1f}L of fresh paving."
                )

            clashing_projects.append(
                ConflictingProject(
                    project_id=str(ep.get("id", "")),
                    title=str(ep.get("title", "Infrastructure Project")),
                    department=dept_name,
                    start_date=str(ep_start_str),
                    end_date=str(ep_end_str),
                    distance_meters=round(min_dist_m, 1),
                    conflict_type=conflict_type,
                    description=desc,
                    estimated_avoidable_cost_inr=avoidable_savings,
                )
            )

            # Update joint coordination window
            earliest_joint_date = min(earliest_joint_date, ep_start_dt)
            latest_joint_date = max(latest_joint_date, ep_end_dt)
            if not primary_conflict_dept:
                primary_conflict_dept = dept_name

    has_clash = len(clashing_projects) > 0
    joint_window = None

    if has_clash:
        joint_window = JointWindow(
            start_date=earliest_joint_date.strftime("%Y-%m-%d"),
            end_date=latest_joint_date.strftime("%Y-%m-%d"),
            recommendation=(
                f"Schedule joint utility trenching between {earliest_joint_date} and {latest_joint_date}. "
                f"Coordinate duct-laying once with {primary_conflict_dept} before asphalt wearing course is sealed."
            ),
        )

    return ConflictCheckResult(
        has_conflict=has_clash,
        clash_count=len(clashing_projects),
        conflicting_projects=clashing_projects,
        suggested_joint_window=joint_window,
    )


def compute_systemwide_conflicts_and_savings(
    projects: List[Dict[str, Any]],
    buffer_meters: float = 50.0,
    lookback_days: int = 90,
    avoidable_cost_pct: float = 0.35,
) -> Tuple[int, float]:
    """
    Dynamically computes actual system-wide clashes across all municipal projects in the database
    and calculates the real cumulative duplicate-digging cost savings (in INR).
    """
    clash_count = 0
    total_savings = 0.0
    seen_pairs = set()

    for i in range(len(projects)):
        p1 = projects[i]
        c1 = p1.get("coordinates") or p1.get("corridorPath") or []
        if len(c1) < 2:
            continue
        d1 = p1.get("department_id") or p1.get("departmentId")
        s1_str = p1.get("start_date") or p1.get("startDate")
        e1_str = p1.get("end_date") or p1.get("plannedEndDate")
        if not s1_str or not e1_str:
            continue
        try:
            s1_dt = datetime.strptime(str(s1_str)[:10], "%Y-%m-%d").date()
            e1_dt = datetime.strptime(str(e1_str)[:10], "%Y-%m-%d").date()
        except Exception:
            continue

        for j in range(i + 1, len(projects)):
            p2 = projects[j]
            d2 = p2.get("department_id") or p2.get("departmentId")
            if d1 and d2 and d1 == d2:
                continue  # Intra-department works do not constitute multi-agency duplicate excavation clashes

            c2 = p2.get("coordinates") or p2.get("corridorPath") or []
            if len(c2) < 2:
                continue
            s2_str = p2.get("start_date") or p2.get("startDate")
            e2_str = p2.get("end_date") or p2.get("plannedEndDate")
            if not s2_str or not e2_str:
                continue
            try:
                s2_dt = datetime.strptime(str(s2_str)[:10], "%Y-%m-%d").date()
                e2_dt = datetime.strptime(str(e2_str)[:10], "%Y-%m-%d").date()
            except Exception:
                continue

            # Temporal condition: active schedule overlap OR moratorium violation within lookback window
            is_overlap = (s1_dt <= e2_dt) and (e1_dt >= s2_dt)
            is_moratorium = (
                ((s2_dt > e1_dt) and ((s2_dt - e1_dt).days <= lookback_days)) or
                ((s1_dt > e2_dt) and ((s1_dt - e2_dt).days <= lookback_days))
            )

            if not (is_overlap or is_moratorium):
                continue

            # Spatio-geodetic distance check
            dist = calculate_linestring_distance_meters(c1, c2)
            if dist <= buffer_meters:
                pair_key = tuple(sorted([str(p1.get("id", i)), str(p2.get("id", j))]))
                if pair_key not in seen_pairs:
                    seen_pairs.add(pair_key)
                    clash_count += 1
                    b1 = float(p1.get("budget") or p1.get("budgetInr") or 0.0)
                    b2 = float(p2.get("budget") or p2.get("budgetInr") or 0.0)
                    clash_budget = min(b1, b2) if (b1 > 0 and b2 > 0) else max(b1, b2)
                    total_savings += round(clash_budget * avoidable_cost_pct, 2)

    return clash_count, round(total_savings, 2)

