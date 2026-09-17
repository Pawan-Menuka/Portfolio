# Phase 1 repeat — expanded frontend integration review

Executed: 2026-09-14 (Asia/Colombo)

Status: **Blocked — the repeat verification is complete, but the Phase 1 exit criteria are not yet met. Phase 2 has not started.**

This report is the current Phase 1 evidence for `PHASE_0_REBASELINE_2026-09-14.md`. The earlier `PHASE_1_INTEGRATION_REPORT.md` remains historical evidence from before the frontend expansion.

## Test topology

The repository still has no provisioned staging host or deployment-provider configuration. The repeat therefore used the plan's local production-preview topology:

- Backend: `NODE_ENV=production`, `http://localhost:5000`, connected to the database configured by the ignored backend `.env`.
- Frontend: lockfile-clean dependencies, compiled with `VITE_API_URL=http://localhost:5000/api/v1`, served by Vite preview at `http://localhost:5173`.
- CORS: exact permitted origin `http://localhost:5173`.
- Browser: compiled application exercised in the Codex in-app browser.

This proves the production-shaped application locally. It does not replace staging HTTPS, DNS, platform proxy, contact delivery, or deployment health-check evidence.

## API and compiled-page matrix

| Capability | API result | Compiled frontend result | Status |
| --- | --- | --- | --- |
| Liveness | `GET /health` -> 200 | Not applicable | Pass |
| Readiness | `GET /ready` -> 200, database connected | Data-dependent pages settle | Pass locally |
| Profile | Supported text, social, availability, and SEO fields returned | Home, About, CV, and Contact consume the live profile | Partial: avatar and OG image absent |
| Projects | Six published rows; page 1, limit 100, total 6, one page | Six-position project deck and every section filter work | Pass |
| Project detail | All six approved slugs -> 200; missing slug -> 404 | Every case study renders; missing project shows recovery state | Pass |
| Skills | 42 ordered rows; every category is in the backend taxonomy | About groups render after loading | Pass |
| Certifications | Empty array | No certification group is rendered | Needs content-owner decision |
| CV | Resume is absent | Explicit `CV not available yet` state; no broken PDF link | Blocked: final PDF absent |
| Contact validation | Invalid fields -> 400 | Empty submit shows three field errors and focuses Name | Pass |
| Contact honeypot | Generic 201; labelled address stored zero times | Honeypot behavior is covered by the passing suite | Pass |
| Contact rate limit | Controlled sixth request -> 429 | 400/429/500/timeout retained-text states are covered by tests | Pass locally |
| Contact storage and notification | Not exercised with a real visitor-shaped message | No real browser submission performed | Blocked: backup gate and Resend settings absent |

## Routes and browser evidence

- Direct navigation completed for `/`, `/projects`, `/about`, `/cv`, `/contact`, all six `/projects/:slug` routes, a missing project slug, and an unknown route.
- Direct refresh of a project detail route succeeded.
- Back/forward navigation restored project detail and About with their resolved titles.
- All, Full-stack, Blockchain, Distributed Systems, Hardware / CNC, and Music filter controls selected correctly.
- Filter results were Full-stack 2, Blockchain 1, Distributed Systems 1, Hardware / CNC 2, and Music an intentional empty state.
- The All deck exposes six navigation positions. Its visual carousel intentionally mounts only the current card and two neighbours on each side.
- With the API stopped, Projects displayed `Unable to reach portfolio data. Please try again.` and a `Try again` control. After backend recovery, retry restored the six-position deck and removed the alert.
- No checked page retained a data-loading state, displayed a broken image, or emitted a browser error.
- The compiled homepage exposes all six journey checkpoints through Contact. Its 3D scene still emits the known dependency-level `THREE.Clock` deprecation warning from React Three Fiber; application code does not access the deprecated clock state.

## Project integrity and external links

- Live MongoDB and `backend/data/projects.seed.json` now contain the same six slugs.
- The prior CNC defects are resolved:
  - CNC Steel Clamp now describes steel and uses `Steel`, `CNC`, `CAM`, and `Machining` tags.
  - CNC Aluminum Clamp describes 6061 aluminum and uses the corresponding tag.
  - Both CNC link objects are empty, and the frontend omits source/live/demo controls instead of rendering placeholder links.
- Four GitHub repository links and the Impromptu live-site link returned HTTP 200 on 2026-09-14.
- Every public project/detail, skill, and certification payload checked is free of internal `__v` metadata.
- A `status=draft` query cannot expose draft projects; the backend test suite also verifies a draft detail returns 404.
- Markdown sanitization, unsafe-link rejection, malformed envelopes, empty optional fields, missing media, and contact retained-text failure states are covered by the passing frontend suite.

## Profile, CV, skills, and certifications

- The public profile name and all supported seeded text/social fields are present. The biography and authored CV sections render.
- Avatar, Open Graph image, and resume are absent. The UI provides intentional avatar/CV fallbacks and no broken asset link.
- All 42 skill rows use an allowed category (`software`, `blockchain`, `engineering`, or `creative`); the current data uses the software and blockchain subsets.
- Certification data remains empty. The owner must confirm that omission is intentional or provide approved records.
- The final CV cannot be tested for filename, public access, currency, or the 5 MB limit until the approved PDF is supplied and uploaded after the backup gate.

## Contact and message evidence

- A uniquely labelled honeypot request returned 201 and produced zero stored rows.
- Invalid name, email, and body fields returned 400.
- Five controlled invalid requests returned 400 and the sixth returned 429; the production process was restarted afterward to clear the in-memory test window.
- The database still contains two messages. One is `qa@example.com`; a privacy-preserving check confirmed its name, subject, and body each contain QA/test markers. No message content was copied into this report.
- Decision: retain the QA row until a database backup has been restored successfully, then delete it through the authenticated API before launch.
- `RESEND_API_KEY`, `CONTACT_NOTIFY_EMAIL`, and `CONTACT_NOTIFY_FROM` remain unconfigured. No real visitor-shaped message was submitted, so one-time storage and inbox delivery are not proven.

## Security and production behavior

| Check | Result |
| --- | --- |
| Exact permitted CORS origin | 200 with the exact allow-origin and credentials enabled |
| Unlisted origin | 403 with no allow-origin header |
| Preview regex | Unconfigured/off; anchored valid/lookalike cases pass tests |
| Login/current user/logout | 200 / 200 / 200 |
| Invalid cookie | 401 |
| Production auth cookie | `HttpOnly`, `Secure`, `SameSite=Lax`, not `SameSite=None` |
| Admin write without CSRF header | 403 |
| Admin write with correct CSRF header and invalid non-mutating body | Reached validation and returned 400 |
| Payload limit | Oversized JSON -> 413 |
| Headers | Helmet CSP, HSTS, no-sniff, frame, and referrer protections present |
| Compression | Large project response served with gzip |
| Proxy trust | Production-on/development-off behavior passes backend tests |
| Frontend requests | JSON adapter uses `credentials: include`; tests cover cancellation and malformed responses |

## Regression verification

- Backend: 91 tests across 34 suites, zero failures.
- Frontend: 9 Node tests plus 63 Vitest tests, 72 total, zero failures.
- Frontend lint: pass.
- Production build: pass with Vite 8.2.2 and 256 transformed modules.
- Lockfile hashes still match the Phase 0 rebaseline.
- Bundle output matches the rebaseline: 72.65 kB CSS, 463.75 kB main JS, and 972.19 kB lazy scene JS. The existing chunk-size warning remains Phase 4 work.

## Test incident and recovery

An already-running API process was initially discovered on port 5000. A production-cookie check proved it was actually in development mode. During that rejected evidence run, a payload assumed to be invalid (`name: ""`) was accepted by the profile validator and cleared only the public profile name. The field was immediately restored to `Pawan Menuka` from `backend/data/profile.seed.json`, and the public read confirmed the restoration. No other profile field was sent; the profile update timestamp changed. All accepted Phase 1 security evidence was then repeated against a freshly started production-mode process using `name: null`, which returned 400 and left the restored name intact.

## Remaining blockers

| Severity | Blocker | Required action |
| --- | --- | --- |
| High | Contact storage and notification are not verified end to end | Provision staging Resend variables/destination, complete the database backup/restore gate, and submit one labelled staging message |
| High | Final CV is absent | Supply the approved PDF under 5 MB and upload through `POST /profile/resume` after backup |
| Medium | Avatar and Open Graph image are absent | Supply approved assets and store valid HTTPS references |
| Medium | Certification collection is empty | Confirm intentional absence or provide approved certification records |
| Environment | Staging origins, DNS, TLS, and hosting are not provisioned | Provision the Phase 2 environment only after the Phase 1 content/contact gate is cleared |
| Recovery | Database restore has not been executed | Install MongoDB Database Tools and prove a restore before any planned content/message deletion or media upload |

The previous high-severity CNC blocker is resolved.

## Phase gate

The expanded compiled frontend and production-shaped local backend are stable, and the executable local Phase 1 checks pass. Phase 1 remains **Blocked** because contact delivery, verified backup/restore, final CV/media, certification intent, and staging evidence are required by the plan. Phase 2 has not started.

## 2026-09-16 continuation

Phase 1 was resumed without starting Phase 2.

### Completed

- Restored both dependency trees from their committed npm lockfiles after the desktop shell supplied Node without a system `npm` command.
- Updated the backend test script from directory-based discovery (`tests/`) to Node's standard test discovery so it works with Node 24 while continuing to find the existing `*.test.js` files.
- Backend regression: 91 tests across 34 suites passed.
- Frontend regression: 9 Node tests plus 63 Vitest tests passed (72 total).
- Frontend lint passed.
- The 256-module production build passed. Output remains 72.65 kB CSS, 463.75 kB main JavaScript, and 972.19 kB lazy scene JavaScript; the existing large-chunk warning remains Phase 4 work.
- Repository search confirmed that no approved PDF resume, avatar, Open Graph image, or certification records are present.
- Local configuration inspection, with values hidden, confirmed Cloudinary is configured but `RESEND_API_KEY`, `CONTACT_NOTIFY_EMAIL`, and `CONTACT_NOTIFY_FROM` remain empty.

### Backup/restore attempt

- Downloaded the official MongoDB Database Tools 100.18.0 archive to the operating-system temporary directory and verified `mongodump` version 100.18.0.
- The intended EFS-encrypted backup directory could not be used because the `D:` volume does not support EFS. The fallback design was a 7-Zip AES-256 archive with encrypted filenames and its password held in Windows Credential Manager.
- `mongodump` then failed during the Atlas connection handshake before writing any BSON data. The exact empty failed-attempt directory was removed; no backup, restore database, or database mutation resulted.
- The native tool's failure diagnostic exposed the configured connection URI in the local tool transcript. The Atlas database-user password must be rotated before the credential is used again. Do not copy the old URI into reports or commits.

### Current gate

Phase 1 is still **Blocked**, not complete. Completion now requires:

1. Rotate the exposed Atlas database-user password and update the ignored local environment value.
2. Re-run `mongodump`, encrypted archive verification, isolated restore, restored API smoke checks, and temporary restore-database cleanup.
3. Provision controlled Resend test values so one labelled contact message can prove both database storage and inbox delivery.

Phase 2 has not been started.

### Approved media follow-up

- The owner supplied and approved a square portrait and the current CV PDF.
- The portrait was preserved as a 512 x 512 WebP avatar (`14,962` bytes).
- A branded 1200 x 630 JPEG Open Graph image (`110,496` bytes) was produced from the portrait with an ocean/iceberg composition and exact deterministic typography.
- The supplied two-page A4 PDF is valid, optimized, contains no embedded JavaScript, and is `126,306` bytes, below the backend's 5 MB limit. The copied public PDF has the same SHA-256 hash as the supplied file.
- The frontend now uses safe local avatar and CV fallbacks, includes canonical Open Graph/Twitter metadata, and packages all three assets in the production build.
- `profile.seed.json` records the intended production avatar and Open Graph URLs. Applying them to the live profile remains deferred until the database backup gate is cleared.
- The CV lists AWS Certified Developer - Associate as in progress with an October 2026 exam. It is not a completed certification, so the certification collection is intentionally empty for now.
- After integration, all 72 frontend tests, lint, and the 256-module production build pass.

The media and certification-intent blockers are resolved. The database resume upload remains deferred until backup/restore verification; visitors still receive the approved static CV through the frontend fallback.
