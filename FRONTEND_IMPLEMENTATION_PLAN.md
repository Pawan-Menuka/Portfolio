# Iceberg Portfolio — Frontend Implementation Plan

Status: Phases 0–6 implemented. Phase 7 structural review completed on 2026-09-09 with documented measurement limits and manual owner-review items. The two legacy project records were migrated with owner approval in Phase 2. See the phase reports in `frontend/docs/`. Owner review is next, before runtime realism.

## Objective and scope

Build the public portfolio frontend on the existing React + Vite, React Router, Three.js, React Three Fiber, and drei foundation. Connect it to the completed backend and use the approved Version B iceberg as the desktop visual experience.

This plan expands the owner's five-step brief into implementation phases with explicit completion checks. The first milestone ends with a working structural frontend and a browser review. Runtime realism and public launch follow in separately reviewed phases.

Source references:

- `API-CONTRACT.md`: endpoint and response contract; backend source resolves discrepancies.
- `BACKEND_FINAL_PLAN.md`: backend history and existing constraints.
- Owner's `Iceberg_Portfolio_Next_5_Frontend_Steps.md`: current scope and stop point.
- Existing iceberg assets and camera studies from the earlier session.

## Decisions already made

- Preserve the existing frontend, dependencies, and npm lockfile. No new scaffold is required.
- Use Version B. Keep Version A archived as an alternative; do not build a second frontend or a public A/B switch.
- Keep the approved iceberg geometry unchanged unless browser evidence exposes a specific issue.
- Reuse the existing camera path, damping, stop positions, and 450-degree orbit initially.
- Keep the portfolio usable through HTML content and direct routes without WebGL.
- Use a static/lightweight experience on mobile and for reduced motion.
- Use backend profile content when present; approved Pawan placeholder copy is only a development fallback for empty fields.
- Keep the backend locked. Record any demonstrated contract gap before proposing a backend change.
- Admin dashboards, blog pages, uploads, and content-editing interfaces are outside this milestone. Existing backend capabilities do not automatically expand frontend scope.
- Do not add advanced water, fog, particles, glow, caustics, or final realism before the structural review.

## Phase map

| Phase | Deliverable | Corresponds to brief |
| --- | --- | --- |
| 0 | Verified foundation and asset handoff | Preparation |
| 1 | Routes, navigation, shared API/content layer | Step 1 |
| 2 | Useful public pages connected to the backend | Step 1 |
| 3 | Bare Version B scene with early fallbacks | Step 2 |
| 4 | Existing camera driven by document scroll | Step 3 |
| 5 | Temporary labels and composition checks | Step 4 |
| 6 | Real hero composition and finished fallback behavior | Step 5 |
| 7 | Integrated browser review and structural milestone | Five-step stop point |

Complete the relevant checks before progressing. Keep each phase's changes bounded and record actual results, outstanding issues, and any justified deviations in this document. Suggested commit boundaries do not mean commits or pushes have already been authorized or made.

## Phase 0 — Verify the foundation and bring in the assets

### Implementation tasks

- [x] Inspect repository instructions and current changes; preserve existing work.
- [x] Confirm the installed dependency state and run the existing frontend build/lint commands.
- [x] Verify local frontend/backend connectivity, including `/ready` and `/api/v1/profile`, without exposing environment secrets.
- [x] Treat previous connectivity results as historical evidence, not a substitute for this baseline check.
- [x] Confirm the actual profile/project response shapes against the API contract. **Phase 0 finding:** two projects used legacy `category`; resolved in Phase 2 by the approved, scoped migration.
- [x] Copy the selected assets into the frontend; retain original Blender files in their existing location.
- [x] Record provenance and source hashes so the selected asset is unambiguous.

### Asset handoff

Original asset root:

```text
C:/Users/Asus/Documents/Codex/2026-09-06/the/outputs/
```

| Source relative to asset root | Intended destination/use |
| --- | --- |
| `realism-b/iceberg-realism-b.glb` | `frontend/public/models/iceberg-b.glb` |
| `portfolio-b/hero.png` | Optimized static hero in `frontend/public/images/` |
| `camera-study/camera-path.mjs` | `frontend/src/features/iceberg/camera-path.mjs` |
| `camera-study/camera-path.test.mjs` | Retained/adapted camera checks |
| `camera-study/path-samples.json` | Reference/test fixture; not required in the production bundle |
| `camera-study/validation.json` | Geometry clearance reference |

### Completion gate

- [x] Existing app builds; lint issues are understood and addressed within scope.
- [x] API access is verified or a concrete runtime blocker is recorded.
- [x] Version B and its static fallback are available locally in the frontend.
- [x] No backend changes or replacement scaffold were needed.

## Phase 1 — Build routes, navigation, and shared data access

### Implementation tasks

- [x] Replace the connectivity-only home page with the portfolio shell.
- [x] Add Home `/`, Projects `/projects`, About `/about`, CV `/cv`, and Contact `/contact`.
- [x] Add a useful not-found route.
- [x] Keep direct navigation accessible on desktop and mobile.
- [x] Add semantic page structure, visible focus, a skip link, active navigation state, and route titles.
- [x] Define scroll/focus restoration when navigating between pages and using browser Back/Forward.
- [x] Keep the Home journey independent from the direct content routes; reuse content components and data.
- [x] Improve the existing API helper: validate configuration gracefully, normalize the base URL, preserve merged headers correctly, handle non-JSON/error responses, and accept request cancellation.
- [x] Retain `credentials: 'include'` as required by the current API contract.
- [x] Add a small shared profile-loading layer so routes do not each invent fetch/error behavior.
- [x] Define loading, empty, and unavailable states that leave navigation usable.

### Completion gate

- [x] Every core route opens directly and navigation works without a canvas.
- [x] Browser history and keyboard focus behave predictably.
- [x] A profile request failure does not crash the app.
- [x] Real profile data appears in the interface.

Suggested checkpoint: `feat(frontend): build portfolio shell and shared data layer`

## Phase 2 — Connect the public content pages

### Backend mapping

Paths below are relative to the configured `/api/v1` base URL.

| UI | Existing API | Required handling |
| --- | --- | --- |
| Identity/About | `GET /profile` | Empty fields, roles/socials, safe Markdown bio |
| Projects | `GET /projects` | Published results, pagination metadata, `section` filtering |
| Project detail | `GET /projects/:slug` | Add `/projects/:slug` when the list uses internal detail links; handle 404 |
| CV | `GET /profile` → `resume.url` | `resume: null` means unavailable; use the actual returned link |
| Contact | `POST /messages` | Validation, pending state, 400/429/network errors, confirmed success |

### Implementation tasks

- [x] Display backend identity and About content; render Markdown safely without raw HTML injection.
- [x] Build a projects list using the existing section taxonomy: `full-stack`, `blockchain`, `systems`, `hardware`, `creative`.
- [x] Respect pagination; do not silently present only the first page as the entire portfolio.
- [x] Show an honest empty state when no projects are published.
- [x] Provide actual project destinations/details where data supports them; avoid dead placeholder links.
- [x] Build the CV page with an available/unavailable state driven by `profile.resume`.
- [x] Build Contact using the real contract: name 1–100 characters, email, optional subject up to 200 characters, body 10–3000 characters, and hidden empty `website` honeypot.
- [x] Prevent duplicate submissions while pending; preserve input after failure.
- [x] Show success only after the API confirms acceptance; do not claim email delivery.
- [x] Keep development placeholders distinguishable from real projects or personal claims. Backend seeded copy is preserved and documented for content review.
- [x] Keep API loading and form state separate from scene/camera state.

### Completion gate

- [x] Core public content uses real backend responses.
- [x] Empty profile, absent CV, zero projects, validation errors, and API failure are handled.
- [x] Contact behavior is tested with mocks first; no live submission was made. Any later live test needs an agreed destination.
- [x] No admin UI, uploads, database seeding, or backend rewrites were introduced. Only the two approved database category migrations were applied.

Suggested checkpoint: `feat(frontend): connect public portfolio content to backend`

## Phase 3 — Load Version B in a bare scene

### Implementation tasks

- [x] Create a lazily loaded desktop scene boundary.
- [x] Select static/mobile/reduced-motion behavior before importing the 3D feature.
- [x] Show the static hero immediately while the model loads.
- [x] Configure Draco decoding for the compressed GLB; avoid an accidental external decoder dependency by choosing an explicit asset strategy.
- [x] Verify exactly `ice_above` and `ice_below`, expected bounds, Y-up orientation, scale, and zero waterline.
- [x] Use simple lighting and the exported portable materials initially.
- [x] Check for a visible waterline gap, incorrect culling, and orientation problems.
- [x] Add scene loading/error handling and a WebGL-unavailable/context-loss fallback.
- [x] Bound rendering resolution and avoid unnecessary continuous work when the scene is hidden or removed.
- [x] Verify unmount cleanup and behavior under the existing React Strict Mode.

Do not add water, fog, marine snow, glow, caustics, or new material complexity in this phase.

### Completion gate

- [x] Version B renders at normal desktop sizes with correct geometry and no blocking console errors.
- [x] Navigation and content work during loading and after simulated model failure.
- [x] Initial static mode does not request the model or desktop 3D bundle.
- [x] Loading/render performance has a recorded baseline.

Suggested checkpoint: `feat(frontend): integrate Version B with scene fallbacks`

## Phase 4 — Port the existing scroll camera

### Implementation tasks

- [x] Import the existing pure camera sampler and damping helper rather than rewriting the path.
- [x] Map the Home journey's document-scroll range to normalized progress from 0 to 1.
- [x] Use one scroll source; avoid a second independently scrolling canvas area.
- [x] Drive camera position, look target, and content timing from the same damped progress.
- [x] Update frame values through refs/the render loop instead of React state on every frame.
- [x] Preserve the stop sequence and planned 450-degree rotation.
- [x] Keep the canvas visible through the Home journey without covering navigation or intercepting ordinary document scrolling.
- [x] Map navigation/anchors to actual DOM targets; handle route changes, history restoration, resize, and a page loaded partway down.
- [x] Recompute scroll bounds when viewport or content dimensions change; keep loading from causing avoidable layout shifts.
- [x] Respect reduced-motion changes and background-tab timing.
- [x] Port and run the meaningful camera tests; add integration checks for scroll-to-progress mapping and lifecycle behavior.

Exact reversal means the same geometric path is sampled backward. Damping may briefly lag behind the requested scroll position; it must not accumulate rotation or trigger one-way sequences.

### Completion gate

- [x] Intro → Contact and Contact → Intro follow the same path.
- [ ] Final physical input review: keyboard and browser-generated wheel scrolling passed; native scrollbar dragging and physical trackpad feel remain manual checks (automation viewport limitation). See Phase 4 results.
- [x] No observed mesh clipping or sudden camera jumps.
- [x] Resize and route return do not corrupt progress or leave stale scroll listeners.

Suggested checkpoint: `feat(frontend): integrate validated scroll camera`

## Phase 5 — Add temporary labels and validate content space

### Implementation tasks

- [x] Add temporary Full-stack, Blockchain, Distributed Systems, Hardware / CNC, Creative, and Contact labels at the intended stops.
- [x] Use drei `Billboard` and `Text` for scene labels, with an explicit font asset/loading strategy.
- [x] Keep important headings, descriptions, links, and navigation available in HTML.
- [x] Reveal/fade labels around the settled reading intervals using the shared progress.
- [x] Check silhouette overlap, label occlusion, left/right placement, and text contrast.
- [x] Test 1920×1080 (16:9), 1440×900 (16:10), 1366×768 laptop, and 2560×1080 ultrawide layouts.
- [x] Check all content stops, not only the opening frame.
- [x] Make only evidence-backed small composition/camera offsets; record changes and rerun relevant path checks.

### Completion gate

- [x] Each narrative stop has readable labels and usable space for real content.
- [x] Labels do not compete with the iceberg silhouette at the tested sizes.
- [x] HTML equivalents remain accessible when scene labels are absent.
- [x] Any path adjustment is documented and verified against the mesh.

Suggested checkpoint: `feat(frontend): validate narrative labels and composition`

## Phase 6 — Finish the first hero and fallback experience

### Implementation tasks

- [x] Apply a coherent dark, cold visual theme and typography hierarchy throughout the shell.
- [x] Compose identity copy in negative space alongside the iceberg.
- [x] Use profile content with approved Pawan draft fallbacks where fields are empty.
- [x] Explain the deeper-work metaphor briefly and provide a clear scroll cue.
- [x] Keep Projects, About, CV, and Contact directly accessible.
- [x] Finish mobile as a static hero plus normal vertical content.
- [x] Finish reduced motion as static imagery plus normal content, with no orbit requirement.
- [x] Make scene loading/failure transitions visually stable and keep controls usable.
- [x] Check keyboard access, focus contrast, 200% text enlargement, and small-screen overflow.
- [x] Add useful page titles/descriptions using available profile metadata; remove starter branding.
- [x] Verify resizing between modes does not create duplicate canvases or stale listeners.
- [x] Measure repeat-download/cache behavior during Phase 7 network review; GLB/decoder cache revalidation recorded, worker-font caching remains a measurement limitation.

### Completion gate

- [x] The opening clearly communicates identity and role.
- [x] Desktop copy and model are balanced.
- [x] Mobile, reduced-motion, loading, API-error, and WebGL-error modes all remain usable.
- [x] No advanced realism effects have been added prematurely.

Suggested checkpoint: `feat(frontend): finish hero composition and accessible fallbacks`

## Phase 7 — Validate the integrated structural frontend

### Required review

- [x] Run production build and lint, plus relevant camera/API/UI checks.
- [x] Test direct route entry and refresh; document the SPA fallback required by the eventual host.
- [x] Test navigation, history, keyboard use, all camera stops, upward reversal, and route return; physical input review remains manual.
- [x] Test profile/project success, empty data, missing CV, API outage, and contact error/pending/success states; submission states tested with mocks.
- [x] Test model failure and WebGL loss/unavailability.
- [x] Test mobile, reduced motion, text enlargement, and the desktop aspect-ratio matrix; reduced-motion preference simulated in tests.
- [x] Measure warm initial transfer, model-loading time and frame cadence on identified hardware/browser settings; cold production and worker-font transfers remain future measurements.
- [x] Compare measurements against the Phase 3 baseline; do not claim an unmeasured frame rate.
- [x] Confirm original geometry and backend remain intact.
- [x] Record screenshots and findings for the requested browser composition review.
- [x] Update frontend README with local startup, configuration, asset provenance, and known limitations.

### Milestone handoff

Deliver a working local structural prototype, a short validation report, and any remaining issues. Review the actual camera feel, content readability, and mobile behavior with the owner.

**Stop here before adding runtime realism.** The five-step brief explicitly requests a review at this point. A production deployment or backend merge is not required to evaluate this milestone.

## Later phases — planned direction, not part of the first milestone

### Phase 8 — Runtime realism after review

Prioritize browser-tested lighting and underwater readability, then subtle water and depth effects. Add particles, glints, or caustics only when they improve the result within the measured performance budget. Recheck fallback and accessibility behavior after each meaningful addition.

### Phase 9 — Content completion and production integration

Replace remaining draft content, verify real CV/project/contact destinations, choose the deployment arrangement, and configure frontend/backend origins. The current authentication cookie expects same-site deployment if authenticated features are later included; preserve that requirement when selecting domains/proxies. Confirm notification configuration with the backend owner rather than assuming message acceptance means an email was delivered.

Validate a staging build against the intended backend. Review any merge changes, preserve the working backend, and obtain launch approval before public release.

## Suggested source organization

Adapt this to the implementation; do not create empty abstractions merely to match the tree.

```text
frontend/src/
  components/          shared navigation, layout, loading/error UI
  pages/               Home, Projects, About, CV, Contact, NotFound
  lib/                 API client and shared data handling
  features/iceberg/    scene, model, camera adapter, labels, camera-path.mjs
  ...                  existing app entry points and shared styles
frontend/public/
  models/              selected Version B GLB
  images/              static hero fallback
```

## Tracking summary

- [x] Phase 0 — Foundation verified; see recorded project-data discrepancy
- [x] Phase 1 — Shell and data layer
- [x] Phase 2 — Public content integration
- [x] Phase 3 — Bare Version B scene
- [x] Phase 4 — Scroll camera integration (manual physical-input review retained)
- [x] Phase 5 — Labels and composition
- [x] Phase 6 — Hero and fallbacks (network-cache review retained for Phase 7)
- [x] Phase 7 — Structural review (measurement limits and manual review documented)
- [x] Owner authorized Phase 8 after structural review
- [x] Phase 8 — Runtime realism (see `frontend/docs/PHASE_8_RESULTS.md`)

Next action: owner-led UI design changes, then Phase 9 content and production integration. See `frontend/docs/PHASE_8_RESULTS.md` for realism verification, measurements and remaining device review items.
