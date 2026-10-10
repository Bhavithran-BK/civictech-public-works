from fastapi.testclient import TestClient
import pytest
from app.main import app

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer jwt-demo-officer"}


def test_list_projects():
    res = client.get("/api/v1/projects")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_list_projects_filtered_by_type():
    res = client.get("/api/v1/projects?type=road")
    assert res.status_code == 200
    for p in res.json():
        assert p["type"] == "road"


def test_get_project_detail_success():
    res = client.get("/api/v1/projects/proj-101")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "proj-101"
    assert "updates" in data
    assert "delays" in data
    assert "reports" in data


def test_get_project_not_found():
    res = client.get("/api/v1/projects/nonexistent-proj-xyz")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "PROJECT_NOT_FOUND"


def test_create_project_success():
    payload = {
        "title": "Kotturpuram River Walk Footpath",
        "purpose": "Constructing permeable pedestrian walkway.",
        "type": "road",
        "department_id": "dept-01",
        "contractor": "Chennai Walkways Ltd",
        "budget": 3500000.0,
        "start_date": "2026-11-01",
        "end_date": "2026-12-15",
        "location_name": "Kotturpuram High Road",
        "ward": "Ward 171",
        "coordinates": [
            [80.2415, 13.0185],
            [80.2435, 13.0195],
        ],
    }
    res = client.post("/api/v1/projects", headers=AUTH_HEADERS, json=payload)
    assert res.status_code == 201
    created = res.json()
    assert created["title"] == payload["title"]
    assert created["budget"] == payload["budget"]
    assert created["status"] == "planned"


def test_create_project_rejects_invalid_date_ordering():
    payload = {
        "title": "Invalid Date Road",
        "purpose": "Testing reverse dates.",
        "type": "road",
        "department_id": "dept-01",
        "contractor": "Tester",
        "budget": 1000000.0,
        "start_date": "2026-12-01",
        "end_date": "2026-11-01",  # earlier than start
        "location_name": "Test St",
        "coordinates": [[80.2, 13.0], [80.21, 13.01]],
    }
    res = client.post("/api/v1/projects", headers=AUTH_HEADERS, json=payload)
    assert res.status_code == 422
    assert "VALIDATION_ERROR" in res.json()["error"]["code"]


def test_create_project_rejects_insufficient_coordinates():
    payload = {
        "title": "Single Point Road",
        "purpose": "Testing single point.",
        "type": "road",
        "department_id": "dept-01",
        "contractor": "Tester",
        "budget": 1000000.0,
        "start_date": "2026-11-01",
        "end_date": "2026-12-01",
        "location_name": "Test St",
        "coordinates": [[80.2, 13.0]],  # Only 1 point
    }
    res = client.post("/api/v1/projects", headers=AUTH_HEADERS, json=payload)
    assert res.status_code == 422


def test_patch_project():
    res = client.patch(
        "/api/v1/projects/proj-101",
        headers=AUTH_HEADERS,
        json={"contractor": "Updated Contractor Name Ltd"},
    )
    assert res.status_code == 200
    assert res.json()["contractor"] == "Updated Contractor Name Ltd"


def test_log_delay_mandatory_reason():
    # Empty reason should be rejected
    res_bad = client.post(
        "/api/v1/projects/proj-101/delays",
        headers=AUTH_HEADERS,
        json={"reason": "   ", "new_end_date": "2026-12-20"},
    )
    assert res_bad.status_code == 422

    # Valid reason succeeds
    res_ok = client.post(
        "/api/v1/projects/proj-101/delays",
        headers=AUTH_HEADERS,
        json={"reason": "Nighttime asphalt temperature dropped below ASTM spec.", "new_end_date": "2026-12-25"},
    )
    assert res_ok.status_code == 200
    data = res_ok.json()
    assert data["status"] == "delayed"
    assert data["end_date"] == "2026-12-25"


def test_add_project_update():
    res = client.post(
        "/api/v1/projects/proj-101/updates",
        headers=AUTH_HEADERS,
        json={"note": "Culvert foundation curing finished. Trench backfilling started."},
    )
    assert res.status_code == 200
    assert "note" in res.json()


def test_get_project_qr_code():
    res = client.get("/api/v1/projects/proj-101/qr")
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/png"
    assert len(res.content) > 100
