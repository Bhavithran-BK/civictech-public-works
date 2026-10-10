from fastapi.testclient import TestClient
import pytest
import jwt
from datetime import datetime, timedelta, timezone

from app.main import app
from app.core.config import settings
from app.services.conflict_engine import build_postgis_conflict_sql, corridor_to_geojson_string
from app.services.notifications import notification_service

client = TestClient(app)


def test_postgis_sql_query_structure():
    """Verify production PostGIS query contains spatial index functions and filters."""
    sql = build_postgis_conflict_sql()
    assert "ST_DWithin" in sql
    assert "ST_Distance" in sql
    assert "ST_Intersects" in sql
    assert "p.geom::geography" in sql
    assert "departments" in sql

    geojson = corridor_to_geojson_string([[80.22, 13.02], [80.23, 13.03]])
    assert '"type": "LineString"' in geojson
    assert "80.22" in geojson


def test_officer_cannot_modify_different_department_project():
    """Officer from GCC Roads (dept-01) cannot log delay on Metro Water project (dept-02)."""
    # Create officer token for dept-01
    officer_dept1 = {
        "sub": "usr-officer-gcc",
        "email": "officer@gcc.gov.in",
        "role": "officer",
        "department_id": "dept-01",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    token = jwt.encode(officer_dept1, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    # proj-102 belongs to dept-02 (CMWSSB Metro Water)
    res = client.post(
        "/api/v1/projects/proj-102/delays",
        headers={"Authorization": f"Bearer {token}"},
        json={"reason": "Attempted unauthorized delay logging.", "new_end_date": "2026-12-30"},
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"


def test_admin_can_modify_any_department_project():
    """Admin can modify projects across any department."""
    admin_payload = {
        "sub": "usr-admin",
        "email": "commissioner@cityworks.gov",
        "role": "admin",
        "department_id": "dept-01",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    token = jwt.encode(admin_payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    res = client.patch(
        "/api/v1/projects/proj-102",
        headers={"Authorization": f"Bearer {token}"},
        json={"contractor": "Cross-Dept Contractor Approved by Admin"},
    )
    assert res.status_code == 200
    assert res.json()["contractor"] == "Cross-Dept Contractor Approved by Admin"


def test_notification_dispatched_on_delay_and_update():
    """Verify subscribers receive notification records when delays or updates occur."""
    notification_service.clear_history()

    # 1. Subscribe resident to proj-101
    client.post("/api/v1/projects/proj-101/subscribe", json={"email": "alert-test@resident.org"})

    # 2. Officer from dept-01 logs update
    officer_token = jwt.encode(
        {
            "sub": "usr-01",
            "email": "officer.roads@cityworks.gov",
            "role": "officer",
            "department_id": "dept-01",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        },
        settings.SUPABASE_JWT_SECRET,
        algorithm="HS256",
    )

    client.post(
        "/api/v1/projects/proj-101/updates",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"note": "Notification integration test note."},
    )

    history = notification_service.get_history_for_project("proj-101")
    assert len(history) > 0
    assert any(m.recipient == "alert-test@resident.org" for m in history)
    assert any("Notification integration test note" in m.body for m in history)


def test_pagination_parameters():
    """Verify limit and offset behave as expected."""
    res_page1 = client.get("/api/v1/projects?limit=5&offset=0")
    assert res_page1.status_code == 200
    items1 = res_page1.json()
    assert len(items1) <= 5

    res_page2 = client.get("/api/v1/projects?limit=5&offset=5")
    assert res_page2.status_code == 200
    items2 = res_page2.json()

    if len(items1) > 0 and len(items2) > 0:
        # Check that page 1 and page 2 don't have the same first item
        assert items1[0]["id"] != items2[0]["id"]
