# 05 - Backend Code Structure and Rules

## Folder layout
```
backend/app/
  main.py
  core/        config.py, security.py, db.py
  models/      SQLAlchemy models
  schemas/     Pydantic request/response
  routers/     projects.py, reports.py, departments.py, auth.py
  services/    conflict_engine.py, health_score.py, notifications.py
  tests/
```

## Rules
1. **Thin routers.** Routers parse input, call a service, return output. Business logic lives in `services/`.
2. **Versioned API.** Every endpoint is under `/api/v1/...`.
3. **Validate everything** with Pydantic schemas (request and response).
4. **Uniform errors:**
   ```json
   { "error": { "code": "CONFLICT_DETECTED", "message": "Human readable text" } }
   ```
5. **Config in env vars**, loaded in `core/config.py`. Commit `.env.example`.
6. **Roles** enforced via dependency injection in `core/security.py`: `public`, `officer`, `admin`.
7. **Tests only for core logic:** `conflict_engine` and `health_score`. They are the heart of the product.
8. **Health endpoint:** `GET /api/v1/health` returns `{ "status": "ok" }`.
9. **Rate limiting** on public report endpoints (per IP and device id).

## Core tables (outline)
- `departments` (id, name, type)
- `users` (id, department_id, role)
- `projects` (id, title, purpose, type, department_id, contractor, budget, start_date, end_date, status, geom LineString, centroid Point)
- `project_updates` (id, project_id, author_id, note, created_at)
- `delays` (id, project_id, reason, old_end_date, new_end_date, created_at)
- `reports` (id, project_id, kind, photo_url, photo_hash, lat, lng, distance_m, verified, created_at)
- `subscriptions` (id, project_id, email)

## Endpoint list (v1)
| Method | Path | Who |
|---|---|---|
| GET | `/projects` (filters: type, dept, status, bbox) | public |
| GET | `/projects/{id}` | public |
| POST | `/projects` | officer |
| PATCH | `/projects/{id}` | officer |
| POST | `/projects/{id}/delays` | officer |
| POST | `/projects/{id}/updates` | officer |
| POST | `/projects/{id}/reports` | public |
| POST | `/projects/{id}/subscribe` | public |
| POST | `/projects/conflict-check` | officer |
| GET | `/dashboard/summary` | officer/admin |
| GET | `/projects/{id}/qr` | public |

## Conflict engine logic
1. Input: geometry, start_date, end_date.
2. Query projects where `ST_DWithin(geom, new_geom, X metres)`.
3. Filter by date overlap, or finished within the last Y months.
4. Return clashing projects and a suggested joint window.
5. Re-run whenever dates or geometry change.

## Health score logic (0 to 100)
Start at 100, subtract for:
- schedule slippage (days past planned end),
- verified "no activity" citizen reports,
- days since last official update.

Thresholds: >=70 on track, 40-69 at risk, <40 delayed. No activity for N days sets the public **Stalled** badge.
