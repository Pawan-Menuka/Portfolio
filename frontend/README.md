# Iceberg portfolio frontend

React + Vite + React Router. Phase 3 adds a lazy Three.js/R3F Version B desktop scene with static mobile, reduced-motion, loading, and error fallbacks. The public pages remain usable without a canvas.

## Local development

Use a current supported Node version (verified with Node 24.19.0) and npm. Install with `npm ci`, preserve `package-lock.json`, and configure `.env` using `.env.example`:

```text
VITE_API_URL=http://localhost:5000/api/v1
```

Start the existing backend in a separate terminal using its README/contract configuration and `npm start` from `backend/`. Then run `npm run dev -- --host localhost --port 5173 --strictPort` here. Use `http://localhost:5173`; `127.0.0.1` is a different CORS origin.

## Checks

```text
npm test
npm run lint
npm run build
```

Tests use mocked API calls for submissions; they do not create messages or send notifications. The Node camera test compares the approved 2,001-sample fixture. UI tests cover projects, pagination, request races, contact states, and sanitized Markdown.

## Current routes

- `/`: identity/profile and responsive 3D/static iceberg hero.
- `/projects`: real published projects, URL section filter, and pagination.
- `/projects/:slug`: project descriptions, optional media/tags, and supplied external links.
- `/about`: profile and sanitized Markdown biography.
- `/cv`: real resume URL or unavailable/error/loading state.
- `/contact`: validated contact form using `POST /messages`.
- Unmatched routes and missing project slugs provide recovery links.

The production host must serve the SPA entry point on direct route requests. No hosting configuration or deployment has been created in these phases.

## Assets and data

See `docs/iceberg-assets.json` for original asset paths, hashes, and transformations. Original Blender assets remain outside this repository. Camera reference fixtures are under `tests/fixtures/iceberg` and are not shipped as public assets.

The two reviewed legacy CNC projects were migrated with owner approval to `section: hardware` on 2026-09-08. Their original category fields are saved in the ignored `.local/` directory. The migration script defaults to dry run and refuses to reapply when its preconditions no longer match. See `docs/PHASE_2_RESULTS.md`.

The backend still contains draft profile copy and project copy that needs owner review before launch. No biography, CV, or project achievements have been invented. Live contact delivery and notifications have not been exercised by the test suite.

Scene verification, local Draco provenance, and performance baseline: see docs/PHASE_3_RESULTS.md. DPR is capped at 1.5. Phase 4 connects document scroll to the validated camera path; see docs/PHASE_4_RESULTS.md. Phase 5 adds six temporary labels and matching HTML navigation; see docs/PHASE_5_RESULTS.md. The scene font and its license are under public/fonts/.

Phase 6 adds the ocean visual theme, hero draft-copy treatment, metadata, and enlarged-text/static fallbacks. See docs/PHASE_6_RESULTS.md. Phase 7 is reviewed in docs/PHASE_7_RESULTS.md, including cache behavior and measurement limits. Phase 8 adds physical ice materials, procedural ocean reflection/refraction, depth tint and subtle particles. Its demand canvas invalidates at 24 Hz while visible for ambient motion and more frequently during scrolling; hidden/offscreen ambient animation pauses. See docs/PHASE_8_RESULTS.md for measurements and approximations. Owner-led UI design changes are next.

For a compiled local preview, run `npm run build`, then `npm run preview -- --host localhost --port 5173 --strictPort` while the backend runs. Stop the development server first because both use port 5173. This preserves the configured local API origin.

Development-only diagnostics: open `/?review` to collect timings in the hidden `#review-metrics` output and enable a WebGL-loss control; `/?review=model-failure` checks the missing-model fallback. Reload without the query to leave review mode. Neither the diagnostics nor the failure URL override is included in production. No diagnostics send data or create contact messages.

Known limits: large lazy scene bundle, full Inter font, non-blocking Three.Clock deprecation, draft profile/project copy and no current CV. Physical input feel, cold production loading, worker-font caching and live message delivery still require the checks recorded in Phase 7.
