from app.conflict_engine import check_spatial_temporal_conflicts, calculate_health_score

def test_conflict_engine_detects_clash():
    # Existing project corridor along Anna Salai
    existing = [{
        "id": "prj-1",
        "title": "Road Paving",
        "departmentId": "dept-roads",
        "departmentName": "GCC",
        "startDate": "2026-08-01",
        "plannedEndDate": "2026-10-31",
        "budgetInr": 2000000,
        "corridorPath": [[13.048, 80.256], [13.042, 80.252]]
    }]
    
    # New utility proposal overlapping both spatially (<30m) and temporally
    clashes = check_spatial_temporal_conflicts(
        new_corridor=[[13.048, 80.256], [13.042, 80.252]],
        new_start="2026-09-01",
        new_end="2026-11-15",
        new_dept_id="dept-water",
        existing_projects=existing,
        distance_threshold_m=30.0
    )
    
    assert len(clashes) == 1
    assert clashes[0]["conflictType"] == "spatial_temporal"
    assert "Joint Trenching" in clashes[0]["suggestedAction"]

def test_health_score_penalty_and_stalled_threshold():
    sample_proj = {
        "lastOfficialUpdateDaysAgo": 20,
        "delays": [{"id": "d1"}],
        "citizenReports": [
            {"kind": "no_activity", "verified": True},
            {"kind": "no_activity", "verified": True}
        ]
    }
    score = calculate_health_score(sample_proj)
    # Starts at 100, -12 for stale, -15 for delay, -36 for two no-activity reports = ~37
    assert score <= 40
