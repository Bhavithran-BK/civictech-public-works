from datetime import date
import pytest
from app.services.health_score import calculate_health_score


def test_new_project_has_perfect_health_score():
    project = {
        "status": "planned",
        "start_date": "2026-11-01",
        "end_date": "2026-12-01",
        "delays": [],
        "reports": [],
        "updates": [],
    }
    score, breakdown = calculate_health_score(project, current_date=date(2026, 10, 10))
    assert score == 100
    assert breakdown["final_score"] == 100
    assert breakdown["auto_flag_stalled"] is False
    assert breakdown["derived_status"] == "on_track"


def test_overdue_slippage_penalty_and_cap():
    # Overdue by 10 days -> 10 * 3 = 30 pts deducted -> 70
    project = {
        "status": "on_track",
        "end_date": "2026-10-01",
        "delays": [],
        "reports": [],
    }
    score, breakdown = calculate_health_score(project, current_date=date(2026, 10, 11))
    assert score == 70
    assert "schedule_slippage" in breakdown["penalties"]

    # Overdue by 30 days -> capped at 40 pts deducted -> 60
    score_cap, _ = calculate_health_score(project, current_date=date(2026, 10, 31))
    assert score_cap == 60


def test_stale_cadence_penalty():
    project = {
        "status": "on_track",
        "end_date": "2026-12-01",
        "last_official_update_days_ago": 20,  # 6 days past 14 -> 6 * 2 = 12 pts deducted
        "delays": [],
        "reports": [],
    }
    score, breakdown = calculate_health_score(project, current_date=date(2026, 10, 10))
    assert score == 88
    assert "stale_cadence" in breakdown["penalties"]


def test_delay_record_penalties():
    project = {
        "status": "on_track",
        "end_date": "2026-12-01",
        "delays": [{"id": "d1"}, {"id": "d2"}],  # 2 delays -> -30 pts
        "reports": [],
    }
    score, breakdown = calculate_health_score(project, current_date=date(2026, 10, 10))
    assert score == 70
    assert "logged_delays" in breakdown["penalties"]


def test_unverified_reports_do_not_penalize_score():
    project = {
        "status": "on_track",
        "end_date": "2026-12-01",
        "reports": [
            {"kind": "no_activity", "verified": False},
            {"kind": "safety_hazard", "verified": False},
        ],
    }
    score, breakdown = calculate_health_score(project, current_date=date(2026, 10, 10))
    assert score == 100
    assert breakdown["verified_reports_count"] == 0
    assert "citizen_audit_penalties" not in breakdown["penalties"]


def test_verified_reports_penalties_and_boost():
    project = {
        "status": "on_track",
        "end_date": "2026-12-01",
        "reports": [
            {"kind": "no_activity", "verified": True},     # -18
            {"kind": "safety_hazard", "verified": True},   # -15
            {"kind": "poor_quality", "verified": True},    # -10
        ],
    }
    # Total deduction: 43 -> score 57
    score, breakdown = calculate_health_score(project, current_date=date(2026, 10, 10))
    assert score == 57
    assert breakdown["verified_reports_count"] == 3


def test_auto_flag_stalled_by_score_threshold():
    # Severe penalties dropping score below 35
    project = {
        "status": "on_track",
        "end_date": "2026-09-01",  # overdue 40 days -> -40
        "delays": [{"id": "d1"}, {"id": "d2"}],  # -30
        "reports": [{"kind": "no_activity", "verified": True}],  # -18
    }
    # 100 - 40 - 30 - 18 = 12
    score, breakdown = calculate_health_score(project, current_date=date(2026, 10, 10))
    assert score == 12
    assert breakdown["auto_flag_stalled"] is True
    assert breakdown["derived_status"] == "stalled"


def test_auto_flag_stalled_by_three_no_activity_reports():
    project = {
        "status": "on_track",
        "end_date": "2026-12-01",
        "reports": [
            {"kind": "no_activity", "verified": True},
            {"kind": "no_activity", "verified": True},
            {"kind": "no_activity", "verified": True},
        ],
    }
    score, breakdown = calculate_health_score(project, current_date=date(2026, 10, 10))
    # 100 - 54 = 46 (score is > 35, but 3 verified no_activity reports trip stalled flag)
    assert score == 46
    assert breakdown["no_activity_count"] == 3
    assert breakdown["auto_flag_stalled"] is True
    assert breakdown["derived_status"] == "stalled"


def test_score_clamped_to_zero_and_hundred():
    # Catastrophic project
    project = {
        "status": "on_track",
        "end_date": "2026-01-01",
        "delays": [{"id": f"d{i}"} for i in range(10)],  # -150
        "reports": [{"kind": "no_activity", "verified": True} for _ in range(10)],  # -180
    }
    score, _ = calculate_health_score(project, current_date=date(2026, 10, 10))
    assert score == 0  # not negative
