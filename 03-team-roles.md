# 03 - Team Roles (all working in parallel from hour 0)

| Member | Role | Owns |
|---|---|---|
| **A** | Citizen frontend | Map home, project detail page, report/verify flow, QR page |
| **B** | Department and admin frontend | Login, project create/edit, conflict warnings, analytics dashboard |
| **C** | Backend core | DB schema, CRUD APIs, conflict engine, health score |
| **D** | Backend support and ops | Auth and roles, image upload and verification, notifications, seed data, deployment, CI, demo video |

## Hour 0 to 2: write the contracts together
Everyone sits together and produces:
1. **DB schema** (`schema.sql`)
2. **API spec** (`openapi.yaml`)
3. **Mock data** (`mock-data.json`)

Frontend members (A, B) then build against the mock data until C's API is live, so nobody blocks anyone.

## Handoff points
- C -> A/B: live API on the deployed backend by hour 8.
- D -> A/B: seed data and image upload endpoint by hour 8.
- A <-> B: shared components live in `components/ui` and `components/project`. Agree on names before building.

## Communication
- One group chat, plus a 5-minute sync every 3 hours (what's done, what's blocked).
- Blockers are raised immediately, not at the next sync.
