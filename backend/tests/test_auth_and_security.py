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


# ============================================================================
# ES256 & Supabase Security Hardening Tests
# ============================================================================

from unittest.mock import MagicMock, patch
from cryptography.hazmat.primitives.asymmetric import ec
from jwt.exceptions import PyJWKClientConnectionError, PyJWKClientError

from app.core.security import decode_token, create_access_token, jwks_client


def _generate_ec_key_pair():
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    return private_key, public_key


def test_jwks_url_construction():
    """Requirement 1: JWKS URL derived from SUPABASE_URL strips any trailing slash."""
    expected_base = settings.SUPABASE_URL.rstrip("/")
    expected_jwks = f"{expected_base}/auth/v1/.well-known/jwks.json"
    from app.core.security import jwks_url
    assert jwks_url == expected_jwks
    assert "//auth" not in jwks_url


def test_es256_token_verification_success():
    """Requirement 2: Valid ES256 token verified using kid and JWKS signing key."""
    private_key, public_key = _generate_ec_key_pair()
    expected_issuer = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"

    payload = {
        "sub": "usr-01",
        "email": "officer.roads@cityworks.gov",
        "role": "officer",
        "department_id": "dept-01",
        "iss": expected_issuer,
        "aud": "authenticated",
        "exp": datetime.now(timezone.utc) + timedelta(hours=2),
    }
    token = jwt.encode(payload, private_key, algorithm="ES256", headers={"kid": "key-ec-01"})

    mock_key = MagicMock()
    mock_key.key = public_key

    with patch.object(jwks_client, "get_signing_key_from_jwt", return_value=mock_key):
        decoded = decode_token(token)
        assert decoded["sub"] == "usr-01"
        assert decoded["email"] == "officer.roads@cityworks.gov"

        # Also verify via protected API endpoint
        res = client.post(
            "/api/v1/projects/proj-101/updates",
            headers={"Authorization": f"Bearer {token}"},
            json={"note": "ES256 authenticated update."},
        )
        assert res.status_code == 200
        assert "note" in res.json()


def test_es256_token_expired_rejected():
    """Requirement 2 & 6: Expired ES256 token must return 401 TOKEN_EXPIRED."""
    private_key, public_key = _generate_ec_key_pair()
    expected_issuer = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"

    expired_payload = {
        "sub": "usr-01",
        "email": "officer.roads@cityworks.gov",
        "role": "officer",
        "iss": expected_issuer,
        "aud": "authenticated",
        "exp": datetime.now(timezone.utc) - timedelta(minutes=10),
    }
    token = jwt.encode(expired_payload, private_key, algorithm="ES256", headers={"kid": "key-ec-01"})

    mock_key = MagicMock()
    mock_key.key = public_key

    with patch.object(jwks_client, "get_signing_key_from_jwt", return_value=mock_key):
        res = client.post(
            "/api/v1/projects/proj-101/updates",
            headers={"Authorization": f"Bearer {token}"},
            json={"note": "Expired ES256 attempt."},
        )
        assert res.status_code == 401
        assert res.json()["error"]["code"] == "TOKEN_EXPIRED"


def test_es256_token_invalid_signature_rejected():
    """Requirement 2 & 6: ES256 token signed by untrusted key must return 401 INVALID_TOKEN."""
    signer_key, _ = _generate_ec_key_pair()
    _, different_public_key = _generate_ec_key_pair()
    expected_issuer = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"

    payload = {
        "sub": "usr-01",
        "email": "officer.roads@cityworks.gov",
        "role": "officer",
        "iss": expected_issuer,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    token = jwt.encode(payload, signer_key, algorithm="ES256", headers={"kid": "key-ec-01"})

    mock_key = MagicMock()
    mock_key.key = different_public_key

    with patch.object(jwks_client, "get_signing_key_from_jwt", return_value=mock_key):
        res = client.post(
            "/api/v1/projects/proj-101/updates",
            headers={"Authorization": f"Bearer {token}"},
            json={"note": "Tampered signature attempt."},
        )
        assert res.status_code == 401
        assert res.json()["error"]["code"] == "INVALID_TOKEN"


def test_es256_token_missing_kid_rejected():
    """Requirement 7: ES256 token missing kid in header must return 401 INVALID_TOKEN safely."""
    private_key, _ = _generate_ec_key_pair()
    expected_issuer = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"

    payload = {
        "sub": "usr-01",
        "email": "officer.roads@cityworks.gov",
        "role": "officer",
        "iss": expected_issuer,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    # No kid header supplied
    token = jwt.encode(payload, private_key, algorithm="ES256")

    res = client.post(
        "/api/v1/projects/proj-101/updates",
        headers={"Authorization": f"Bearer {token}"},
        json={"note": "Missing kid attempt."},
    )
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "INVALID_TOKEN"


def test_es256_token_jwks_lookup_failure_handled_safely():
    """Requirement 7: JWKS lookup network failure / unknown kid must return 401 INVALID_TOKEN."""
    private_key, _ = _generate_ec_key_pair()
    expected_issuer = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"

    payload = {
        "sub": "usr-01",
        "email": "officer.roads@cityworks.gov",
        "role": "officer",
        "iss": expected_issuer,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    token = jwt.encode(payload, private_key, algorithm="ES256", headers={"kid": "unknown-kid"})

    with patch.object(
        jwks_client,
        "get_signing_key_from_jwt",
        side_effect=PyJWKClientError("Unable to find a signing key that matches: unknown-kid"),
    ):
        res = client.post(
            "/api/v1/projects/proj-101/updates",
            headers={"Authorization": f"Bearer {token}"},
            json={"note": "Lookup failure attempt."},
        )
        assert res.status_code == 401
        assert res.json()["error"]["code"] == "INVALID_TOKEN"


def test_es256_token_issuer_mismatch_rejected():
    """Requirement 5: Token with mismatched issuer must return 401 INVALID_TOKEN."""
    private_key, public_key = _generate_ec_key_pair()

    payload = {
        "sub": "usr-01",
        "email": "officer.roads@cityworks.gov",
        "role": "officer",
        "iss": "https://untrusted-supabase-project.supabase.co/auth/v1",
        "aud": "authenticated",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    token = jwt.encode(payload, private_key, algorithm="ES256", headers={"kid": "key-ec-01"})

    mock_key = MagicMock()
    mock_key.key = public_key

    with patch.object(jwks_client, "get_signing_key_from_jwt", return_value=mock_key):
        res = client.post(
            "/api/v1/projects/proj-101/updates",
            headers={"Authorization": f"Bearer {token}"},
            json={"note": "Wrong issuer attempt."},
        )
        assert res.status_code == 401
        assert res.json()["error"]["code"] == "INVALID_TOKEN"


def test_es256_token_missing_issuer_rejected():
    """Requirement 5: ES256 Supabase token without issuer must return 401 INVALID_TOKEN."""
    private_key, public_key = _generate_ec_key_pair()

    payload = {
        "sub": "usr-01",
        "email": "officer.roads@cityworks.gov",
        "role": "officer",
        "aud": "authenticated",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    token = jwt.encode(payload, private_key, algorithm="ES256", headers={"kid": "key-ec-01"})

    mock_key = MagicMock()
    mock_key.key = public_key

    with patch.object(jwks_client, "get_signing_key_from_jwt", return_value=mock_key):
        res = client.post(
            "/api/v1/projects/proj-101/updates",
            headers={"Authorization": f"Bearer {token}"},
            json={"note": "Missing issuer attempt."},
        )
        assert res.status_code == 401
        assert res.json()["error"]["code"] == "INVALID_TOKEN"


def test_hs256_compatibility_with_valid_issuer():
    """Requirement 3 & 5: HS256 token with valid Supabase issuer succeeds."""
    expected_issuer = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"
    payload = {
        "sub": "usr-01",
        "email": "officer.roads@cityworks.gov",
        "role": "officer",
        "department_id": "dept-01",
        "iss": expected_issuer,
        "aud": "authenticated",
        "exp": datetime.now(timezone.utc) + timedelta(hours=2),
    }
    token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    res = client.post(
        "/api/v1/projects/proj-101/updates",
        headers={"Authorization": f"Bearer {token}"},
        json={"note": "HS256 with issuer update."},
    )
    assert res.status_code == 200
    assert "note" in res.json()


def test_hs256_token_issuer_mismatch_rejected():
    """Requirement 5: HS256 token with untrusted issuer must return 401 INVALID_TOKEN."""
    payload = {
        "sub": "usr-01",
        "email": "officer.roads@cityworks.gov",
        "role": "officer",
        "iss": "https://attacker.com/auth/v1",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    res = client.post(
        "/api/v1/projects/proj-101/updates",
        headers={"Authorization": f"Bearer {token}"},
        json={"note": "Untrusted issuer on HS256."},
    )
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "INVALID_TOKEN"


def test_hs256_invalid_signature_rejected():
    """Requirement 3 & 6: HS256 token signed with wrong secret must return 401 INVALID_TOKEN."""
    payload = {
        "sub": "usr-01",
        "email": "officer.roads@cityworks.gov",
        "role": "officer",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    token = jwt.encode(payload, "completely-wrong-secret", algorithm="HS256")

    res = client.post(
        "/api/v1/projects/proj-101/updates",
        headers={"Authorization": f"Bearer {token}"},
        json={"note": "Wrong secret on HS256."},
    )
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "INVALID_TOKEN"


@pytest.mark.parametrize("unsupported_alg", ["RS256", "none", "ES512", "HS512"])
def test_unsupported_algorithms_rejected(unsupported_alg: str):
    """Requirement 4: Algorithm restriction allowlist rejects unpermitted algorithms."""
    # Construct a token header with an unsupported alg
    header = {"alg": unsupported_alg, "typ": "JWT"}
    payload = {
        "sub": "usr-01",
        "email": "officer.roads@cityworks.gov",
        "role": "officer",
        "exp": int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
    }
    import base64
    import json
    h_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    p_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    dummy_token = f"{h_b64}.{p_b64}.fakesig"

    res = client.post(
        "/api/v1/projects/proj-101/updates",
        headers={"Authorization": f"Bearer {dummy_token}"},
        json={"note": "Unsupported algorithm attempt."},
    )
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "INVALID_TOKEN"


def test_malformed_token_header_rejected():
    """Requirement 7: Malformed token segments return 401 INVALID_TOKEN safely."""
    for bad_token in ["not-a-token", "a.b", "a.b.c.d", ""]:
        res = client.post(
            "/api/v1/projects/proj-101/updates",
            headers={"Authorization": f"Bearer {bad_token}"},
            json={"note": "Malformed attempt."},
        )
        assert res.status_code == 401


def test_create_access_token_has_expected_issuer_and_audience():
    """Verify newly created access tokens contain correct Supabase issuer and audience."""
    token = create_access_token(
        user_id="usr-test",
        email="test@example.com",
        role="officer",
        department_id="dept-01",
    )
    decoded = decode_token(token)
    assert decoded["sub"] == "usr-test"
    assert decoded["email"] == "test@example.com"
    assert decoded["iss"] == f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"
    assert decoded["aud"] == "authenticated"

