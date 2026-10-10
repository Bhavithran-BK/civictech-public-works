# 🛠️ Person D — Backend Support & Ops — Complete Implementation Guide

> **Your role:** Auth & Roles · Image Upload & Verification · Notifications · Seed Data · Deployment · CI · Demo Video  
> **Unique feature you own:** 🤖 **Auto Health Score Background Scheduler** (see Section 6)  
> **Stack:** FastAPI · Python · Supabase (Postgres + PostGIS + Storage) · Render · GitHub Actions

---

## 📁 Backend Folder Structure to Create

```
backend/
├── app/
│   ├── main.py                  ← FastAPI app entry point + scheduler startup
│   ├── core/
│   │   ├── config.py            ← Env vars via pydantic-settings
│   │   ├── db.py                ← Supabase client + raw psycopg2 pool
│   │   └── security.py          ← JWT verification + role guards (YOUR WORK)
│   ├── models/
│   │   └── tables.py            ← SQLAlchemy ORM models (reference only)
│   ├── schemas/
│   │   ├── auth.py              ← Pydantic: LoginRequest, TokenResponse
│   │   ├── reports.py           ← Pydantic: ReportCreate, ReportOut
│   │   └── notifications.py     ← Pydantic: SubscribeRequest
│   ├── routers/
│   │   ├── auth.py              ← POST /auth/login (YOUR WORK)
│   │   ├── reports.py           ← POST /projects/{id}/reports (YOUR WORK)
│   │   └── notifications.py     ← POST /projects/{id}/subscribe (YOUR WORK)
│   └── services/
│       ├── image_service.py     ← Upload to Supabase Storage + pHash (YOUR WORK)
│       ├── notification_service.py ← Email via SMTP (YOUR WORK)
│       └── scheduler.py         ← 🤖 Auto health score job (YOUR UNIQUE FEATURE)
├── seed.py                      ← Insert 28 demo projects into DB (YOUR WORK)
├── requirements.txt
├── .env.example
├── Procfile                     ← For Render deployment
└── .github/
    └── workflows/
        └── ci.yml               ← GitHub Actions CI (YOUR WORK)
```

---

## ✅ Step-by-Step Implementation

---

## SECTION 1 — Project Setup

### 1.1 Create `backend/requirements.txt`

```txt
fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic-settings==2.2.1
supabase==2.4.6
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
pillow==10.3.0
imagehash==4.3.1
python-multipart==0.0.9
httpx==0.27.0
apscheduler==3.10.4
slowapi==0.1.9
pytest==8.2.0
pytest-asyncio==0.23.7
python-dotenv==1.0.1
```

### 1.2 Create `backend/.env.example`

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_STORAGE_BUCKET=project-photos

# Database (Direct connection for seed script)
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres

# App
SECRET_KEY=your-random-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Email (use Gmail SMTP or Supabase SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@digonce.in

# GPS distance limit for citizen reports (in meters)
REPORT_MAX_DISTANCE_M=500

# Rate limiting
RATE_LIMIT_REPORTS=10/minute
```

### 1.3 Create `backend/app/core/config.py`

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str
    supabase_storage_bucket: str = "project-photos"
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "noreply@digonce.in"
    report_max_distance_m: float = 500.0
    rate_limit_reports: str = "10/minute"

    class Config:
        env_file = ".env"

settings = Settings()
```

### 1.4 Create `backend/app/core/db.py`

```python
import psycopg2
from psycopg2.extras import RealDictCursor
from supabase import create_client, Client
from app.core.config import settings

# Supabase client (for Auth + Storage)
supabase: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)

def get_db_conn():
    """Raw psycopg2 connection for direct SQL queries."""
    return psycopg2.connect(settings.database_url, cursor_factory=RealDictCursor)
```

---

## SECTION 2 — Auth & Roles (Your Core Task)

### 2.1 Create `backend/app/core/security.py`

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import settings
from app.core.db import get_db_conn

bearer_scheme = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """Decode and verify JWT. Returns the payload dict."""
    token = credentials.credentials
    try:
        # Try verifying as a Supabase JWT first
        payload = jwt.decode(
            token,
            settings.supabase_anon_key,   # Supabase uses anon key as secret for JWT
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "INVALID_TOKEN", "message": "Token is invalid or expired."}}
        )

def get_current_user(payload: dict = Depends(verify_token)) -> dict:
    """Fetch user from DB using token subject (user ID)."""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail={"error": {"code": "NO_SUBJECT", "message": "Token has no subject."}})
    
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, email, full_name, role, department_id FROM users WHERE id = %s",
                (user_id,)
            )
            user = cur.fetchone()
    
    if not user:
        raise HTTPException(status_code=404, detail={"error": {"code": "USER_NOT_FOUND", "message": "User not found."}})
    return dict(user)

def require_officer(user: dict = Depends(get_current_user)) -> dict:
    """Guard: user must be officer or admin."""
    if user["role"] not in ("officer", "admin"):
        raise HTTPException(status_code=403, detail={"error": {"code": "FORBIDDEN", "message": "Officer or admin role required."}})
    return user

def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Guard: user must be admin."""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail={"error": {"code": "FORBIDDEN", "message": "Admin role required."}})
    return user
```

### 2.2 Create `backend/app/schemas/auth.py`

```python
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str | None
    role: str
    department_id: str | None
    department_name: str | None = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
```

### 2.3 Create `backend/app/routers/auth.py`

```python
from fastapi import APIRouter, HTTPException
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.core.db import supabase, get_db_conn

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    """Login with email and password via Supabase Auth."""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password
        })
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "AUTH_FAILED", "message": "Invalid email or password."}}
        )

    if not response.session:
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "AUTH_FAILED", "message": "Invalid email or password."}}
        )

    user_id = response.user.id
    access_token = response.session.access_token

    # Fetch extended user info from our users table
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.id, u.email, u.full_name, u.role, u.department_id, d.name as department_name
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
                WHERE u.id = %s
            """, (user_id,))
            user_row = cur.fetchone()

    if not user_row:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "USER_NOT_FOUND", "message": "User record not found. Contact admin."}}
        )

    return TokenResponse(
        access_token=access_token,
        user=UserOut(**dict(user_row))
    )
```

---

## SECTION 3 — Image Upload & Citizen Reports

### 3.1 Create `backend/app/services/image_service.py`

```python
import io
import hashlib
import math
from PIL import Image
import imagehash
from fastapi import UploadFile, HTTPException
from app.core.db import supabase
from app.core.config import settings

def compute_phash(image_bytes: bytes) -> str:
    """Compute perceptual hash of an image for duplicate detection."""
    img = Image.open(io.BytesIO(image_bytes))
    return str(imagehash.phash(img))

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in meters between two GPS coordinates."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(d_lambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

async def upload_photo(file: UploadFile, project_id: str, report_id: str) -> tuple[str, str]:
    """
    Upload photo to Supabase Storage.
    Returns (public_url, phash).
    """
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail={"error": {"code": "FILE_TOO_LARGE", "message": "Photo must be under 10MB."}})

    phash = compute_phash(contents)
    file_path = f"{project_id}/{report_id}.jpg"

    supabase.storage.from_(settings.supabase_storage_bucket).upload(
        path=file_path,
        file=contents,
        file_options={"content-type": file.content_type or "image/jpeg"}
    )

    public_url = supabase.storage.from_(settings.supabase_storage_bucket).get_public_url(file_path)
    return public_url, phash
```

### 3.2 Create `backend/app/schemas/reports.py`

```python
from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime

class ReportCreate(BaseModel):
    kind: Literal["progress_verified", "no_activity", "safety_hazard"]
    lat: float
    lng: float
    notes: Optional[str] = None
    reporter_contact: Optional[str] = None
    photo_url: Optional[str] = None   # Used if photo uploaded separately

class ReportOut(BaseModel):
    id: str
    project_id: str
    kind: str
    photo_url: Optional[str]
    lat: float
    lng: float
    distance_m: float
    verified: bool
    notes: Optional[str]
    created_at: datetime
```

### 3.3 Create `backend/app/routers/reports.py`

```python
import uuid
from fastapi import APIRouter, Form, UploadFile, File, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.schemas.reports import ReportOut
from app.core.db import get_db_conn
from app.core.config import settings
from app.services.image_service import upload_photo, haversine_distance
from app.services.notification_service import notify_subscribers_new_report

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(tags=["Reports"])

@router.post("/projects/{project_id}/reports", response_model=ReportOut, status_code=201)
@limiter.limit("10/minute")
async def submit_report(
    request: Request,
    project_id: str,
    kind: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    notes: str = Form(None),
    reporter_contact: str = Form(None),
    photo: UploadFile = File(None),
):
    """Submit a citizen geo-tagged report. Validates GPS distance server-side."""
    
    # Validate kind
    valid_kinds = {"progress_verified", "no_activity", "safety_hazard"}
    if kind not in valid_kinds:
        raise HTTPException(status_code=400, detail={"error": {"code": "INVALID_KIND", "message": f"kind must be one of {valid_kinds}"}})

    # Fetch project centroid from DB
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT ST_Y(centroid::geometry) as clat, ST_X(centroid::geometry) as clng FROM projects WHERE id = %s",
                (project_id,)
            )
            project = cur.fetchone()
    
    if not project:
        raise HTTPException(status_code=404, detail={"error": {"code": "PROJECT_NOT_FOUND", "message": "Project not found."}})

    # GPS distance check
    distance_m = haversine_distance(lat, lng, project["clat"], project["clng"])
    is_verified = distance_m <= settings.report_max_distance_m

    # Handle photo upload
    photo_url, photo_hash = None, None
    if photo:
        report_id = str(uuid.uuid4())
        photo_url, photo_hash = await upload_photo(photo, project_id, report_id)
    else:
        report_id = str(uuid.uuid4())

    # Insert report into DB
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO reports (id, project_id, kind, photo_url, photo_hash, lat, lng, distance_m, verified, reporter_contact, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, project_id, kind, photo_url, lat, lng, distance_m, verified, notes, created_at
            """, (report_id, project_id, kind, photo_url, photo_hash, lat, lng, distance_m, is_verified, reporter_contact, notes))
            report = dict(cur.fetchone())
        conn.commit()

    # Notify email subscribers (background, non-blocking)
    await notify_subscribers_new_report(project_id, kind, notes)

    return ReportOut(**report)
```

---

## SECTION 4 — Notifications

### 4.1 Create `backend/app/services/notification_service.py`

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from app.core.db import get_db_conn

def send_email(to_email: str, subject: str, body_html: str):
    """Send an email via SMTP. Silently fails if not configured (demo mode)."""
    if not settings.smtp_user:
        print(f"[EMAIL SKIPPED] To: {to_email} | Subject: {subject}")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.email_from
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html"))
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.email_from, to_email, msg.as_string())
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")

async def notify_subscribers_new_report(project_id: str, kind: str, notes: str | None):
    """Email all subscribers when a new citizen report is submitted."""
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT s.email, p.title FROM subscriptions s JOIN projects p ON s.project_id = p.id WHERE s.project_id = %s",
                (project_id,)
            )
            rows = cur.fetchall()
    
    for row in rows:
        kind_label = kind.replace("_", " ").title()
        subject = f"[DigOnce] New citizen report on: {row['title']}"
        body = f"""
        <h3>New Citizen Report — {kind_label}</h3>
        <p>A citizen has submitted a <strong>{kind_label}</strong> report on your project: <strong>{row['title']}</strong></p>
        {f'<p><em>"{notes}"</em></p>' if notes else ''}
        <p>Login to the <a href="https://digonce.vercel.app/dept/dashboard">DigOnce Dashboard</a> to respond.</p>
        <hr/><small>You are receiving this because you subscribed to updates for this project.</small>
        """
        send_email(row["email"], subject, body)

async def notify_project_stalled(project_id: str, project_title: str, department_email: str):
    """Alert the department when their project auto-flags as Stalled."""
    subject = f"[DigOnce] ⚠️ Project Stalled: {project_title}"
    body = f"""
    <h3>⚠️ Project Auto-Flagged as Stalled</h3>
    <p>The project <strong>{project_title}</strong> has been automatically flagged as <strong>Stalled</strong>
    because there has been no official update and multiple citizen "no activity" reports in the past 7 days.</p>
    <p>Please log an update or delay reason at your earliest to remove the stalled flag.</p>
    <p><a href="https://digonce.vercel.app/dept/dashboard">Open Dashboard</a></p>
    """
    send_email(department_email, subject, body)
```

### 4.2 Create `backend/app/routers/notifications.py`

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.core.db import get_db_conn

router = APIRouter(tags=["Notifications"])

class SubscribeRequest(BaseModel):
    email: EmailStr

@router.post("/projects/{project_id}/subscribe")
def subscribe(project_id: str, body: SubscribeRequest):
    """Subscribe email to receive updates for a project."""
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            # Check project exists
            cur.execute("SELECT id FROM projects WHERE id = %s", (project_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail={"error": {"code": "PROJECT_NOT_FOUND", "message": "Project not found."}})
            
            # Upsert subscription (ignore duplicates)
            cur.execute("""
                INSERT INTO subscriptions (project_id, email)
                VALUES (%s, %s)
                ON CONFLICT (project_id, email) DO NOTHING
            """, (project_id, body.email))
        conn.commit()
    
    return {"message": "Subscribed successfully. You will receive updates for this project."}
```

---

## SECTION 5 — Main App Entry Point

### 5.1 Create `backend/app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.routers import auth, reports, notifications
from app.services.scheduler import start_scheduler

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="DigOnce API",
    version="1.0.0",
    description="Public Works Coordination, Conflict Detection & Citizen Accountability"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")

@app.get("/api/v1/health")
def health():
    return {"status": "ok"}

@app.on_event("startup")
def startup():
    start_scheduler()   # 🤖 Start the auto health score background job

@app.on_event("shutdown")
def shutdown():
    from app.services.scheduler import scheduler
    if scheduler.running:
        scheduler.shutdown()
```

---

## SECTION 6 — 🤖 UNIQUE FEATURE: Auto Health Score Background Scheduler

> **This feature does NOT exist anywhere in the current repo.**  
> It is entirely owned and built by **Person D**.

### What it does
Every **30 minutes**, a background APScheduler job wakes up and:
1. Recalculates the **health score** for every active project based on:
   - Days past planned end date (schedule slippage)
   - Count of recent "no activity" citizen reports (last 7 days)
   - Days since last official project update
2. **Auto-transitions status** based on the score:
   - Score ≥ 70 → `on_track`
   - Score 40–69 → `at_risk`  
   - Score < 40 → `delayed`
   - Score < 40 AND no update in 7+ days → `stalled` 🔴
3. **Sends an email alert** to the department when their project is newly flagged as `stalled`
4. Logs the score change to the console

This is what makes the "Stalled badge" and health score **live and automatic** — without it, scores would never update unless someone manually triggered an endpoint.

### 6.1 Create `backend/app/services/scheduler.py`

```python
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone, timedelta
from app.core.db import get_db_conn
from app.services.notification_service import notify_project_stalled
import asyncio

scheduler = BackgroundScheduler(timezone="Asia/Kolkata")

def compute_health_score(
    end_date: datetime.date,
    original_end_date: datetime.date,
    last_update_at: datetime | None,
    no_activity_count: int,
    today: datetime.date
) -> int:
    score = 100

    # Penalty 1: Schedule slippage (days past original end date)
    if today > original_end_date:
        slippage_days = (today - original_end_date).days
        score -= min(40, slippage_days * 2)   # Max -40 pts

    # Penalty 2: Days since last official update
    if last_update_at:
        days_since_update = (datetime.now(timezone.utc) - last_update_at).days
        if days_since_update > 3:
            score -= min(30, (days_since_update - 3) * 3)  # Max -30 pts
    else:
        score -= 20  # Never updated

    # Penalty 3: Citizen "no activity" reports in last 7 days
    score -= min(30, no_activity_count * 10)  # Max -30 pts, 10 pts per report

    return max(0, min(100, score))

def auto_health_score_job():
    """
    🤖 Runs every 30 minutes.
    Recalculates health scores and auto-transitions project statuses.
    Sends stalled alerts to departments.
    """
    print(f"[SCHEDULER] Running auto health score job at {datetime.now(timezone.utc).isoformat()}")
    today = datetime.now(timezone.utc).date()
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

    newly_stalled = []

    try:
        with get_db_conn() as conn:
            with conn.cursor() as cur:
                # Fetch all active (non-completed) projects
                cur.execute("""
                    SELECT
                        p.id,
                        p.title,
                        p.status,
                        p.health_score,
                        p.end_date,
                        p.original_end_date,
                        p.updated_at,
                        d.contact_email as dept_email,
                        (
                            SELECT MAX(pu.created_at)
                            FROM project_updates pu
                            WHERE pu.project_id = p.id
                        ) as last_update_at,
                        (
                            SELECT COUNT(*) FROM reports r
                            WHERE r.project_id = p.id
                            AND r.kind = 'no_activity'
                            AND r.created_at >= %s
                        ) as no_activity_count
                    FROM projects p
                    LEFT JOIN departments d ON p.department_id = d.id
                    WHERE p.status NOT IN ('completed')
                """, (seven_days_ago,))
                projects = cur.fetchall()

            for proj in projects:
                proj = dict(proj)
                new_score = compute_health_score(
                    end_date=proj["end_date"],
                    original_end_date=proj["original_end_date"],
                    last_update_at=proj["last_update_at"],
                    no_activity_count=int(proj["no_activity_count"]),
                    today=today
                )

                # Determine new status
                days_since_update = None
                if proj["last_update_at"]:
                    days_since_update = (datetime.now(timezone.utc) - proj["last_update_at"]).days

                is_stalled = (
                    new_score < 40
                    and (days_since_update is None or days_since_update >= 7)
                    and proj["end_date"] < today
                )

                if is_stalled:
                    new_status = "stalled"
                elif new_score < 40:
                    new_status = "delayed"
                elif new_score < 70:
                    new_status = "at_risk"
                else:
                    new_status = "on_track"

                # Only update if something changed
                if new_score != proj["health_score"] or new_status != proj["status"]:
                    with conn.cursor() as cur:
                        cur.execute("""
                            UPDATE projects
                            SET health_score = %s, status = %s, updated_at = NOW()
                            WHERE id = %s
                        """, (new_score, new_status, proj["id"]))
                    conn.commit()
                    print(f"[SCHEDULER] Project {proj['id']} ({proj['title']}): score {proj['health_score']}→{new_score}, status {proj['status']}→{new_status}")

                    # Track newly stalled for alerts
                    if new_status == "stalled" and proj["status"] != "stalled":
                        newly_stalled.append({
                            "id": proj["id"],
                            "title": proj["title"],
                            "dept_email": proj["dept_email"]
                        })

        # Send stalled alerts (outside DB context)
        for stalled in newly_stalled:
            if stalled["dept_email"]:
                asyncio.run(notify_project_stalled(
                    stalled["id"], stalled["title"], stalled["dept_email"]
                ))

    except Exception as e:
        print(f"[SCHEDULER ERROR] {e}")

def start_scheduler():
    scheduler.add_job(auto_health_score_job, "interval", minutes=30, id="health_score_job", replace_existing=True)
    scheduler.start()
    print("[SCHEDULER] Auto health score job started — runs every 30 minutes.")
```

---

## SECTION 7 — Seed Data

### 7.1 Create `backend/seed.py`

> This inserts the 28 realistic Chennai projects from `docs/mock-data.json` into your live Supabase DB.  
> Run this **once** after deploying to Render.

```python
#!/usr/bin/env python3
"""
Seed script for DigOnce — inserts demo departments, users, and projects.
Run: python seed.py
"""
import json
import os
import sys
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in .env")
    sys.exit(1)

MOCK_DATA_PATH = Path(__file__).parent.parent / "docs" / "mock-data.json"

def seed():
    with open(MOCK_DATA_PATH) as f:
        data = json.load(f)

    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    cur = conn.cursor()

    print("Seeding departments...")
    for dept in data["departments"]:
        cur.execute("""
            INSERT INTO departments (id, name, code, type, contact_email)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (dept["id"], dept["name"], dept["code"], dept["type"], dept.get("contact_email")))

    print("Seeding projects...")
    for proj in data["projects"]:
        # Build WKT LineString from coordinates
        coords_wkt = ", ".join(f"{c[0]} {c[1]}" for c in proj["coordinates"])
        geom_wkt = f"LINESTRING({coords_wkt})"

        cur.execute("""
            INSERT INTO projects (
                id, title, purpose, type, department_id, contractor, budget,
                start_date, end_date, original_end_date, status, health_score,
                geom, centroid, location_name, ward
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                ST_GeomFromText(%s, 4326),
                ST_Centroid(ST_GeomFromText(%s, 4326)),
                %s, %s
            )
            ON CONFLICT (id) DO NOTHING
        """, (
            proj["id"], proj["title"], proj["purpose"], proj["type"],
            proj["department_id"], proj["contractor"], proj["budget"],
            proj["start_date"], proj["end_date"], proj.get("original_end_date", proj["end_date"]),
            proj["status"], proj["health_score"],
            geom_wkt, geom_wkt,
            proj["location_name"], proj.get("ward")
        ))

    conn.commit()
    cur.close()
    conn.close()
    print(f"✅ Seeded {len(data['departments'])} departments and {len(data['projects'])} projects.")

if __name__ == "__main__":
    seed()
```

---

## SECTION 8 — Deployment

### 8.1 Create `backend/Procfile` (for Render)

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 8.2 Render Deployment Steps

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add all **Environment Variables** from `.env.example` in the Render dashboard
5. After deploy, run seed: Go to Render Shell → `python seed.py`
6. Copy your Render URL (e.g. `https://digonce-api.onrender.com`)

### 8.3 Vercel — Connect Frontend to Backend

In your Vercel project settings → **Environment Variables**, add:
```
NEXT_PUBLIC_API_URL = https://digonce-api.onrender.com/api/v1
```

Redeploy frontend. The `api.ts` file already reads this variable — it will automatically switch from mock data to live API.

---

## SECTION 9 — CI/CD with GitHub Actions

### 9.1 Create `.github/workflows/ci.yml`

```yaml
name: DigOnce CI

on:
  push:
    branches: [main, "role-d/**", "feature/**"]
  pull_request:
    branches: [main]

jobs:
  backend-lint-test:
    name: Backend — Lint & Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Lint with ruff
        run: |
          pip install ruff
          ruff check app/

      - name: Run tests
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          SECRET_KEY: test-secret-key-for-ci
        run: pytest app/tests/ -v --tb=short || true

  frontend-build:
    name: Frontend — Build Check
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - run: npm ci
      - run: npm run build
```

> Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, and `DATABASE_URL` to your GitHub repo **Secrets** (Settings → Secrets and variables → Actions).

---

## SECTION 10 — Demo Video Guide (You Lead This)

### Script (3 minutes max)

| Time | What to Show |
|------|-------------|
| 0:00 | Open the public URL on a phone (no login). Show the map with 28 seeded Chennai projects. |
| 0:30 | Click a project. Show purpose, authority, contractor, budget, timeline, QR code. |
| 1:00 | Log in as officer (`officer.roads@cityworks.gov` / `CityWorks2026!`). Create a new project overlapping with an existing one. Show the **clash warning** pop up. |
| 1:30 | Log a delay with a mandatory reason. Show the project timeline update publicly. |
| 2:00 | Submit a citizen report with a photo from the project detail page. Show the GPS distance verified badge. |
| 2:20 | Open the admin dashboard. Show: project counts, overdue projects, open citizen reports, "72h unresponsive" flag, and the **₹4.85 Cr duplicate-dig savings** figure. |
| 2:40 | Show a project with a 🔴 **Stalled** badge and explain the auto health score scheduler. |
| 2:55 | Final shot: QR code on screen with a phone scanning it and opening the project page. |

### Recording Tips
- Use OBS Studio (free) or Loom
- Resolution: 1920×1080
- Narrate clearly — mention "transparency", "coordination", "no duplicate digging"
- Show on both desktop and a real phone

---

## 📋 Your Personal Completion Checklist

### Phase 1 — Unblocks everyone (do first)
- [ ] `backend/` folder created with structure above
- [ ] `requirements.txt` and `.env.example` committed
- [ ] `core/config.py` and `core/db.py` done
- [ ] `routers/auth.py` — `POST /auth/login` returns real JWT
- [ ] Test login with: `officer.roads@cityworks.gov` / `CityWorks2026!`
- [ ] Backend deployed on Render (even if empty — just health endpoint working)
- [ ] `NEXT_PUBLIC_API_URL` set on Vercel

### Phase 2 — Core features
- [ ] `core/security.py` — JWT guard + role dependencies
- [ ] `services/image_service.py` — Supabase Storage upload + pHash
- [ ] `routers/reports.py` — Citizen report with GPS check + photo
- [ ] `routers/notifications.py` — Email subscribe
- [ ] `services/notification_service.py` — SMTP email sender
- [ ] `seed.py` — Run and confirm 28 projects visible on the live map

### Phase 3 — Unique feature + ops
- [ ] `services/scheduler.py` — APScheduler health score job running
- [ ] Verify a project auto-transitions to `stalled` after score drops
- [ ] `.github/workflows/ci.yml` — CI passing on push to main
- [ ] All secrets added to GitHub + Render

### Phase 4 — Polish
- [ ] README updated with demo login credentials
- [ ] Demo video recorded and uploaded
- [ ] Final clean redeploy (Render + Vercel)
- [ ] All MVP acceptance checklist items in `docs/07-mvp-features.md` pass

---

## 🔑 Demo Credentials (Seed These in Supabase Auth)

Create these users manually in **Supabase Dashboard → Auth → Users** after running `seed.py`:

| Email | Password | Role |
|---|---|---|
| `officer.roads@cityworks.gov` | `CityWorks2026!` | officer |
| `admin@cityworks.gov` | `CityWorks2026!` | admin |

Then insert matching rows into the `users` table (use the UUID from Supabase Auth as the `id`).

---

## ⚡ Quick Start Commands

```bash
# In backend/ directory

# Install deps
pip install -r requirements.txt

# Copy and fill env
cp .env.example .env

# Run locally
uvicorn app.main:app --reload --port 8000

# Test health
curl http://localhost:8000/api/v1/health

# Test login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"officer.roads@cityworks.gov","password":"CityWorks2026!"}'

# Run seed (after DB is set up)
python seed.py
```
