# Portfolio launch log

## 2026-09-12 — Phase 0 baseline

### Owners

| Area | Owner |
| --- | --- |
| Product/content approval | Pawan Menuka |
| Domain, DNS, and hosting | Pawan Menuka |
| Database backup and restore | Pawan Menuka / deployment operator |
| Backend and frontend verification | Implementation agent, with Pawan Menuka as release approver |
| Rollback decision | Pawan Menuka |

### Decisions

- Production frontend: `https://pawanmenuka.com`.
- Production API: `https://api.pawanmenuka.com/api/v1`.
- Staging frontend: `https://staging.pawanmenuka.com`.
- Staging API: `https://api-staging.pawanmenuka.com/api/v1`.
- Staging and production remain same-site under `pawanmenuka.com`; proxying `/api/v1` through the frontend host is the approved fallback.
- `PREVIEW_ORIGIN_REGEX` remains empty unless rotating preview URLs become necessary; any future pattern must be tightly anchored and project-specific.
- No database writes, migrations, dependency upgrades, performance changes, or Phase 1 integration checks were performed during Phase 0.

### Evidence completed

- Backend and frontend lockfiles clean-installed successfully.
- Backend tests, frontend tests, frontend lint, and production build passed.
- Environment matrix, bundle sizes, public assets, lockfile hashes, repository state, and Git-ignore coverage were captured.
- Database backup location and restore procedure were documented.

### Unresolved items

- Confirm DNS, TLS, and hosting support for all four intended staging/production hostnames.
- Choose and provision separate staging and production MongoDB databases, Cloudinary locations, admin credentials, JWT secrets, and Resend destinations.
- Install MongoDB Database Tools and verify a restore from a fresh staging backup before any data mutation.
- Review the backend audit findings and record upgrades, mitigations, or accepted risk.
- Investigate the 3D/Draco bundle sizes in Phase 4.
- Decide retention and encryption policy for database backups and sanitized test evidence.

### Phase gate

Phase 0 is complete on the documented-restore-path branch of its exit criteria. Phase 1 has not started.

## 2026-09-14 — Phase 1 local production integration

### Completed

- Built the frontend with the local production-preview API origin and ran the backend with `NODE_ENV=production`.
- Verified liveness, readiness, profile, projects, every project filter/detail, skills, certifications, CV fallback, contact validation/honeypot/rate limit, direct SPA routes, refresh, history, API outage, and retry recovery.
- Verified authentication, cookies, CSRF, CORS, Helmet, compression, payload limits, draft exclusion, and proxy-trust behavior.
- Fixed rejected-origin status handling, removed public `__v` metadata, removed application use of deprecated scene clock state, and stabilized the metadata recovery regression test.
- Backend passes 91 tests; frontend passes 69 tests; frontend lint and production build pass.

### Decision: `qa@example.com`

- One record exists and all inspected fields contain QA/test markers.
- Retain until a verified backup exists; then delete through the authenticated API before launch.

### Blockers

- Staging is not provisioned and Resend/contact variables are absent.
- Database backup/restore is not yet verified, so no real message, content mutation, CV upload, or deletion was performed.
- Two stale CNC rows are public; the steel row incorrectly says aluminum and both use a 404 placeholder GitHub URL.
- Avatar, Open Graph image, final CV, and certification records are absent.

### Phase gate

Phase 1 is blocked pending the items in `PHASE_1_INTEGRATION_REPORT.md`. Phase 2 has not started.

## 2026-09-14 — Phase 0 rebaseline after frontend expansion

### Decision

- Restart the launch plan from Phase 0 because the frontend page set changed.
- Preserve `PHASE_0_BASELINE.md` and `PHASE_1_INTEGRATION_REPORT.md` as historical evidence.
- Use `PHASE_0_REBASELINE_2026-09-14.md` as the current baseline for all later launch work.
- Reset the previous Phase 1 verification status; its code fixes remain, but its evidence must be repeated against the expanded frontend.

### Evidence

- Both backend and frontend lockfiles clean-installed in isolated empty directories.
- Backend: 91 tests across 34 suites, zero failures.
- Frontend: 72 tests total, zero failures; lint and production build pass.
- Current router contains Home, Projects, Project Detail, About, CV, Contact, and Not Found.
- Build rebaseline: 256 modules, 72.65 kB main CSS, 463.75 kB main JS, and 972.19 kB lazy scene JS.
- Public assets remain 12 files totaling 1,271,335 bytes.

### Phase gate

Phase 0 rebaseline is complete. The repeat of Phase 1 has not started, and Phase 2 remains unstarted.

## 2026-09-14 — Phase 1 repeat after frontend expansion

### Evidence

- Rebuilt the expanded frontend from the npm lockfile with `VITE_API_URL=http://localhost:5000/api/v1` and ran the backend in confirmed production mode.
- Verified every public route, all six project details, every section filter, intentional empty states, client contact validation, direct refresh, browser history, API outage, and retry recovery.
- Backend passes 91 tests. Frontend passes 72 tests; lint and the 256-module production build pass.
- Verified production cookies, authentication, CSRF, CORS, Helmet, gzip, payload limits, draft exclusion, rate limiting, readiness, and proxy-trust behavior.
- Live project data now matches the six-record approved seed. The CNC steel/aluminum descriptions and tags are corrected, placeholder links are removed, and all five remaining external links return 200.

### Decision: `qa@example.com`

- The privacy-preserving QA-marker check still identifies one known synthetic row.
- Retain it until a backup has been restored successfully; then delete it through the authenticated API before launch.

### Incident

- An initial cookie check exposed that a pre-existing API process was in development mode. A payload assumed to be invalid cleared only the public profile name; it was immediately restored from the approved seed and verified. Accepted evidence was repeated against a fresh production-mode process with a non-mutating invalid payload.

### Remaining blockers

- Staging and Resend/contact notification settings are not provisioned, so real storage plus inbox delivery is unverified.
- Database backup/restore has not been executed.
- Final CV, avatar, and Open Graph image are absent.
- Certification absence still needs an explicit content-owner decision.

### Phase gate

The local repeat is complete and stable, but Phase 1 remains blocked on the documented inputs and environment gates in `PHASE_1_REPEAT_2026-09-14.md`. The earlier CNC blocker is resolved. Phase 2 has not started.

## 2026-09-14 — Phase 2 staging provisioning check

### Authorization

- The user authorized moving to the next phase despite the documented Phase 1 blockers.

### Evidence

- Neither `staging.pawanmenuka.com` nor `api-staging.pawanmenuka.com` resolves in DNS.
- No deployment manifest or linked Vercel, Netlify, Render, Railway, Fly, Docker, or GitHub Actions project exists in the repository.
- No supported provider deployment credential variables are configured in the current environment.
- The current verified source is a dirty `Develop` working tree based on commit `79ac002d921533df9b0ec8362ed9f4de44074c13`; it cannot yet be identified as a reproducible release candidate.

### Phase gate

Phase 2 is blocked pending hosting-provider/project selection, DNS authority, isolated staging services and secrets, a release-source commit decision, and the staging access-policy decision. No external state was changed, and Phase 3 has not started. See `PHASE_2_STAGING_REPORT_2026-09-14.md`.

## 2026-09-16 — Phase 1 continuation

### Evidence

- Backend 91/91 tests passed after making the test command compatible with Node 24 standard discovery.
- Frontend 72/72 tests, lint, and the 256-module production build passed.
- No approved resume PDF, avatar, Open Graph image, or certification records exist in the repository.
- Cloudinary variables are configured locally; Resend/contact notification variables remain empty.
- MongoDB Database Tools 100.18.0 were acquired and verified, but the backup attempt failed during the Atlas handshake before writing data. The empty attempt directory was removed and no database was modified.

### Security action required

- The failed native dump diagnostic exposed the configured connection URI in the local tool transcript. Rotate the Atlas database-user password and update the ignored local `.env` value before retrying the backup.

### Phase gate

Phase 1 remains blocked on credential rotation, verified encrypted backup/restore, and controlled contact-delivery configuration. Phase 2 was not resumed.

## 2026-09-16 — Approved profile media and CV

### Completed

- Validated the supplied two-page A4 CV PDF visually and structurally; it is optimized, contains no JavaScript, and is 126,306 bytes.
- Copied the unchanged PDF to the public frontend and verified its SHA-256 hash matches the supplied source.
- Produced a 512 x 512 WebP avatar and a 1200 x 630 JPEG social-sharing image using the approved portrait.
- Added safe local avatar/CV fallbacks and canonical Open Graph/Twitter metadata.
- Recorded intended production media URLs in the profile seed without mutating the database.
- Confirmed from the approved CV that AWS Certified Developer - Associate is still in progress; the certifications collection is intentionally empty until a credential is completed.
- Frontend regression remains green: 72 tests, lint, and production build pass.

### Remaining Phase 1 gate

- Rotate the exposed Atlas credential, complete encrypted backup/restore verification, and configure controlled Resend values for one labelled end-to-end contact test.

## 2026-09-20 — Local pre-deployment validation

### Completed

- Finished the locally executable responsive, accessibility, performance, SEO, repository-cleanup, and regression work without deploying the site.
- Added route-level axe coverage, fixed narrow navigation, landmarks, form associations, external-link announcements, carousel labels, and carousel touch targets.
- Split inner routes, deferred WebGL until user interaction, eliminated duplicate decoder output, and reduced the scene font from 876,576 to 168,344 bytes.
- Added canonical robots and sitemap files.
- Replaced vulnerable backend dependency versions with fixed releases, completed the Express 5 query/sanitizer compatibility work, and reached zero findings in both npm audits.
- Backend passes 91 tests. Frontend passes 9 Node tests and 70 Vitest tests; lint and the 256-module production build pass.
- Repeated dependency installation, audits, all tests, lint, and build from a temporary clean checkout; the result is reproducible from both lockfiles.
- Local Lighthouse evidence is recorded in `PREDEPLOYMENT_VALIDATION_2026-09-20.md`.

### Remaining gate

- Atlas credential rotation must be confirmed before encrypted dump/restore verification.
- Resend notification variables are not configured, so the labelled storage-plus-inbox Contact test cannot run.
- Physical Android/iPhone and NVDA/VoiceOver coverage, hosted CDN measurements, staging, and production remain external/deployment work.
