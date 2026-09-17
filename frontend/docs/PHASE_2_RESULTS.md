# Phase 2 — Public content integration

Completed 2026-09-08. Phase 3 (bare Version B scene) is next.

## Implemented

- Published project collection connected to `GET /projects`, using the existing `section` taxonomy.
- Filter and page selection stored in the URL. Changing a filter returns to page one without unnecessarily scrolling or moving keyboard focus away from the control.
- Pagination uses API total/limit metadata; handles empty sections, out-of-range pages, invalid filters, errors, loading, retry, and stale request cancellation.
- `/projects/:slug` loads the public detail endpoint and displays actual descriptions, supplied tags/media/links, and a recoverable 404 when unpublished or missing.
- About displays the full profile bio using react-markdown and rehype-sanitize. Raw HTML is disabled; inline Markdown images are represented by their alt text. Project galleries/cover images use the structured media fields.
- CV distinguishes profile-loading/failure from an absent resume and only links to a supplied HTTP(S) URL.
- Contact form connected to `POST /messages`: required fields, length checks, optional subject, hidden empty honeypot, field errors/focus, pending lock, cancellation, 15-second timeout, retained text after errors, and confirmed acceptance messaging.
- Contact success means the API accepted the message; the interface never claims notification-email delivery. Network/time-out ambiguity does not trigger an automatic duplicate submission.
- No admin interface, uploads, database seeding, authentication changes, new backend endpoints, or 3D effects were introduced.

## Approved data migration

The owner explicitly approved migrating these two reviewed records:

| Project | ID | Previous | Current |
| --- | --- | --- | --- |
| CNC Steel Clamp | `6a162f1d19517c94aacda865` | `category: cnc`, no section | `section: hardware`, category removed |
| CNC Aluminum Clamp | `6a162cbc19517c94aacda863` | `category: cnc`, no section | `section: hardware`, category removed |

`scripts/migrate-reviewed-projects.mjs` first ran read-only, then applied a conditional update matching exactly these IDs and original fields. Two records matched and two were modified. No other fields were updated by the script.

Original projected fields were saved before the write at:

```text
frontend/.local/project-section-before-1788829449650.json
```

That directory is ignored by Git. A rollback, if needed and separately authorized, should conditionally restore the recorded category and remove section only if the records still match this migration's resulting fields; do not overwrite subsequent edits. The snapshot is a field-level recovery record, not a full database backup.

Live API verification after the migration: Hardware returns both projects; Systems returns an empty result. Backend source and original iceberg geometry were not modified.

## Verification

- Production build passed; JS bundle reported by Vite: 427.57 kB / 134.40 kB gzip. This is a bundle-size measurement, not a rendering-performance claim.
- Oxlint passed without warnings.
- 8 Node test entries passed, including the retained 2,001 camera samples and API-client behavior.
- 19 Vitest test cases passed, covering field validation/focus, duplicate-submit protection, success timing, 400/429/500 errors, timeout ambiguity, unmount cancellation, real API-adapter JSON/cookie behavior, pagination, filter reset, stale requests, empty/missing projects, Markdown safety, About, and CV states.
- Browser inspected real project collection and detail rendering, Systems empty state, missing-project 404, About, absent CV, and empty-contact-form validation with focus on Name.
- Actual contact requests and email notifications were not sent. All successful/error/timeout submission tests use mocks. No browser form containing valid test data was submitted to the live backend.
- Multi-page pagination and available CV were verified with fixtures because live data currently has two projects and no CV.
- Local development runtime used Node 24.19.0. npm was launched through the available package runner because it is not directly on this session's PATH; the npm lockfile remains the project's dependency source of truth.

## Remaining content and later checks

- Profile contains seeded placeholder copy; the full bio/CV still need owner content.
- The Steel Clamp's current summary mentions aluminum. This came from the backend and was preserved for owner review.
- Real-world contact delivery/notifications require an agreed live test destination; they are not proven by mocked frontend tests.
- Exhaustive viewport, text enlargement, and 3D/performance validation remain in later phases.
- No public deployment or commit was made. The project remains at the requested local Phase 2 milestone.
