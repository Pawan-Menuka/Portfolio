# Portfolio Launch Implementation Plan

## Scope and planning assumption

This plan covers the remaining work after content entry:

1. Final backend integration review
2. Physical-device testing
3. Performance optimization
4. Final accessibility and content review
5. Release preparation, staging, deployment, and post-release verification

For sequencing purposes, the real-content phase is treated as complete. Content is still reviewed later because final images, links, biography text, project copy, and the CV can affect layout, accessibility, performance, and release readiness.

The launch order is deliberate:

```text
Production-like integration
        ↓
Stable staging build
        ↓
Physical-device evidence
        ↓
Performance optimization
        ↓
Accessibility and editorial review
        ↓
Release candidate
        ↓
Production deployment and route verification
```

Do not optimize or tune device thresholds against the development server. Physical-device, performance, and accessibility conclusions must use a production build deployed to staging or served with the production preview command.

---

## Phase 0 — Launch baseline and environment inventory

### Objective

Create a reproducible baseline before changing configuration or optimizing assets.

### Tasks

- Record the intended production URLs:
  - Frontend origin, for example `https://pawanmenuka.com`.
  - Backend API origin, for example `https://api.pawanmenuka.com/api/v1`.
  - Staging frontend origin.
  - Staging backend API origin.
- Confirm that the frontend and backend will be on the same registrable site, or proxy the API through the frontend domain. The current authentication cookie uses `SameSite=Lax`, so a cross-site production layout requires a deliberate cookie and CSRF review.
- Create an environment matrix without placing secrets in Git:

| Variable | Local | Staging | Production |
| --- | --- | --- | --- |
| `VITE_API_URL` | Local API `/api/v1` | Staging API `/api/v1` | Production API `/api/v1` |
| `NODE_ENV` | `development` | `production` | `production` |
| `MONGODB_URI` | Development database | Staging database | Production database |
| `JWT_SECRET` | Local secret | Unique staging secret | Unique production secret |
| `FRONTEND_ORIGINS` | Exact localhost origin | Exact staging origin | Exact production origins |
| `PREVIEW_ORIGIN_REGEX` | Empty | Anchored preview pattern only if needed | Empty unless explicitly required |
| Cloudinary variables | Development account/folder | Staging account/folder | Production account/folder |
| Resend/contact variables | Test destination | Controlled staging destination | Real notification destination |
| Admin credentials | Local admin | Staging admin | Production admin |

- Confirm `.env`, credentials, database exports, and generated reports are ignored by Git.
- Capture the current state:
  - `git status --short`
  - Current branch and commit
  - Node and npm versions
  - Frontend and backend dependency lockfiles
  - Current frontend build sizes
  - Current public asset inventory
- Create a database backup before deleting messages, changing production content, or running a migration.
- Record known launch assumptions and unresolved decisions in a launch log.

### Baseline checks

From `backend/`:

```bash
npm ci
npm test
```

From `frontend/`:

```bash
npm ci
npm test
npm run lint
npm run build
```

### Deliverables

- Environment matrix with URLs filled in.
- Database backup location and restore instructions.
- Baseline test results and bundle-size report.
- Launch log containing owners, decisions, and unresolved issues.

### Exit criteria

- Both lockfiles install cleanly with `npm ci`.
- Existing tests, lint, and production builds pass.
- Staging and production origins are decided.
- A database restore path has been verified or documented.

---

## Phase 1 — Final backend integration review

### Objective

Prove that the compiled frontend works with production-shaped backend configuration and that every public data path behaves correctly.

### 1.1 Run a production-like stack

- Build the frontend with the intended staging API URL supplied through `VITE_API_URL`. Vite embeds this value at build time; changing it after the build does not update the compiled application.
- Run the backend with `NODE_ENV=production` and staging-safe credentials.
- Serve the frontend build through `vite preview` or the staging host.
- Use one exact hostname consistently. `localhost` and `127.0.0.1` are different CORS origins.
- Confirm direct navigation and refresh behavior for the SPA routes.

Suggested local production-preview flow:

```bash
# backend terminal
cd backend
npm start

# frontend terminal after npm run build
cd frontend
npm run preview -- --host localhost --port 5173 --strictPort
```

### 1.2 Verify readiness and public resources

Check status codes, response envelopes, displayed results, loading states, empty states, error states, and retries.

| Capability | API verification | Frontend verification |
| --- | --- | --- |
| Liveness | `GET /health` returns `200` | Not applicable |
| Readiness | `GET /ready` returns `200` with connected database | Application does not remain in a loading state |
| Profile | `GET /api/v1/profile` returns the complete public shape | Name, headline, biography, location, availability, social links, avatar, SEO title |
| Projects | `GET /api/v1/projects` returns published records and pagination metadata | All-project list, count, pagination, section filters, summaries, dates, tags |
| Project detail | `GET /api/v1/projects/:slug` returns one published record | Markdown, media, links, metadata, missing-project recovery |
| Skills | `GET /api/v1/skills` returns correctly ordered categories | About skill groups render in the intended order |
| Certifications | `GET /api/v1/certifications` returns expected records | CV certification group renders or has an intentional empty state |
| CV | Profile contains the production resume object | CV button opens the correct PDF in a new tab |
| Contact | `POST /api/v1/messages` stores a valid message | Validation, pending, success, rate-limit, timeout, and retained-text error states |

### 1.3 Verify project filtering and content integrity

- Test every public project section:
  - `full-stack`
  - `blockchain`
  - `systems`
  - `hardware`
  - `creative`
- Confirm draft projects never appear through public endpoints, even when query strings attempt to request them.
- Confirm pagination reports the correct `page`, `limit`, and `total`.
- Open every project detail route and test every GitHub, live, and demo link.
- Confirm empty optional links do not render.
- Confirm Markdown is sanitized and raw HTML does not execute.
- Confirm missing or invalid image URLs fail gracefully without breaking the page.
- Confirm project dates, achievement claims, technology names, and section assignments match the approved content source.
- Recheck the CNC Steel Clamp entry and verify no aluminum description remains.

### 1.4 Verify profile, CV, skills, and certifications

- Confirm the profile singleton contains the final supported fields.
- Confirm the profile biography renders headings, paragraphs, lists, and links correctly.
- Confirm the avatar and Open Graph image resolve over HTTPS.
- Upload the final CV through `POST /profile/resume`; do not insert `resume` through a general profile update.
- Confirm the old resume asset is replaced and the new PDF:
  - Has the intended filename.
  - Opens without authentication.
  - Is the current version.
  - Is below the backend’s 5 MB limit.
- Confirm skill category values match the backend taxonomy.
- Confirm certification issue dates, optional expiry dates, credential IDs, verification links, badges, order, and featured state.

### 1.5 Verify contact storage and notification delivery

- Configure `RESEND_API_KEY`, `CONTACT_NOTIFY_EMAIL`, and, if needed, `CONTACT_NOTIFY_FROM` in staging.
- Submit one clearly labelled staging test message through the actual frontend.
- Confirm all three results:
  1. Visitor receives the generic success state.
  2. Message is stored once in MongoDB.
  3. Notification arrives at the configured inbox with the expected fields.
- Confirm notification failure does not discard a stored message or expose provider details to the visitor.
- Confirm the honeypot field remains hidden and empty for normal users.
- Exercise the contact rate limit from a controlled test client, then wait for or reset the staging window. Do not perform rate-limit testing against production visitors.
- Verify message length, email, optional subject, and duplicate-submission protection.

### 1.6 Decide on the `qa@example.com` test message

- Inspect the message and confirm it is the known QA record rather than real visitor data.
- Recommended decision: delete it from the production inbox after the database backup and before launch; retain its existence only in the launch log.
- If it is useful for a staging demonstration, keep it only in staging.
- Record the final decision.
- If deletion is approved, delete it through the authenticated message endpoint and verify it no longer appears. Do not edit the database manually unless the API is unavailable and the reason is documented.

### 1.7 CORS, cookies, authentication, and security behavior

- Set `FRONTEND_ORIGINS` to a comma-separated list of exact permitted origins with protocol and port where applicable.
- Do not use `*` with credentialed requests.
- If rotating preview URLs are required, use a tightly anchored `PREVIEW_ORIGIN_REGEX`; test a valid preview origin and a lookalike rejected origin.
- Confirm a permitted origin receives the expected CORS headers.
- Confirm an unlisted origin is rejected server-side.
- Confirm frontend API requests use `credentials: 'include'`.
- Test admin login, current-user lookup, expiry/invalid-cookie behavior, and logout.
- Confirm every authenticated admin write requires `X-Requested-With: portfolio-admin`.
- Confirm production cookies are `httpOnly`, `Secure`, and `SameSite=Lax` under the chosen domain layout.
- Confirm Helmet, compression, payload limits, Mongo sanitization, and production-safe error responses remain active.
- Confirm `/ready` is used for deployment health checks rather than `/health`.
- Confirm the backend trusts the platform proxy in production so IP-based rate limiting uses the real client IP.

### 1.8 Failure-path review

Verify usable behavior when:

- The API is unavailable.
- MongoDB is disconnected.
- A request exceeds the frontend timeout.
- A project slug is missing.
- The profile contains empty optional fields.
- Skills or certifications are empty.
- The resume is unavailable.
- A media asset returns `404`.
- Contact returns `400`, `429`, or `500`.

### Deliverables

- Completed API and page verification matrix.
- Contact-delivery evidence with secrets and personal message content removed.
- CORS allow/reject evidence.
- Recorded decision for the `qa@example.com` record.
- List of integration defects and fixes.

### Exit criteria

- Every required API resource renders correctly in the production frontend build.
- Contact storage and notification delivery are verified end to end.
- CORS, cookies, rate limiting, and readiness behavior match the deployment design.
- No critical or high-severity integration issue remains.

---

## Phase 2 — Staging deployment for realistic testing

### Objective

Create the stable release environment used by physical-device, performance, accessibility, and stakeholder testing.

### Tasks

- Deploy a production-mode backend connected to a staging database.
- Configure staging Cloudinary/media and contact notification settings.
- Deploy the compiled frontend with the staging API URL.
- Configure the host to return the SPA entry point for direct requests to:
  - `/`
  - `/projects`
  - `/projects/:slug`
  - `/about`
  - `/cv`
  - `/contact`
  - An unknown path handled by the application
- Enable HTTPS and confirm there is no mixed content.
- Confirm asset URLs, source maps policy, compression, and cache headers.
- Add an access restriction if staging contains personal or unfinished content.
- Create a release-candidate identifier that ties staging to a Git commit.
- Run the Phase 1 smoke suite against staging.

### Exit criteria

- Staging matches the planned production topology.
- Direct routes and refreshes work.
- The staging build is tied to a known commit and environment configuration.
- No local-only dependency is required for the site to work.

---

## Phase 3 — Physical-device and adaptive 3D testing

### Objective

Verify the four scene tiers on real hardware and tune promotion decisions from measurements rather than device labels.

### Tier expectations

| Environment | Expected starting experience |
| --- | --- |
| Reduced motion, Data Saver, low-power device, or failed WebGL | Static iceberg |
| Typical mobile device | Lightweight 3D |
| Capable flagship phone | Enhanced mobile 3D |
| Desktop or laptop with mouse/trackpad | Full desktop 3D, subject to capability checks |

Development query overrides such as `?scene-tier=static`, `mobile-light`, or `mobile-enhanced` may be used for diagnostics in local development. Automatic policy behavior must be tested without an override, and diagnostic overrides must not become a production user dependency.

### 3.1 Device matrix

Test at least:

| Device class | Minimum evidence |
| --- | --- |
| Lower-powered Android phone | One older or entry-level device with limited GPU/RAM |
| Typical Android phone | One current midrange device |
| Flagship phone | One recent high-performance Android device |
| iPhone/Safari | One physical iPhone using Safari; add an older iPhone if available |
| Lower-powered laptop | Integrated graphics, battery mode, and a common laptop viewport |
| Desktop reference | Current Chrome/Edge and Firefox; Safari on macOS if available |

Record exact model, OS version, browser version, viewport, memory where known, connection profile, power mode, and selected tier.

### 3.2 Test scenarios on every applicable device

- Fresh visit with cache cleared.
- Repeat visit with warm cache.
- Normal touch or wheel descent from surface to contact.
- Fast flick scrolling and rapid direction changes.
- Slow scroll through every checkpoint.
- Navigation to another page and back.
- Browser back/forward navigation.
- Portrait-to-landscape and landscape-to-portrait rotation.
- Browser chrome expanding/collapsing on mobile.
- Background the tab, return, and resume scrolling.
- Lock and unlock the phone while the page remains open.
- Leave the scene open long enough to detect heat, battery, memory, or frame degradation.
- Open multiple site routes in one session.
- Load over a slower or high-latency network.
- Enable operating-system reduced motion before loading.
- Enable browser Data Saver or `Save-Data` where supported.
- Test low-power/battery-saver mode.
- Disable or force failure of WebGL through the supported diagnostic path.
- Test with JavaScript errors and console warnings recorded.

### 3.3 Visual and interaction checks

- The iceberg fills the intended composition without horizontal overflow.
- The ocean, sky, underwater layers, marine life, labels, and depth gauge change at the intended depths.
- Stars do not appear underwater.
- Underwater effects do not obscure labels or reduce readability.
- The waterline does not tear or expose blank bands during fast scrolling.
- Every checkpoint dot stays attached to its saved iceberg location during scrolling and resizing.
- Only one checkpoint label is meaningfully visible at a time; the next begins after the previous has fully cleared.
- Touch scrolling remains native, predictable, and free from accidental link activation.
- Rotation does not strand the camera, duplicate the canvas, or leave labels misplaced.
- Navigation and page content remain usable if the canvas is loading or unavailable.
- Static and reduced-motion experiences contain the same navigation and information.
- The depth rail remains visible without causing horizontal scrolling.

### 3.4 Measurements to capture

- Selected starting tier and any promotion/demotion event.
- Time until the usable static hero appears.
- Time until interactive 3D is ready.
- Approximate frame rate or frame-time distribution during steady and fast scrolling.
- Long tasks during initial scene load and active scrolling.
- Peak memory where browser tools expose it.
- Unexpected WebGL context loss.
- Temperature or visible thermal throttling during a sustained session.
- Network bytes for the initial route and lazy 3D load.
- Console errors and failed network requests.

### 3.5 Tune the automatic tier policy

- Change thresholds only after the device matrix contains evidence from all required classes.
- Favor a stable lower tier over promotion that causes stutter or context loss.
- Preserve these hard constraints:
  - Reduced motion starts static.
  - Data Saver starts static where the browser exposes the signal.
  - WebGL initialization failure falls back to static.
  - A failed enhanced tier must degrade without losing content or navigation.
- Tune calibration duration, frame-time limits, DPR caps, effects, particle counts, and promotion thresholds independently where possible.
- Retest at least one device on each side of every changed threshold.
- Clear saved tier calibration between clean policy tests; separately test repeat visits with calibration retained.
- Document browser limitations, particularly signals Safari does not expose.

### Defect severity

- **Blocker:** crash, blank page, infinite loader, unusable navigation, or lost content.
- **High:** persistent severe stutter, horizontal overflow, broken rotation, unreadable checkpoint, wrong accessibility mode, or repeated WebGL loss.
- **Medium:** brief visual pop, delayed promotion, misplaced decorative element, or recoverable animation defect.
- **Low:** polish issue without usability or correctness impact.

### Deliverables

- Device test matrix with screenshots or recordings for failures.
- Tier-selection and performance evidence.
- Threshold changes with before/after results.
- Known-device limitations and accepted tradeoffs.

### Exit criteria

- All required device classes complete the core journey.
- Static fallback works whenever 3D is unavailable or intentionally disabled.
- No blocker or high-severity device issue remains.
- Tier thresholds are supported by recorded evidence.

---

## Phase 4 — Performance optimization

### Objective

Reduce loading and runtime cost without damaging the approved visual result or making tier behavior unreliable.

### 4.1 Establish production measurements

- Measure the compiled build, not the development server.
- Record initial-route assets separately from lazy 3D assets.
- Measure with cold and warm caches.
- Use both Lighthouse and browser performance/network traces.
- Test desktop and mobile profiles, including a slower connection and CPU throttling.
- Record Core Web Vitals targets:
  - LCP at or below 2.5 seconds at the 75th percentile.
  - INP at or below 200 ms at the 75th percentile.
  - CLS at or below 0.1 at the 75th percentile.
- Treat Lighthouse scores as diagnostic signals; do not replace physical-device results with one score.

### 4.2 Analyze the JavaScript bundles

- Generate a bundle visualization for the production build.
- Identify the initial application bundle, route code, and lazy Three.js/R3F scene chunk.
- Confirm Three.js, React Three Fiber, Drei, and model helpers are absent from routes that never open the scene.
- Confirm the 3D chunk loads only when policy permits and the hero approaches the activation area.
- Inspect duplicate libraries and multiple versions.
- Replace broad Drei imports with specific imports where tree shaking does not remove unused code.
- Remove unused scene helpers, debug code, and review instrumentation from production.
- Keep source maps according to the deployment debugging policy and prevent accidental public exposure if they are private.

### 4.3 Reduce the lazy 3D cost

The current scene is approximately 262 KB compressed. Use that as the baseline, then:

- Inspect the build output and browser network log to determine whether Draco code exists both in the JavaScript bundle and `public/draco/`.
- Confirm which decoder files the runtime actually requests before deleting anything.
- Keep one tested decoder delivery strategy:
  - Local decoder assets with explicit version/provenance, or
  - Bundled decoder code if it is demonstrably smaller and reliable.
- Remove only confirmed duplicate decoder output.
- Rebuild and test the GLB on Chromium, Firefox, Android, and iPhone/Safari after any decoder change.
- Evaluate whether the 78 KB GLB can be reduced further without visible silhouette, normal, or anchor-point damage.
- Preserve mesh names and marker/camera assumptions when optimizing the model.
- Keep DPR, shader complexity, particles, marine life, and post-processing appropriate to each tier.
- Pause ambient work while hidden or offscreen and avoid unnecessary React rerenders during scroll.
- Confirm the render loop does not run at full speed when visual changes do not require it.

### 4.4 Optimize images and media

- Replace placeholder media with correctly sized production images.
- Generate responsive image sizes and modern formats such as WebP or AVIF where supported by the media pipeline.
- Set intrinsic width/height or aspect ratio to prevent layout shift.
- Eagerly load only the actual LCP image.
- Lazy-load below-the-fold project and gallery images.
- Compress the logo, favicon, Open Graph image, avatar, project covers, and gallery images to visually lossless targets.
- Avoid serving full-resolution originals into small cards.
- Verify Cloudinary transformations and cache headers if Cloudinary remains the delivery source.
- Ensure broken media has a designed fallback.

### 4.5 Optimize fonts

- Audit which font families, weights, scripts, and glyph ranges are actually used.
- Convert the current full TTF delivery to appropriately licensed WOFF2 subsets where practical.
- Retain only required weights.
- Preload only the font needed for above-the-fold text; let secondary weights load normally.
- Use a fallback stack with compatible metrics to reduce layout movement.
- Apply long-lived immutable caching to fingerprinted font assets.
- Verify font-display behavior during a cold load and offline repeat visit.
- Retain the font license with distributed assets.

### 4.6 Caching and delivery

- Fingerprinted build assets: long-lived `Cache-Control: public, max-age=31536000, immutable`.
- HTML entry point: short cache or revalidation so releases propagate.
- API responses: choose explicit cache behavior; do not cache personalized admin responses publicly.
- Static GLB, decoder, fonts, and image derivatives: cache aggressively with safe versioning.
- Enable Brotli or gzip at the CDN/host and verify response headers.
- Use HTTP/2 or HTTP/3 where the host provides it.
- Confirm no duplicate asset requests occur during a full descent and route navigation.

### 4.7 Runtime and network testing

- Run Lighthouse on Home, Projects, one Project Detail page, About, CV, and Contact.
- Capture performance traces for initial load and a complete iceberg descent.
- Test a slow connection with an empty cache.
- Test repeat navigation with a warm cache.
- Confirm no layout shift when profile, project, or font content arrives.
- Confirm contact interaction remains responsive while 3D assets load.
- Inspect console warnings and network failures.
- Re-run the physical-device smoke subset after every material scene, decoder, font, or image change.

### Performance budgets

Record exact final budgets after the first baseline. At minimum enforce:

- No regression in initial route compressed JavaScript without documented approval.
- Lazy scene compressed size below the current approximately 262 KB baseline, or a documented visual reason for retaining it.
- No unnecessary 3D download for static/reduced-motion users.
- No project image larger than its delivery dimensions require.
- Core Web Vitals within the targets above on representative staging traffic or repeatable lab profiles.

### Deliverables

- Before/after bundle report.
- Lighthouse reports for key routes.
- Network and runtime trace summary.
- Draco decision and decoder provenance update.
- Font and cache policy.
- Recorded final budgets.

### Exit criteria

- Performance budgets pass.
- No blocker/high physical-device regression is introduced.
- The static tier avoids the 3D cost.
- Cache, compression, font, image, and decoder behavior are verified from response headers and network traces.

---

## Phase 5 — Final accessibility and content review

### Objective

Ensure every route and every scene tier remains understandable and operable with keyboard, assistive technology, enlarged text, and final media.

### 5.1 Automated accessibility checks

- Run an automated accessibility scanner on every public route and representative state.
- Include:
  - Home at the intro and checkpoint states.
  - Projects with each filter and pagination.
  - One expanded project row.
  - Project detail with Markdown and gallery.
  - About with skills.
  - CV with expanded entries.
  - Contact empty, invalid, pending, success, and error states.
  - Not-found route and missing project.
- Treat automated checks as coverage support, not final approval.

### 5.2 Keyboard review

- Navigate the complete site using only Tab, Shift+Tab, Enter, Space, Escape, and arrow keys where applicable.
- Verify the skip link.
- Confirm focus order follows visual and reading order.
- Confirm every interactive item has a visible focus indicator against its current background.
- Confirm collapsed project and CV rows expose their expanded state.
- Confirm focus is not trapped or moved unexpectedly.
- Confirm external links and project cards are not nested into conflicting controls.
- Confirm the contact form focuses the first invalid field and preserves entered text after recoverable errors.
- Confirm scrolling and checkpoint links work without requiring a pointer.

### 5.3 Screen-reader review

At minimum test:

- NVDA with Chrome or Firefox on Windows.
- VoiceOver with Safari on iPhone.
- VoiceOver with Safari on macOS if available.
- TalkBack with Chrome on Android if available.

Verify:

- Page title and main heading identify every route.
- Navigation landmarks, main content, footer, forms, and status regions are announced correctly.
- The decorative 3D canvas does not overwhelm the accessibility tree.
- The static iceberg has appropriate alternative text.
- Checkpoint links announce title and depth.
- Loading, error, retry, submission, and success states are announced once and at the right time.
- Markdown headings preserve a logical hierarchy.
- Project images have meaningful, project-specific alternative text; decorative images use empty alt text.
- Icon-only controls have accessible names.
- New-tab behavior is communicated where needed.
- The site remains complete when the screen reader ignores visual scene effects.

### 5.4 Enlarged text, zoom, and reflow

- Test browser zoom at 200% on every route.
- Test text-only enlargement at 200% where the browser supports it.
- Test a narrow 320 CSS-pixel viewport and common mobile widths.
- Confirm there is no horizontal page scrolling caused by content.
- Confirm labels, filters, navigation, buttons, project titles, Markdown, and contact fields do not clip or overlap.
- Confirm checkpoint text and the depth rail remain readable or switch to the intended static/reflow layout.
- Confirm content does not depend on hover.

### 5.5 Motion, contrast, color, and media

- Verify `prefers-reduced-motion` selects the static experience and suppresses nonessential animation.
- Confirm focus, errors, availability, project states, and depth are not communicated by color alone.
- Measure text and interactive-control contrast after final images and gradients are present.
- Check contrast at the brightest waterline and darkest underwater checkpoints.
- Confirm animated marine life, particles, aurora, and ripples do not obscure content.
- Confirm flashing and pulsing remain below unsafe thresholds.
- Add concise alternative text to every informative final project image.
- Use empty alt text for decorative textures, bubbles, and purely atmospheric media.
- Provide text equivalents for information that appears visually on the iceberg.

### 5.6 Forms and links

- Verify every field has a persistent label, instructions, error association, and appropriate autocomplete value.
- Confirm touch targets are comfortably sized and spaced.
- Confirm invalid input is described in text.
- Confirm the success message does not clear content until the backend confirms receipt.
- Test email, GitHub, LinkedIn, website, CV, project source, live, and demo links.
- Verify no placeholder, localhost, private repository, expired testnet, or staging link remains.
- Check that external links use safe rel attributes.

### 5.7 Editorial review

- Proofread the Home, Projects, every project detail page, About, CV, Contact, metadata, image alt text, and error messages.
- Standardize:
  - `Full-stack` capitalization.
  - Product and technology names.
  - Date and date-range formats.
  - Punctuation and dash style.
  - First-person voice.
  - Sri Lankan/British or American spelling choice.
- Verify every factual claim, statistic, achievement, role, project status, and certification.
- Confirm sensitive or private information is intentionally public.
- Check that the biography, timeline, CV, and project dates agree.
- Recheck the CNC Steel Clamp material description.
- Review Open Graph title, description, image, favicon, document titles, and canonical production URL.

### Deliverables

- Accessibility test matrix by browser and assistive technology.
- List of automated findings with manual disposition.
- Contrast measurements and fixes.
- Approved alt-text inventory.
- Proofread content sign-off.

### Exit criteria

- No critical or serious accessibility issue remains.
- Every route is keyboard operable.
- Screen-reader users can understand the content without the 3D scene.
- The site reflows at 200% without lost content or two-dimensional page scrolling.
- Final copy, links, media, and metadata are approved.

---

## Phase 6 — Release preparation

### Objective

Turn the reviewed worktree into a clean, reproducible release candidate.

### 6.1 Repository cleanup

- Review the full uncommitted worktree before deleting or moving anything.
- Classify each untracked or modified file as source, generated output, local artifact, obsolete design input, test evidence, or documentation.
- Archive the old `Portfolio landing page redesign.zip` outside the shipped frontend or delete it after confirming the merged source is complete.
- Remove unused development assets only after searching for code, CSS, test, and documentation references.
- Review potential duplicates in:
  - `frontend/public/draco/`
  - `frontend/public/fonts/`
  - `frontend/public/images/`
  - `frontend/public/models/`
  - Old static iceberg assets
  - Screenshots and temporary review artifacts
- Ensure `dist/`, test reports, Lighthouse reports, local database backups, `.env` files, and temporary recordings are ignored unless intentionally versioned.
- Keep licenses and provenance documentation for fonts, models, decoder assets, and third-party media.
- Run a clean install and build after cleanup.

### 6.2 Create reviewable commits

Use logical commits that can be reviewed or reverted independently. A suitable sequence is:

1. Backend content/import and integration configuration.
2. Frontend data integration and final page content.
3. Responsive 3D tier implementation and physical-device tuning.
4. Performance and asset optimization.
5. Accessibility and content corrections.
6. Deployment configuration and launch documentation.

Before committing:

- Inspect `git diff --check`.
- Inspect staged files for secrets, personal test data, generated bundles, and unintended binaries.
- Confirm package-lock changes match intentional dependency changes.
- Confirm no content source exists only in an ignored local directory.
- Confirm database credentials and API keys are absent.

### 6.3 Release-candidate validation

From a clean checkout or clean worktree:

```bash
cd backend
npm ci
npm test

cd ../frontend
npm ci
npm test
npm run lint
npm run build
```

Then:

- Serve the exact compiled frontend artifact.
- Run the production backend configuration against staging.
- Repeat the integration smoke suite.
- Repeat the minimum physical-device suite.
- Repeat Lighthouse and accessibility smoke tests.
- Confirm build logs contain no unresolved error or material warning.
- Record the release commit, artifact identity, environment configuration version, and database migration/seed state.

### 6.4 Rollback preparation

- Keep the previous known-good frontend deployment available.
- Keep the previous backend deployment or image available.
- Document how to restore the production database backup.
- Prefer backward-compatible backend changes so frontend and backend can roll back independently.
- Define rollback triggers:
  - Readiness failure.
  - Widespread API/CORS failure.
  - Contact messages not being stored.
  - Blank or unusable public routes.
  - Severe production performance regression.
  - Accidental exposure of sensitive data.
- Assign who decides and performs rollback.

### Exit criteria

- Clean checkout reproduces all tests and the production build.
- Release commits contain no secrets or obsolete artifacts.
- Staging is approved from the release commit.
- Rollback steps and database restoration are documented.

---

## Phase 7 — Production deployment

### Objective

Deploy the reviewed release with correct ordering, configuration, and recovery options.

### 7.1 Backend deployment

- Provision production environment variables through the host’s secret manager.
- Confirm the production MongoDB database, user permissions, backups, indexes, and network access rules.
- Confirm Cloudinary production credentials and folder strategy.
- Confirm Resend sender/domain verification and notification destination.
- Deploy the backend.
- Verify `/health` and `/ready` over HTTPS.
- Confirm production logs do not print secrets, tokens, full connection strings, or sensitive message bodies unnecessarily.
- Run only reviewed, idempotent migrations or content imports.
- Verify public resources directly before connecting the frontend.

### 7.2 Frontend deployment

- Set `VITE_API_URL` to the deployed production `/api/v1` base before building.
- Build once and deploy the resulting artifact.
- Configure SPA rewrite/fallback rules.
- Configure compression and caching.
- Configure the production domain, HTTPS certificate, and redirects between canonical host variants.
- Update `FRONTEND_ORIGINS` with the exact final frontend origin before public testing.
- If DNS or host changes alter the origin, rebuild/reconfigure and repeat CORS verification.

### 7.3 Immediate production smoke test

Test in a signed-out browser with a cold cache:

- `/`
- `/projects`
- Every project section filter
- Every `/projects/:slug`
- `/about`
- `/cv`
- `/contact`
- Unknown route
- Direct URL entry and refresh on every route type
- Navigation back to the Home surface
- Mobile viewport and one physical phone
- Reduced-motion/static fallback
- One controlled real contact submission

For the contact submission, verify storage and notification, then label or delete the test record according to the approved inbox policy.

### 7.4 Production configuration verification

- Allowed production origin succeeds.
- An unrelated origin is rejected.
- Cookies have the expected `Secure`, `httpOnly`, and `SameSite` attributes.
- `/ready` is connected to platform health monitoring.
- Rate limits operate behind the production proxy without grouping all visitors under one proxy IP.
- Public endpoints expose no drafts or admin-only fields.
- Security headers and HTTPS redirects are present.
- Assets return intended cache and compression headers.
- No request points to localhost, staging, or an old domain.
- No browser console error or repeated failed request occurs during a complete descent.

### 7.5 Launch observation

For the initial launch window:

- Monitor backend errors, readiness, response latency, rate-limit events, database connectivity, and notification failures.
- Monitor frontend exceptions and WebGL failures if a privacy-appropriate error tool is configured.
- Check Core Web Vitals after sufficient real-user data exists.
- Verify contact messages periodically without exposing their contents in logs or reports.
- Track issues by severity and use the rollback criteria when necessary.
- Avoid making unrelated production changes during the observation window.

### Exit criteria

- All production routes pass direct and navigated smoke tests.
- The production frontend communicates only with the production backend.
- Contact storage and notification work.
- No blocker or high-severity launch issue is observed.
- Rollback remains available until the deployment is considered stable.

---

## Phase 8 — Post-launch closeout

### Objective

Close the launch with evidence, maintenance instructions, and a prioritized follow-up list.

### Tasks

- Record final production URLs, release commit, deployment identifiers, and launch time.
- Save sanitized test, performance, accessibility, and device reports.
- Confirm the database backup and previous deployment retention period.
- Remove temporary staging contact messages according to the approved policy.
- Rotate any temporary staging credentials or notification destinations.
- Update the frontend README with final local, staging, build, and deployment instructions.
- Update the API contract if deployment exposed a real contract change.
- Record accepted limitations separately from defects.
- Convert deferred improvements into prioritized issues rather than changing the stable release silently.
- Schedule a follow-up review after real traffic provides Core Web Vitals and error data.

### Exit criteria

- Launch evidence and recovery information are stored safely.
- Documentation matches the deployed system.
- Temporary launch data and access are cleaned up.
- Remaining work has an owner and priority.

---

## Required test matrix

The release is not complete until every row has a recorded result.

| Area | Local production preview | Staging | Production |
| --- | --- | --- | --- |
| Backend tests | Required | Required before deploy | Release artifact already passed |
| Frontend tests and lint | Required | Required before deploy | Release artifact already passed |
| Production build | Required | Exact build deployed | Exact build deployed |
| API/profile/projects | Required | Required | Required smoke |
| CV/skills/certifications | Required | Required | Required smoke |
| Contact storage | Mock tests plus controlled integration | Required | One controlled smoke submission |
| Contact notification | Controlled environment | Required | Required once after launch |
| CORS allowed/rejected | Required | Required | Required |
| Direct SPA routes | Required | Required | Required |
| Physical mobile devices | Smoke | Full matrix | Minimum smoke |
| Reduced motion/Data Saver/WebGL fallback | Required | Full matrix | Minimum smoke |
| Lighthouse/Core Web Vitals lab checks | Baseline | Final | Post-launch observation |
| Keyboard/screen reader/200% text | Full review | Confirmation | Minimum smoke |

---

## Final launch gate checklist

### Integration

- [ ] Production URL and domain topology approved.
- [ ] Frontend built with the production API URL.
- [ ] Profile, projects, project detail, skills, certifications, and CV verified.
- [ ] Contact message storage and notification verified.
- [ ] `qa@example.com` decision recorded and executed.
- [ ] CORS allowlist and rejection tests pass.
- [ ] Cookies, CSRF header, rate limiting, proxy trust, and readiness pass.
- [ ] Draft content is not publicly accessible.

### Devices and 3D

- [ ] Lower-powered Android tested.
- [ ] Typical Android tested.
- [ ] Flagship phone tested.
- [ ] iPhone/Safari tested.
- [ ] Lower-powered laptop tested.
- [ ] Touch, rotation, cold load, slow network, reduced motion, Data Saver, and WebGL failure tested.
- [ ] Automatic tier thresholds tuned and documented.
- [ ] No blocker or high-severity scene issue remains.

### Performance

- [ ] Production bundle report reviewed.
- [ ] Lazy 3D chunk is below budget or exception approved.
- [ ] Duplicate Draco delivery audited and resolved.
- [ ] GLB still decodes on required browsers.
- [ ] Images are responsive, compressed, dimensioned, and lazy-loaded appropriately.
- [ ] Fonts are subset/optimized, licensed, and cached.
- [ ] Compression and cache headers verified.
- [ ] Lighthouse key-route checks pass the agreed budgets.
- [ ] Core Web Vitals targets pass in representative tests.

### Accessibility and content

- [ ] Keyboard navigation passes on every route.
- [ ] NVDA and VoiceOver review completed.
- [ ] 200% text enlargement and narrow reflow pass.
- [ ] Final media contrast is checked.
- [ ] Every informative image has meaningful alt text.
- [ ] Reduced-motion/static experience contains all essential information.
- [ ] Links, dates, claims, names, and spelling are proofread.
- [ ] CNC Steel Clamp content is correct.
- [ ] Metadata, favicon, Open Graph image, and document titles are final.

### Release

- [ ] Old redesign ZIP archived or removed.
- [ ] Unused assets removed after reference checks.
- [ ] Worktree organized into clean, reviewable commits.
- [ ] No secrets, local data, generated reports, or test messages are committed.
- [ ] Clean checkout passes install, tests, lint, and build.
- [ ] Staging approved from the release commit.
- [ ] Database backup and rollback instructions verified.
- [ ] Production routes and direct URLs pass.
- [ ] Production contact delivery passes.
- [ ] Launch observation completed without unresolved high-severity issues.

---

## Definition of done

The portfolio is ready to launch when the exact production artifact has passed backend integration, the required physical-device matrix, performance budgets, keyboard and screen-reader review, 200% text reflow, staging acceptance, and production route checks. The production configuration must use exact CORS origins, verified contact delivery, a connected readiness check, recoverable database backups, and a documented rollback path. Every remaining limitation must be explicitly accepted and recorded rather than left as an unknown.
