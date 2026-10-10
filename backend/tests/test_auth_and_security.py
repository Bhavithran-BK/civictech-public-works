from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
import jwt
import pytest

from app.core.config import settings
from app.main import app

client = TestClient(app)


def test_login_successful():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "officer.roads@cityworks.gov", "password": "AnyValidPassword123!"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "officer.roads@cityworks.gov"
    assert data["user"]["role"] in ["officer", "admin"]


def test_protected_endpoint_rejects_missing_token():
    res = client.post(
        "/api/v1/projects/proj-101/updates",
        json={"note": "Unauthorized update attempt."},
    )
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "UNAUTHORIZED"


def test_protected_endpoint_rejects_invalid_token():
    res = client.post(
        "/api/v1/projects/proj-101/updates",
        headers={"Authorization": "Bearer invalid.jwt.signature.here"},
        json={"note": "Invalid token attempt."},
    )
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "INVALID_TOKEN"


def test_protected_endpoint_rejects_expired_token():
    expired_payload = {
        "sub": "usr-test",
        "email": "test@cityworks.gov",
        "role": "officer",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
    }
    expired_token = jwt.encode(expired_payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    res = client.post(
        "/api/v1/projects/proj-101/updates",
        headers={"Authorization": f"Bearer {expired_token}"},
        json={"note": "Expired token attempt."},
    )
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "TOKEN_EXPIRED"


def test_authorized_officer_request_succeeds():
    valid_payload = {
        "sub": "usr-01",
        "email": "officer.roads@cityworks.gov",
        "role": "officer",
        "department_id": "dept-01",
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    token = jwt.encode(valid_payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    res = client.post(
        "/api/v1/projects/proj-101/updates",
        headers={"Authorization": f"Bearer {token}"},
        json={"note": "Authorized progress note added by officer."},
    )
    assert res.status_code == 200
    assert "note" in res.json()
