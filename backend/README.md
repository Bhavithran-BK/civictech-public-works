# DigOnce — Backend Core API Engine

FastAPI-powered backend core for DigOnce CivicTech Public Works Coordination, Conflict Detection, and Citizen Accountability Platform.

---

## Features

1. **Spatio-Temporal Conflict Detection Engine (`app/services/conflict_engine.py`)**:
   - Detects concurrent utility trenching on shared road corridors using continuous LineString geometry.
   - Enforces a 90-day road excavation moratorium on recently paved road segments.
   - Computes mathematically optimal joint trenching windows `[start_date, end_date]` and estimated avoidable municipal expenditure (~35% of road project budget).
2. **Proof-of-Work Project Health Scoring (`app/services/health_score.py`)**:
   - Deterministic and auditable score calculation clamped between 0 and 100.
   - Penalties for schedule slippage (-3 pts/day, capped at 40), stale engineering updates (-2 pts/day past 14 days, capped at 25), formal delay extensions (-15 pts/delay).
   - Citizen field sensor loop: verified `no_activity` (-18 pts), `safety_hazard` (-15 pts), `poor_quality` (-10 pts), and `progress_verified` (+5 pts boost).
   - Automatic project status derivation and **Stalled** auto-flagging when score < 35 or ≥ 3 verified `no_activity` reports.
3. **Full Project Lifecycle & Audit Trail (`app/routers/projects.py`)**:
   - Project creation, listing with bbox and attribute filtering, and partial updates.
   - Mandatory justification logging for project delays.
   - Scannable site-board QR code generator endpoint streaming PNG binaries (`/api/v1/projects/{id}/qr`).
4. **Citizen Field Verification & Subscriptions (`app/routers/reports.py`, `app/routers/subscriptions.py`)**:
   - Geo-fenced citizen verification check-in via Haversine distance.
   - Email subscription thread for project notifications.
5. **Municipal Dashboard Summary (`app/routers/dashboard.py`)**:
   - Aggregated status counts, overdue projects, open citizen reports, and calculated duplicate-dig savings.
6. **Authentication & Authorization (`app/core/security.py`, `app/routers/auth.py`)**:
   - Supabase JWT token verification with role-based access control (`public`, `officer`, `admin`).
   - Dual-branch compatibility: accepts both canonical `snake_case` and legacy `camelCase` request and response payloads.

---

## Local Setup & Development

### 1. Requirements
- Python 3.12+

### 2. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Run Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000/api/v1`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/api/v1/health`

---

## Running Automated Tests

Run the test suite using pytest:
```bash
python -m pytest backend/tests -v
```
All 37 test cases cover:
- Spatial-temporal proximity and continuous LineString conflict detection
- Deterministic project health scoring and auto-stalled transitions
- Project CRUD, partial updates, and delay validations
- Supabase JWT authentication, token expiry, and role checks
- Citizen reporting geofencing, subscriptions, and dashboard metrics
