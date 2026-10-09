# 02 - Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (TypeScript) + Tailwind + shadcn/ui + MapLibre (OSM tiles) | Fast to build, free maps, no API keys |
| Backend | FastAPI (Python) | Real backend logic scores on technical depth |
| DB, auth, files | Supabase (Postgres + PostGIS, Auth, Storage) | Geo queries and photo storage with no setup |
| Hosting | Vercel (frontend), Render (backend) | Public links for judges, no setup on their side |
| Extras | QR generation (`qrcode`), Pillow (image hashing), pytest | Small, quick wins |

## Decisions locked (don't revisit during the hackathon)
- PostGIS for all distance and overlap queries (`ST_DWithin`, `ST_Intersects`).
- Project location stored as a **LineString** (road segment), with a centroid point for map pins.
- Auth via Supabase JWT, verified in FastAPI.
- No ML, no payments, no native mobile app.

## Environment variables
Commit a `.env.example` in both `backend/` and `frontend/`. Never commit real secrets.
