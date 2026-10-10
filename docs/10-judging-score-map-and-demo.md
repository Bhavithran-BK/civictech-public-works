# 10 - Judging Score Map, Demo Video and Deployment

## Score map

| Criterion | Weight | How we win it |
|---|---|---|
| Innovation | 20% | Conflict engine, verification loop, QR site boards |
| Technical implementation | 35% | PostGIS queries, layered backend, tests, validation, edge cases (file 09) |
| Feasibility | 20% | Rollout note for municipal departments, CSV import of existing records, roadmap (SMS, ward analytics, open-data API) |
| Video presentation | 15% | Tight 3-minute scripted demo (below) |
| Deployment / hosting | 10% | Public links, seeded data, demo login in README, health-check endpoint |

## Feasibility one-pager (include in README)
- **Who uses it:** municipal departments, utilities, contractors, residents.
- **Adoption path:** start with one ward and one department, import their existing project list by CSV, expand ward by ward.
- **Scale:** PostGIS indexes, paginated APIs, bounding-box map queries.
- **Reliability:** health endpoint, error shape, rate limiting.
- **Future:** SMS and WhatsApp check-ins, ward-level analytics, public open-data API, contractor performance ratings.

## Demo video script (about 3 minutes)

| Time | Scene |
|---|---|
| 0:00-0:20 | **Problem.** Roads dug repeatedly, no information, no accountability |
| 0:20-1:00 | Department officer creates a project. **Clash warning appears** with a suggested joint window |
| 1:00-1:40 | Citizen scans the QR on the site board, sees project info, submits a **"no activity"** report with photo |
| 1:40-2:15 | Health score drops and project flips to **Stalled**. Dashboard updates, showing open reports and duplicate-dig savings |
| 2:15-2:40 | Log a delay: reason is mandatory and the public timeline updates |
| 2:40-3:00 | Impact and roadmap |

Tips: record at 1080p, use the deployed link (not localhost), keep narration clear, and show the mobile view for the citizen flow.

## Deployment checklist
- [ ] Frontend on Vercel with a public URL
- [ ] Backend on Render with a public URL
- [ ] `GET /api/v1/health` returns ok
- [ ] Supabase seeded with 25 to 30 realistic projects, including at least 3 clashes and 2 stalled projects
- [ ] Demo officer login in README (email and password)
- [ ] README has: pitch, architecture diagram, setup steps, demo credentials, feasibility note
- [ ] Final clean redeploy at hour 22
- [ ] Open the public link on a fresh phone and a fresh browser before submitting
