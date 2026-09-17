# Phase 1 — Portfolio shell and shared data layer

Completed 2026-09-07.

## Changes

- Added Home, Projects, About, CV, Contact, and not-found routes using the existing React Router dependency.
- Added shared navigation, active link styling, skip link, keyboard focus treatment, route titles, and router-managed scroll restoration.
- Added a preliminary dark shell with the existing static Version B image. No WebGL/Three.js import is needed to navigate or read the pages.
- Shared profile provider persists across route changes. It supports loading, retry, unmount cancellation, a 12-second timeout, invalid profile handling, and a non-blocking error notice.
- Profile name/headline/short bio appear in the shell/Home/About. CV uses the returned resume URL when available, otherwise an unavailable state.
- API client now validates configuration at request time instead of crashing during module import; normalizes trailing slashes; merges headers safely; preserves cancellation; includes cookies; checks response envelopes; and handles network/non-JSON/server failures.
- Project collection and Contact remain explicitly unfinished page content for Phase 2. No fake project list, form submission, or CV download was added.
- Existing Vite project/dependencies/lockfile preserved. No backend or database changes.

## Verification

- Production build passes.
- Oxlint passes without warnings after removing a redundant effect-driven state update.
- Eight Node test entries pass: seven API-client cases and the retained 2,001-sample camera check.
- Browser verified Home, Projects, About, CV, Contact, and not-found rendering.
- Verified Projects direct refresh, About/CV Back and Forward navigation, per-route titles, and focus on main content after navigation.
- Verified keyboard Tab from main content reaches the Home call to action with a visible focus ring.
- Confirmed the API-offline error notice and available navigation, followed by successful real profile rendering after the backend started.
- Current database profile includes seeded placeholder bio wording. It is currently displayed as received; replace that content before public release. Missing CV was correctly represented as unavailable.
- Inspected the initial Home composition in the browser. Exhaustive viewport/text-enlargement checks remain in Phases 5–7.

## Limits and next phase

This is a local phase deliverable, not a deployed website. A production host will need an SPA fallback for direct route entry.

Full Markdown About content, projects/pagination/detail routes, and contact submission belong to Phase 2. The legacy project `category` / missing `section` discrepancy recorded in Phase 0 remains unresolved; no migration has run.

The later hero, 3D camera, labels, and realism phases are not marked complete by this shell implementation.
