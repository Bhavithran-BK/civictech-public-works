# 09 - Edge Cases to Handle (this is where the 35% technical score is won)

## Geometry and conflicts
- Overlapping or duplicate projects.
- Projects spanning several road segments: store geometry as a **LineString**, not just a point.
- Date changes after a conflict warning: re-run the check.
- Project finished recently near a new planned one: flag as "recently dug".

## Citizen reports
- Photo taken far from the site: reject or mark **unverified** using GPS distance.
- Reused photos: hash check (perceptual hash) against previous reports.
- EXIF time that does not match the upload time: flag.
- Spam: rate limit per IP and device.
- Location permission denied: allow manual pin on map, mark as lower trust.
- Duplicate reports from the same device within a short window: collapse into one.

## Data and process
- Delay logged without a reason: reject with a clear error.
- End date earlier than start date: validation error.
- Officer editing a project from another department: forbidden.
- Project with no updates for N days: auto-set Stalled.

## Network and device
- Slow or offline mobile: compress images client-side, show retry.
- Large uploads: enforce max size and allowed types server-side.

## Security basics
- JWT verification on every officer endpoint.
- Sanitise all text fields.
- Don't expose citizen emails or phone numbers publicly.
- CORS restricted to the frontend origin.

## Tests to write
- Conflict engine: overlap, no overlap, recently finished, boundary distance.
- Health score: each penalty individually and combined, threshold edges.
