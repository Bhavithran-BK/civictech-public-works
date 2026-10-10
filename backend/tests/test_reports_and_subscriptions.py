from fastapi.testclient import TestClient
import pytest
from app.main import app

client = TestClient(app)


def test_submit_citizen_report_nearby_verified():
    # Near Anna Salai proj-101 coordinates [80.2285, 13.0285]
    payload = {
        "kind": "no_activity",
        "reportedLat": 13.0286,
        "reportedLng": 80.2284,
        "description": "Trench left excavated with no machinery for 5 days.",
        "reporterHandle": "Resident R. Swaminathan",
    }
    res = client.post("/api/v1/projects/proj-101/reports", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["verified"] is True
    assert data["distance_m"] <= 500.0
    assert data["kind"] == "no_activity"


def test_submit_citizen_report_distant_unverified():
    # Distant coordinates (> 10 km away)
    payload = {
        "kind": "safety_hazard",
        "lat": 13.1500,
        "lng": 80.3000,
        "notes": "Barricade missing.",
    }
    res = client.post("/api/v1/projects/proj-101/reports", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["verified"] is False
    assert data["distance_m"] > 500.0


def test_submit_report_nonexistent_project_returns_404():
    payload = {
        "kind": "safety_hazard",
        "lat": 13.0285,
        "lng": 80.2285,
    }
    res = client.post("/api/v1/projects/proj-fake-999/reports", json=payload)
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "PROJECT_NOT_FOUND"


def test_submit_report_invalid_kind_rejected():
    payload = {
        "kind": "not_a_real_kind",
        "lat": 13.0285,
        "lng": 80.2285,
    }
    res = client.post("/api/v1/projects/proj-101/reports", json=payload)
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_project_subscription_flow():
    res = client.post(
        "/api/v1/projects/proj-101/subscribe",
        json={"email": "swaminathan@residents-association.org"},
    )
    assert res.status_code == 200
    assert "Subscribed successfully" in res.json()["message"]

    # Duplicate subscription attempt
    res_dup = client.post(
        "/api/v1/projects/proj-101/subscribe",
        json={"email": "swaminathan@residents-association.org"},
    )
    assert res_dup.status_code == 200
    assert "Already subscribed" in res_dup.json()["message"]


def test_dashboard_summary_metrics():
    res = client.get("/api/v1/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_projects" in data
    assert data["total_projects"] > 0
    assert "status_counts" in data
    assert "on_track" in data["status_counts"]
    assert "duplicate_dig_savings_est_inr" in data
