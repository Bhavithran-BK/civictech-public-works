# 📋 DigOnce — Problem Statement & Solution Plan

> **Hackathon Track:** CivicTech — Improving Transparency and Coordination in Public Works Projects  
> **Project Name:** DigOnce  
> **Team:** A (Citizen Frontend) · B (Dept Frontend) · C (Backend Core) · D (Backend Ops)

---

## 🔴 The Problem Statement (Exactly as Given)

> *"Residents see roads dug up, drains under repair, and pipelines being laid in their neighbourhoods every day. These projects are carried out by different municipal and utility departments and contractors. Residents have little information about what is being done, who is responsible, or how long it will take, and the departments themselves often work without knowing what others have planned.*
>
> *Information about ongoing and planned public works is scattered across offices, notice boards, and informal sources, and rarely reaches the people it affects. Residents cannot tell the purpose, timeline, or responsible authority of a project, or why it is delayed. Poor coordination means the same road may be dug up several times in a few months by different departments. When work stalls or is done badly, there is no simple way to follow up, verify progress, or hold anyone accountable. Deadlines slip without explanation, and residents have no reliable way to plan around disruptions.*
>
> *Prolonged and repeated construction causes traffic problems, safety hazards, business losses, and daily inconvenience. Wasted public money from poor coordination and duplicated work goes unnoticed. Without transparency, trust in local authorities falls, and residents feel unheard. Authorities also lose the chance to use citizen feedback to catch problems early."*

---

## 🎯 The Two Core Demands from the PS

The judges are scoring on **two words**. Everything we build must map to them:

| Demand | Meaning |
|---|---|
| **Transparency** | Residents can see what is happening, by whom, and why — publicly |
| **Coordination** | Departments know each other's plans and avoid duplicated work |

---

## 💡 Our Solution — DigOnce

**One-line pitch:**  
*A live public map of every road, drain, and pipeline project — with a shared planner that stops departments from digging the same road twice, and a citizen verification loop that holds delays accountable.*

---

## 🔗 Problem → Solution Mapping (Point by Point)

| # | What the PS Says | What DigOnce Does |
|---|---|---|
| 1 | "Residents have little information about what is being done" | **Public map** — every project visible on a live map, no login needed |
| 2 | "Who is responsible" | **Project detail page** shows department name, officer, contractor |
| 3 | "How long it will take" | Start date, end date, delay log with reasons — all public |
| 4 | "Why it is delayed" | **Mandatory delay reason** — a delay cannot be saved without a written reason |
| 5 | "Departments work without knowing what others have planned" | **Conflict Engine** — PostGIS `ST_DWithin` detects when 2 depts plan on the same road |
| 6 | "Same road may be dug up several times" | **Dig-Once checker** — flags spatial + date overlap and suggests a joint work window |
| 7 | "No simple way to follow up or verify progress" | **Citizen check-in** — geo-tagged photo report (progress verified / no activity / safety hazard) |
| 8 | "Hold anyone accountable" | **Health Score + Stalled badge** — auto-flags stalled projects publicly on the map |
| 9 | "Residents have no reliable way to plan around disruptions" | **QR code on site boards** — scan to see purpose, timeline, and delay reason |
| 10 | "Wasted public money goes unnoticed" | **Duplicate-dig savings metric** on the authority dashboard — shows ₹ saved by avoided re-digging |
| 11 | "Authorities lose the chance to use citizen feedback" | Citizen reports feed the health score and appear on the authority dashboard with 72-hr alert |

---

## 🏗️ What We Are Building — Feature by Feature

### Feature 1 — Public Map & Project List *(Person A)*
- Interactive map (MapLibre + OSM tiles, free, no API key)
- Every project shown as a colour-coded pin: 🟢 On Track · 🟡 At Risk · 🔴 Delayed · ⚫ Stalled
- Filter by project type (road, drain, pipeline, electrical, telecom), department, and status
- Works on mobile, no login needed

### Feature 2 — Project Detail Page *(Person A)*
- Purpose, authority name, contractor, budget, start/end dates
- Live timeline of official updates
- Delay log (with mandatory reasons)
- Citizen report feed
- Shareable URL
- QR code that opens this page (for physical site boards)

### Feature 3 — Department Login & Project Management *(Person B)*
- Secure login for officers and admins (roles: `public`, `officer`, `admin`)
- Create a new project with: title, type, location on map, contractor, budget, dates
- Edit project details and log official progress updates
- Log a delay — reason field is **mandatory**, enforced on both frontend and backend

### Feature 4 — Conflict Engine *(Person C)*
- Runs automatically when a project is created or dates/location are changed
- Uses **PostGIS `ST_DWithin`** to check if any project is within 50m on the same road
- Checks **date overlap** — are both projects active at the same time?
- Also checks "recently dug" — was the road finished within the last 90 days?
- Shows a warning to the officer: which projects clash, and a **suggested joint window**
- Analytics dashboard counts how many conflicts were prevented (= taxpayer money saved)

### Feature 5 — Citizen Check-in & Report *(Person A + D)*
- Anonymous report — no account needed
- Types: ✅ Progress Verified · ❌ No Activity · ⚠️ Safety Hazard
- Photo upload (optional)
- **Server-side GPS distance check** — citizen must be within 500m of the project site
- Perceptual hash (pHash) checks if the same photo is submitted multiple times
- Rate limited per IP to prevent spam

### Feature 6 — Health Score & Auto-Stall *(Person C + D)*
- Each project has a score from 0–100 (starts at 100)
- Score drops for: days past planned end date, "no activity" citizen reports, days since last official update
- Thresholds: ≥ 70 = On Track · 40–69 = At Risk · < 40 = Delayed
- If score < 40 AND no update for 7+ days AND past end date → **Stalled** (public red badge)
- **🤖 Auto Health Scheduler (Person D's unique feature):** APScheduler job runs every 30 minutes, recalculates all scores, auto-transitions statuses, emails department when their project is newly stalled

### Feature 7 — Email Subscriptions & Notifications *(Person D)*
- Residents can subscribe to a project by email
- Get notified when: a new official update is posted, a new citizen report is filed
- If a citizen report has no official response in 72 hours → **highlighted on the dashboard**

### Feature 8 — Authority Dashboard *(Person B + C)*
- Project counts by status (on track, at risk, delayed, stalled, completed)
- Overdue projects list
- Open citizen reports count
- 72-hour unresponsive reports flag
- **Duplicate-dig savings estimate in ₹** — calculated from conflicts prevented × avg re-dig cost

### Feature 9 — Seeded Demo Data *(Person D)*
- 28 realistic Chennai projects inserted in the live database
- Real department names (GCC Roads, CMWSSB, TANGEDCO, etc.)
- Intentional clashes between projects (so judges see the conflict engine work)
- Mix of statuses: on track, at risk, delayed, stalled, completed
- Judges see a live, working product with no setup

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js (TypeScript) + Tailwind CSS | Fast to build, looks clean |
| Map | MapLibre GL + OpenStreetMap tiles | Free, no API key needed |
| Backend | FastAPI (Python) | Real technical depth for judges |
| Database | Supabase — Postgres + PostGIS | Geo queries, no infrastructure setup |
| Auth | Supabase Auth (JWT) | Secure, built-in |
| File Storage | Supabase Storage | Photo uploads |
| Frontend Hosting | Vercel | Public URL, free |
| Backend Hosting | Render | Public URL, free |
| Background Jobs | APScheduler (Python) | Auto health score every 30 mins |

---

## 👥 Who Uses DigOnce

```
Citizens / Residents
   └─ View the public map, project details, QR site boards
   └─ Submit geo-tagged reports with photos

Department Officers
   └─ Log in, create projects, post updates, log delays (with reasons)
   └─ Get warned when a conflict is detected
   └─ Receive stalled alerts by email

City Admins / Commissioners
   └─ See the full dashboard: overdue, stalled, citizen reports, savings
   └─ Spot coordination failures across departments

Contractors
   └─ Are named publicly on the project page → accountability
```

---

## 🏆 How We Win the Judging Criteria

| Criterion | Weight | Our Answer |
|---|---|---|
| **Innovation (20%)** | | Conflict engine + citizen verification loop + auto-scheduler + QR site boards — none of this exists in current municipal systems |
| **Technical Depth (35%)** | | PostGIS spatial queries, JWT auth, image hashing, APScheduler, rate limiting, Pydantic validation, edge case handling |
| **Feasibility (20%)** | | Start with 1 ward + 1 department, CSV import of existing records. Already used tech (Postgres, Next.js). No new infrastructure for the city |
| **Demo Video (15%)** | | 3-minute scripted demo: map → conflict warning → citizen report → stalled badge → dashboard savings |
| **Deployment (10%)** | | Vercel + Render public URLs, seeded data, demo login in README, `/health` endpoint |

---

## 🗺️ Architecture at a Glance

```
[Citizen / Browser]
       │
       ▼
[Next.js Frontend on Vercel]
       │  HTTPS REST calls
       ▼
[FastAPI Backend on Render]
   ├── /auth/login         ← Person D
   ├── /projects           ← Person C
   ├── /projects/conflict-check  ← Person C
   ├── /projects/{id}/reports    ← Person D (GPS + photo)
   ├── /projects/{id}/subscribe  ← Person D
   ├── /dashboard/summary  ← Person C
   └── 🤖 APScheduler      ← Person D (health score every 30 min)
       │
       ▼
[Supabase — Postgres + PostGIS + Auth + Storage]
   ├── departments, users, projects
   ├── project_updates, delays, reports, subscriptions
   ├── PostGIS: geom (LineString), centroid (Point)
   └── Storage: citizen report photos
```

---

## ✅ Definition of Done (Before Submission)

- [ ] Public map loads on a phone with no login and shows coloured project pins
- [ ] Creating an overlapping project shows the clash warning with clashing project details
- [ ] Citizen can submit a geo-tagged report with a photo from the project page
- [ ] Enough "no activity" reports flip a project to **Stalled** (visible on map)
- [ ] Delay cannot be saved without a reason — error shown to user
- [ ] QR code on the project detail page opens the correct URL when scanned
- [ ] Dashboard numbers match the actual data in the database
- [ ] Demo login credentials are in the README
- [ ] Both Vercel and Render URLs are public and accessible without login
- [ ] `GET /api/v1/health` returns `{ "status": "ok" }`
- [ ] 28 seeded projects visible, including at least 3 clashes and 2 stalled projects
- [ ] Demo video is recorded and uploaded (3 minutes, 1080p, narrated)

---

## 📅 24-Hour Timeline Summary

| Hours | What Gets Done |
|---|---|
| 0 – 2 | Schema, API spec, mock data agreed by whole team. Repo + CI set up. Empty deploys live. |
| 2 – 8 | **A:** Map + project detail. **B:** Login + project form. **C:** CRUD APIs + auth. **D:** Seed data + image upload |
| 8 – 14 | Conflict engine live, citizen report flow, health score, first real frontend → API integration |
| 14 – 18 | Dashboard, notifications, QR, auto-scheduler. **Feature freeze at hour 18** |
| 18 – 21 | Bug bash on deployed link, mobile testing, README polish |
| 21 – 23 | Demo video recorded (D leads). Clean redeploy. |
| 23 – 24 | Buffer. Do not touch code unless something is broken. |
