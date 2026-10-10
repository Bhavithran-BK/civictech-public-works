# 04 - Git and Workflow Rules

## Branching
- `main` is protected and **always deployable**.
- Short-lived branches named `feat/<area>-<thing>`, e.g. `feat/map-filters`, `fix/report-gps-check`.
- Never push directly to `main`.

## Pull requests
- Every merge goes through a PR.
- One reviewer who is **not** the author.
- Merge at least **every 2 hours**. Long-lived branches cause hour-20 disasters.
- If a PR sits unreviewed for 20 minutes, ping the group.

## Commits
Conventional commits:
- `feat:` new feature
- `fix:` bug fix
- `chore:` tooling, config, docs
- `test:` tests

## Repo layout
```
digonce/
  backend/
  frontend/
  docs/            (openapi.yaml, schema.sql, mock-data.json, these plan files)
  README.md
```

## CI (set up in the first 2 hours)
- Backend: lint + pytest on every PR.
- Frontend: type-check + build on every PR.
- Auto-deploy `main` to Vercel and Render.

## Definition of done for any task
1. Works on the deployed link, not just localhost.
2. Handles loading, empty and error states.
3. Reviewed and merged to `main`.

## Feature freeze
**Hour 18.** After that: bug fixes only.
