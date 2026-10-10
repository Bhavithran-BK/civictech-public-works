# 06 - Frontend Structure and UI Format Rules

## Folder layout
```
frontend/src/
  app/         (citizen)/, (dept)/ route groups
  components/  ui/, map/, project/
  lib/         api.ts (single typed client), types.ts
  hooks/
```

## Code rules
1. **Only `lib/api.ts` calls the backend.** No `fetch` scattered in components.
2. **Types generated from `openapi.yaml`.** Don't hand-write API types twice.
3. Every page handles **loading, empty and error** states.
4. TypeScript strict mode on. No `any` unless commented.
5. Shared components go in `components/`; page-only components stay next to the page.

## UI format rules
- **Mobile-first.** Residents use phones. Test at 375px width.
- **Fixed status colours everywhere:**
  - Green: On track
  - Yellow: At risk
  - Red: Delayed
  - Grey/white: Planned
  - Blue: Completed
- **Status is never colour only.** Always pair with an icon and a text label.
- **Every project card shows the same five fields:** What, Who, When, Status, Why-delayed.
- One font, one primary colour. Define design tokens in `tailwind.config`.
- Use **shadcn/ui components only**. No custom one-off buttons or modals.
- Accessible basics: labels on inputs, sufficient contrast, keyboard focusable.

## Pages

### Citizen (no login)
| Route | Content |
|---|---|
| `/` | Map + list, filters, status colours |
| `/projects/[id]` | Detail, timeline, delay log, photos, QR, subscribe, report button |
| `/projects/[id]/report` | Check-in form: photo, auto-location, type |

### Department (login)
| Route | Content |
|---|---|
| `/dept/login` | Login |
| `/dept/projects/new` | Create form with live conflict warning |
| `/dept/projects/[id]/edit` | Update, log delay (reason required) |
| `/dept/dashboard` | Counts, overdue, open reports, duplicate-dig savings |

## Client-side must-dos
- Compress photos before upload.
- Request geolocation with a clear prompt and a fallback if denied.
- Debounce map filter queries.
