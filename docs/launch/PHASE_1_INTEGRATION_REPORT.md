# Phase 1 integration report

Executed: 2026-09-13 to 2026-09-14 (Asia/Colombo)

Status: **Blocked — Phase 1 exit criteria are not yet met. Phase 2 has not started.**

## Test topology

The repository has no provisioned staging host or deployment-provider configuration. Testing therefore used the implementation plan's allowed local production-preview topology:

- Backend: `NODE_ENV=production`, `http://localhost:5000`, connected to the database configured in the ignored backend `.env`.
- Frontend: compiled with `VITE_API_URL=http://localhost:5000/api/v1` and served by Vite preview at `http://localhost:5173`.
- CORS: exact frontend origin `http://localhost:5173`.
- Browser: compiled application tested in the Codex in-app browser.

This proves the local production-shaped stack, but it does not replace staging HTTPS, DNS, cookie, contact-delivery, or platform-proxy evidence.

## API and page verification matrix

| Capability | API result | Compiled frontend result | Status |
| --- | --- | --- | --- |
| Liveness | `GET /health` → 200 | Not applicable | Pass |
| Readiness | `GET /ready` → 200, database connected | API-dependent pages settle from loading | Pass |
| Profile | Complete text/social/SEO shape | Home, About, CV, Contact consume live profile | Partial: avatar, OG image, and resume are absent |
| Projects | Six published rows, correct pagination envelope | Six cards render; pagination total is consumed | Partial: only four rows exist in approved seed data; two stale CNC rows remain |
| Project filters | All five sections return only matching published rows | Full-stack 2, blockchain 1, systems 1, hardware 2, creative 0 | Pass, subject to stale hardware rows |
| Project detail | All six slugs return 200; missing slug returns 404 | All details render; missing project has recovery link | Partial: CNC content/link defects |
| Skills | 42 ordered records | Four populated skill groups render on About | Pass |
| Certifications | Empty array | Authored CV groups render; no certification group is shown | Needs content-owner decision/data |
| CV | Profile resume is `null` | Explicit “CV not available yet” state | Blocked: final PDF not supplied |
| Contact validation | 400 with field messages | Empty submit reports three field errors and focuses Name | Pass |
| Contact honeypot | 201 generic success; database count remains zero for the test address | Honeypot stays hidden and untabbable | Pass |
| Contact rate limit | Sixth controlled request → 429 | 400/429/500 retained-text states covered by frontend tests | Pass locally |
| Contact storage and email | Unit/integration mocks pass | Not submitted through UI | Blocked: backup gate and Resend configuration absent |

## Route and browser evidence

- Direct navigation succeeded for `/`, `/projects`, `/about`, `/cv`, `/contact`, every current `/projects/:slug`, and an unknown path.
- Refresh succeeded on a project-detail URL.
- Back/forward navigation restored project detail and About, including final profile-derived titles.
- Every project filter rendered its expected record count.
- Creative displayed the intentional empty state: “No published projects here yet.”
- With the API stopped, Projects displayed “Unable to reach portfolio data” and a visible retry button.
- After backend recovery, retry restored all six cards and cleared both alerts.
- No project media is currently supplied. Missing optional media does not produce broken image elements.
- Markdown sanitization, unsafe-link rejection, empty optional fields, contact retained-text states, and malformed API responses are covered by the passing frontend suite.

## Content integrity and external links

| Item | Result |
| --- | --- |
| Approved seed projects | Four: Impromptu Speech Trainer, Aranya Ceylon, Smart Healthcare Platform, Decentralized Freelance Escrow Protocol |
| Live database projects | Six |
| Valid project links | Five URLs returned HTTP 200: four GitHub repositories and `https://impromptu.pawanmenuka.com` |
| Invalid project links | Both CNC rows use `https://github.com/you/repo`, which returns 404 |
| CNC Steel Clamp | Incorrectly describes “6061 aluminum” and uses the `ALUMINUM` tag |
| CNC Aluminum Clamp | Appears to be stale placeholder content and is absent from approved seed data |
| Profile media | Avatar, Open Graph image, and resume are absent |
| Certifications | No database records or seed file exist |

No database content was changed. Fixing or deleting the CNC records, uploading the CV, or altering profile media must wait until the Phase 0 backup-and-restore gate has been executed.

## Contact evidence

- A honeypot-labelled request returned the same 201 visitor response as a real submission and stored zero records.
- Invalid name, email, and body values returned 400 with field-level messages.
- The controlled sixth request from one test IP returned 429. The local process was restarted afterward to clear the in-memory test window.
- Frontend tests confirm the real API adapter uses JSON and `credentials: include`, prevents duplicate pending submissions, aborts after 15 seconds, and retains text for 400, 429, 500, network, and timeout failures.
- `RESEND_API_KEY`, `CONTACT_NOTIFY_EMAIL`, and `CONTACT_NOTIFY_FROM` are not configured locally. A real visitor-shaped message was not submitted because notification could not be verified and the database backup gate has not been completed.

## `qa@example.com` decision

One `qa@example.com` row exists. A privacy-preserving inspection confirmed that its name, subject, and body contain QA/test markers, so it is the known synthetic record rather than an apparent visitor message.

Decision: retain it for now. Delete it through the authenticated message endpoint only after a verified backup/restore and before launch. The database currently contains two messages in total; no contents were copied into this report.

## Security and production behavior

| Check | Result |
| --- | --- |
| Allowed origin | 200 with exact `Access-Control-Allow-Origin` and credentials enabled |
| Unlisted origin | 403, no allow-origin header, no stack leakage |
| Preview regex | Off by default; anchored allow/lookalike reject cases pass tests |
| Login/current user/logout | 200 / 200 / 200 |
| Invalid cookie | 401 |
| Production cookie | `HttpOnly`, `Secure`, `SameSite=Lax` |
| Admin write without CSRF header | 403 |
| Admin write with CSRF header and invalid body | Reaches validation and returns 400; no write occurs |
| Payload limit | Oversized JSON returns 413 without stack leakage |
| Headers | Helmet CSP, HSTS, no-sniff, frame, referrer and related headers present |
| Compression | Large project response served with gzip when requested |
| Proxy trust | Production-on/development-off behavior covered by passing backend tests |
| Public data | Drafts remain inaccessible even with `status=draft`; internal `__v` removed by Phase 1 fix |

## Defects fixed in Phase 1

1. Rejected CORS origins now return an intentional operational 403 instead of a generic logged 500.
2. Public project, project-detail, skill, and certification reads omit Mongoose's internal `__v` field.
3. The application's frame reporter no longer accesses React Three Fiber's deprecated `clock` state and uses accumulated frame delta instead.
4. The profile recovery metadata test now waits for the document-head effect instead of racing the React commit.

Regression results after fixes:

- Backend: 91 tests across 34 suites, zero failures.
- Frontend: 9 Node tests plus 60 Vitest tests across 10 files, zero failures.
- Frontend lint: pass.
- Production build: pass, 252 modules.

The compiled home route still emits one `THREE.Clock` deprecation warning from `@react-three/fiber` itself, which constructs `new THREE.Clock()` internally against the installed Three.js version. This is a dependency-level, low-severity warning for Phase 4 dependency/bundle review; there are no application errors.

## Blocking defects and required inputs

| Severity | Blocker | Required action |
| --- | --- | --- |
| High | Contact storage and notification are not verified end to end | Provision staging Resend variables and destination, complete database backup/restore gate, then submit one labelled staging message |
| High | Two stale public CNC rows contain incorrect/placeholder content and 404 links | Back up database, obtain approved CNC content/link decision, then correct or remove via authenticated API |
| High | Final CV is absent | Supply the approved PDF under 5 MB and upload through `POST /profile/resume` after backup |
| Medium | Avatar and Open Graph image are absent | Supply approved assets and upload/store valid HTTPS references |
| Medium | Certification collection is empty | Confirm intentional absence or provide approved certification records |
| Environment | Staging origins are not provisioned | Provision DNS/TLS/hosting and secrets before the staging portions of Phase 1 can run |

## Phase gate

The local production-like integration is stable and all implemented automated checks pass. Phase 1 remains blocked because contact delivery, final CV/media/content, CNC cleanup, database backup/restore, and staging verification are required by its exit criteria. Phase 2 must not start until these items are resolved and this report is updated to Pass.
