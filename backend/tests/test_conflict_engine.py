import pytest
from app.services.conflict_engine import check_spatial_temporal_conflicts, calculate_linestring_distance_meters


def test_linestring_distance_continuous():
    # Two intersecting LineStrings
    c1 = [[80.2285, 13.0285], [80.2241, 13.0232], [80.2215, 13.0189]]
    c2 = [[80.2282, 13.0281], [80.2238, 13.0229], [80.2211, 13.0185]]
    dist = calculate_linestring_distance_meters(c1, c2)
    assert dist == 0.0  # Lines cross


def test_no_conflicts_when_spatially_distant():
    # Chennai Anna Salai corridor
    c1 = [[80.2285, 13.0285], [80.2241, 13.0232]]
    # Distant Tambaram corridor (~15 km away)
    c2 = [[80.1150, 12.9230], [80.1180, 12.9260]]

    existing = [{
        "id": "p-distant",
        "title": "Tambaram Flyover",
        "department_id": "dept-02",
        "department_name": "Highways",
        "start_date": "2026-09-01",
        "end_date": "2026-11-15",
        "coordinates": c2,
        "budget": 50000000,
    }]

    result = check_spatial_temporal_conflicts(
        new_corridor=c1,
        new_start="2026-09-15",
        new_end="2026-10-15",
        existing_projects=existing,
        buffer_meters=50.0,
    )
    assert result.has_conflict is False
    assert result.clash_count == 0
    assert result.conflicting_projects == []
    assert result.suggested_joint_window is None


def test_conflict_schedule_overlap():
    c1 = [[80.2285, 13.0285], [80.2241, 13.0232]]
    c2 = [[80.2282, 13.0281], [80.2238, 13.0229]]

    existing = [{
        "id": "p-sewer",
        "title": "Anna Salai Sewer Main",
        "department_id": "dept-water",
        "department_name": "CMWSSB",
        "start_date": "2026-10-01",
        "end_date": "2026-12-01",
        "coordinates": c2,
        "budget": 10000000,
    }]

    result = check_spatial_temporal_conflicts(
        new_corridor=c1,
        new_start="2026-10-15",
        new_end="2026-11-15",
        new_dept_id="dept-roads",
        existing_projects=existing,
        buffer_meters=50.0,
    )

    assert result.has_conflict is True
    assert result.clash_count == 1
    clash = result.conflicting_projects[0]
    assert clash.conflict_type == "schedule_overlap"
    assert clash.department == "CMWSSB"
    assert clash.estimated_avoidable_cost_inr == 3500000.0  # 35% of 10M
    assert result.suggested_joint_window is not None
    assert result.suggested_joint_window.start_date == "2026-10-01"
    assert result.suggested_joint_window.end_date == "2026-12-01"


def test_conflict_recent_excavation_lookback():
    c1 = [[80.2285, 13.0285], [80.2241, 13.0232]]
    c2 = [[80.2282, 13.0281], [80.2238, 13.0229]]

    # Project completed 30 days before new project starts
    existing = [{
        "id": "p-past",
        "title": "Anna Salai Resurfacing",
        "department_id": "dept-roads",
        "department_name": "GCC Roads",
        "start_date": "2026-06-01",
        "end_date": "2026-08-31",
        "coordinates": c2,
        "budget": 20000000,
        "status": "completed",
    }]

    result = check_spatial_temporal_conflicts(
        new_corridor=c1,
        new_start="2026-09-30",
        new_end="2026-11-30",
        new_dept_id="dept-power",
        existing_projects=existing,
        lookback_days=90,
    )

    assert result.has_conflict is True
    assert result.clash_count == 1
    assert result.conflicting_projects[0].conflict_type == "recently_dug"
    assert "Excavation moratorium applies" in result.conflicting_projects[0].description


def test_same_department_exclusion():
    c1 = [[80.2285, 13.0285], [80.2241, 13.0232]]
    existing = [{
        "id": "p-same",
        "title": "GCC Phase 1",
        "department_id": "dept-gcc",
        "department_name": "GCC",
        "start_date": "2026-10-01",
        "end_date": "2026-11-01",
        "coordinates": c1,
    }]

    # Same department proposal should be excluded from conflict flag
    result = check_spatial_temporal_conflicts(
        new_corridor=c1,
        new_start="2026-10-05",
        new_end="2026-10-25",
        new_dept_id="dept-gcc",
        existing_projects=existing,
    )
    assert result.has_conflict is False


def test_invalid_geometry_handled_gracefully():
    # Only 1 point (not a valid LineString)
    result = check_spatial_temporal_conflicts(
        new_corridor=[[80.2285, 13.0285]],
        new_start="2026-10-01",
        new_end="2026-11-01",
        existing_projects=[],
    )
    assert result.has_conflict is False
    assert result.clash_count == 0
