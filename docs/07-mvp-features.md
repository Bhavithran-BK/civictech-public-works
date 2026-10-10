# 07 - MVP Feature List

## Must-have (ship all of these)

1. **Public map and list** of projects with status colours, plus filters by type (road, drain, pipeline), department and status.
2. **Project detail page** with purpose, authority, contractor, budget, start and end dates, timeline of updates, delay log and photos. Shareable URL and a QR code.
3. **Department login** (roles: admin, department officer) to create and update projects and log delays with a **mandatory reason**.
4. **Conflict engine**, run when a project is created: PostGIS `ST_DWithin` plus date-range overlap. Shows a warning with clashing projects and a suggested joint window.
5. **Citizen check-in and report.** Anonymous or phone/email, with photo, location and a type (progress verified, no activity, safety hazard). Server-side GPS distance check against the project.
6. **Health score and auto-flag** based on schedule slippage, citizen "no activity" reports and days since last update. Stalled projects show a public **Stalled** badge.
7. **Follow-up thread.** Residents can subscribe by email to a project's updates. A report with no official response in 72 hours is highlighted on the dashboard.
8. **Authority dashboard** with counts by status, overdue projects, open citizen reports, and **duplicate-dig savings** (estimated cost of avoided repeat work).
9. **Deployed with seeded demo data:** 25 to 30 realistic projects with real-looking clashes, so judges see everything with no setup.

## Nice-to-have (only after the MVP is stable)
- Telegram/WhatsApp bot for check-ins
- Multilingual UI (Tamil, Hindi, English)
- Upvoting reports
- Public contractor performance page

## Do not build
- Payments
- Native mobile apps
- ML anything
- Complex user profiles

## MVP acceptance checklist
- [ ] Public link works on a phone with no login
- [ ] Map shows seeded projects with correct colours
- [ ] Creating an overlapping project shows a clash warning
- [ ] Citizen can submit a geo-tagged report with a photo
- [ ] Enough "no activity" reports flip a project to Stalled
- [ ] Delay cannot be saved without a reason
- [ ] QR code opens the right project page
- [ ] Dashboard numbers match the data
- [ ] Demo login is in the README
