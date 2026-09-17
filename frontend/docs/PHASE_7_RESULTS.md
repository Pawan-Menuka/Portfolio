# Phase 7 — Integrated structural review

Reviewed 2026-09-08–09. The structural frontend is ready for owner review before runtime realism. No deployment, database write, contact submission, backend edit, or geometry change was made.

## Changes from the review

- About now omits the known seeded API-edit instruction and retains the existing draft introduction message. Supplied biography content is still displayed.
- Unknown routes now receive a matching page description instead of a Projects description.
- Added shell integration tests for empty profile data, outage/retry, identity metadata, focus, and history, plus a regression check for the About placeholder.
- Added opt-in local diagnostics at `/?review`, including timing data in the hidden `#review-metrics` output and an actual WebGL context-loss control. `/?review=model-failure` exercises a missing GLB. These are development-only; the production output was searched to confirm their exclusion.

## Verification

| Area | Evidence and result |
| --- | --- |
| Automated checks | Lint and production build pass. 35 UI tests and 8 Node test entries pass; the changed About suite was rerun after its final edit. Camera verification includes 2,001 reference samples. |
| Direct routes | Production preview returns the SPA entry with HTTP 200 for Home, Projects, project detail, About, CV, Contact and an unknown path. Browser project-detail refresh renders the real CNC Steel Clamp record. About, CV, Contact and not-found views were inspected directly. |
| Navigation | Project list → detail → browser Back restores Projects and main-content focus. The descent link reaches Full-stack. All six content stops were inspected; upward wheel scrolling returns to progress 0. Keyboard focus remains visible, and invalid Contact submission focuses Name. |
| Data states | Real profile/projects render. The real Full-stack filter returns the empty state; the real CV is unavailable. Automated tests cover empty profile, outage/retry, missing projects, malformed responses and races. Contact pending, success and errors are mocked; no message was sent. |
| Scene failures | A deliberately missing model restores the poster with zero canvases and all six HTML sections available. Actual WebGL context loss also removes the canvas and clears inert sections. Unit tests cover unavailable WebGL, timeout and preference changes. |
| Responsive layout | Desktop 1440×900, 1366×768, 1920×1080 and 2560×1080 inspected across this review. All stops inspected at 1440×900; representative Full-stack and Systems stops rechecked at larger aspects after settling. Mobile 390×844 has no canvas and all six sections. |
| Text enlargement | Temporary 32px root text at 320×740: Home uses static flow with all sections; Contact controls fit with no horizontal overflow. Override removed. Reduced-motion selection and cleanup remain covered by simulated media-policy tests; the OS preference itself was not changed. |
| Screenshots | Opening, Blockchain, Systems, Hardware, Creative, Contact, mobile fallback, 16:9 Full-stack and ultrawide Systems captures were recorded inline in this task for owner review. |
| Integrity | No backend source diff. GLB and camera-path hashes match the approved copies below. |

The eventual host must return `index.html` for client routes while serving actual asset paths normally. Vite preview proves the compiled app works locally; it does not configure the eventual host.

## Performance observations

Machine: Windows, Intel Core i7-13650HX (20 logical processors), with NVIDIA RTX 4060 Laptop GPU and Intel UHD Graphics installed. The active GPU was not identified. Codex in-app browser reported Chromium 152, DPR 1; network was localhost without throttling.

| Measurement | Result | Scope |
| --- | --- | --- |
| Model load/parse/inspection | 28ms initially and 29ms after mode re-entry | Warm local development requests; excludes initial JS startup and first paint. Phase 3 observed 43ms and 156ms. These small samples do not establish a speed improvement. |
| Reverse-scroll frame cadence | 699 sampled intervals; median 16.7ms, p95 17.4ms | Observed scene progress updates, not GPU execution time or a promised FPS. Hidden-tab and gaps of 250ms or more were excluded to avoid idle demand-render gaps. No main-thread long tasks were reported in that sample. |
| Warm initial resource transfer | 22,153 bytes reported by main-document Resource Timing | Cached development load; excludes navigation response, cross-origin API, and worker-originated font requests. Not a cold-page or production total. |
| Mode-switch network behavior | Each GLB/wrapper/WASM request reported 300 transferred bytes with full cached encoded sizes, before and after desktop → mobile → desktop | Header-only cache revalidation was observed, rather than repeated full bodies. One → zero → one canvases. Worker font cache behavior was not independently measured. |
| Production main JS | 432.63kB / 135.98kB gzip | Phase 3 approximately 429kB / 135kB gzip. |
| Production lazy scene JS | 1,055.76kB / 294.11kB gzip | Phase 3 approximately 935kB / 250kB gzip; added labels/font rendering account for scene growth. Large-chunk warning remains. |
| Other principal assets | GLB 78,080B; poster 31,652B; Draco wrapper 58,456B; Draco WASM 192,420B; Inter font 876,576B; CSS 15.69kB | Asset sizes, not a summed measured transfer. Initial static mode does not import the 3D scene; font requests originate in its text worker. |

Production also emits dependency-default Draco assets in addition to the explicitly selected local decoder files. Emitted files do not imply downloads; loader paths remain explicit. Before launch, measure cold production loading on a representative slower device/network and consider font subsetting and scene-bundle optimization. Do not add visual effects against an assumed performance budget.

## Integrity hashes

- `public/models/iceberg-b.glb`: `3c94763b3235326f89f5f5f2de62a8ec6ea8fe482959a0a4516d9274fae5b895`
- `src/features/iceberg/camera-path.mjs`: `48d9a930987e92a4c4e8b3531e697be6491c421652b66acb2258c0f70a49bd91`

Decoded model remains two meshes, 3,848 triangles, dimensions 56.930330 × 100 × 47.359182, and zero waterline gap.

## Owner review and remaining work

Review the scene's scroll pace, framing and reading space with your physical mouse/trackpad. The 1440px content width intentionally leaves outer space on wide monitors; close-up stops crop portions of the iceberg at the canvas edges. This remains a visual choice to review, not a geometry change made during testing.

The seeded CNC Steel Clamp record still describes aluminum, and project descriptions/profile details are drafts. Resolve these content choices before launch. The CV is currently absent. A transient backend database connection error appeared in retained server logs during the session; subsequent real profile/project requests succeeded. No backend configuration was changed.

The installed Three/R3F combination still reports a non-blocking `THREE.Clock` deprecation. Cross-browser/device testing, cold production transfer, worker-font caching, live contact delivery and physical input feel are not claimed as completed.

Stop at this milestone for owner review. Phase 8 lighting, water and underwater realism follow that review; public release belongs to the later integration phase.
