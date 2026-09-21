# Pre-deployment validation — 2026-09-20

## Scope

This pass completes the launch work that can be performed locally without provisioning staging or production. It uses the approved repository content plus a read-only local fixture API. No deployment, DNS, production database, Cloudinary, or Resend state was changed.

## Completed work

- Rechecked Home, Projects, About, CV, Contact, and project-detail behavior at 320 × 640, 390 × 844, 768 × 1024, and 1366 × 768. No tested route had horizontal document overflow or more than one `main` landmark.
- Fixed the 320 px inner-page navigation so all four links remain available.
- Added six route-level axe smoke audits and corrected nested landmarks, project-filter semantics, form error associations, live form status, external-link announcements, image sizing/loading hints, and carousel accessible names/touch targets.
- Verified keyboard order at 320 px from the skip link through navigation and primary content actions. Invalid Contact submission moves focus to Name and exposes associated errors for Name, Email, Subject, and Message.
- Split inner routes into lazy chunks. The initial JavaScript fell from about 463.59 kB / 143.97 kB gzip to 311.92 kB / 99.26 kB gzip. Route CSS is also loaded per page.
- Deferred the 971.86 kB / 261.80 kB gzip WebGL scene until genuine pointer, touch, wheel, or keyboard interaction. The static poster is the initial and constrained-device experience.
- Removed duplicate emitted Draco decoder assets while retaining the reviewed local decoder files.
- Subset the scene's Inter variable TTF from 876,576 bytes to 168,344 bytes. The upstream file and tooling are retained only in ignored local working files; provenance and hashes are recorded beside the public font.
- Added `robots.txt` and a canonical sitemap for the five public top-level routes.
- Updated Express, Mongoose, Morgan, Multer, express-rate-limit, and affected transitive packages to fixed releases. The Express 5 migration keeps MongoDB-operator sanitization in the query parser and uses an Express 5-compatible validated-query override.
- Moved the obsolete design ZIP to the ignored, recoverable `.local/archive` area.

## Automated evidence

| Check | Result |
| --- | --- |
| Backend Node tests | 91 passed |
| Frontend Node tests | 9 passed |
| Frontend Vitest tests | 70 passed across 11 files, including six axe route audits |
| Frontend lint | Passed with zero warnings |
| Frontend production build | Passed; 256 modules transformed |
| Frontend and backend `npm ci` | Passed from a temporary clean checkout |
| Frontend and backend `npm audit` | Zero known vulnerabilities |
| Clean-checkout regression | Same 9 + 70 frontend tests, build/lint, and 91 backend tests passed |

The jsdom axe pass intentionally excludes color-contrast calculation because jsdom does not provide reliable computed visual contrast. Contrast remains covered by Lighthouse and the manual browser/device matrix.

## Browser evidence

Lighthouse 13.5.0 was run against the local production preview with the read-only fixture API. Reports are intentionally stored under ignored `.local/lighthouse-reports` because they contain machine-specific traces.

| Route / form factor | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home / mobile | 87 | 100 | 100 | 100 | 2.8 s | 3.1 s | 0 ms | 0 |
| Projects / mobile | 84 | 100 | 100 | 100 | 2.7 s | 3.4 s | 90 ms | 0 |
| Contact / mobile | 86 | 100 | 100 | 100 | 2.8 s | 3.2 s | 0 ms | 0 |
| Home / desktop | 100 | 100 | 100 | 100 | 0.6 s | 0.6 s | 0 ms | 0.023 |

The first mobile Home audit loaded the WebGL scene and produced 57–70 seconds of blocking work under synthetic throttling. The interaction-deferred implementation removed the scene request from initial navigation and reduced that audit to the recorded result. Mobile LCP still misses the plan's performance budget; this is an accepted open performance item pending representative physical-device and hosted CDN measurements, not evidence of a passing Phase 4 gate. Lighthouse scores varied between repeated runs on this local host, so raw reports and individual metrics—not a single score—remain the evidence of record.

## Work that still requires external inputs or deployment

1. Confirm that the exposed Atlas database-user password has been rotated and the ignored `backend/.env` URI updated.
2. Run an encrypted `mongodump`, restore it into an isolated temporary database, smoke the restored API, and remove the temporary database.
3. Configure `RESEND_API_KEY`, `CONTACT_NOTIFY_EMAIL`, and the approved sender, then submit one labelled Contact message and verify both database storage and inbox delivery.
4. Upload/seed the approved CV and profile media only after the verified backup gate.
5. Run the physical matrix on actual Android Chrome and iPhone Safari, plus NVDA and VoiceOver. Include 200% zoom, reduced motion, Data Saver/slow network, battery saver, orientation, background/foreground, thermal behavior, and WebGL context-loss recovery.
6. Provision staging, repeat integration and performance tests against hosted origins/CDN behavior, configure caching headers, and complete release-candidate/rollback and production phases.

## Gate decision

All safe local work identified for this pass is complete. Phase 1 is not closed because credential rotation, backup/restore, and real Contact delivery remain unverified. Phases 2–8 remain gated by hosting, physical-device evidence, and production authority.
