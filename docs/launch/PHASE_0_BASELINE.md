# Phase 0 launch baseline

Captured: 2026-09-12 20:49:45 +05:30

## Source state

| Item | Value |
| --- | --- |
| Branch | `Develop` |
| Commit | `79ac002d921533df9b0ec8362ed9f4de44074c13` |
| Node | `v24.19.0` |
| npm used for baseline | `11.6.0` via a temporary bundled `pnpm dlx` runtime; npm is not directly on this shell's `PATH` |
| Backend lockfile SHA-256 | `5906505A086D09B0C2D812DC0B8D5FF52DC20C6CD279729147AEA1B7CE7E52B8` |
| Frontend lockfile SHA-256 | `D3D8AEC0260E41AAD7BF3466F57B1B0D7FC4807564DB10DAC73EA70497819071` |

The worktree was already substantially modified and untracked before this baseline. Those changes were preserved. Notable pre-existing items include backend package/seed changes, frontend application and dependency changes, new content and implementation documents, new scene/page/component/test files, public fonts/images/models/Draco assets, and the old redesign ZIP.

## Required checks

| Check | Result | Evidence summary |
| --- | --- | --- |
| Backend `npm ci` | Pass | 223 packages installed; audit reported 12 vulnerabilities (3 low, 3 moderate, 6 high) |
| Backend `npm test` | Pass | 88 tests across 33 suites; 0 failures; 73.70 s |
| Frontend `npm ci` | Pass | 294 packages installed; 0 vulnerabilities |
| Frontend `npm test` | Pass | Node runner: 9 tests; Vitest: 60 tests in 10 files; 0 failures |
| Frontend `npm run lint` | Pass | `oxlint` completed with no findings |
| Frontend `npm run build` | Pass with warning | Vite 8.2.2; 252 modules; build completed in 1.53 s |

The first in-place frontend `npm ci` attempt could not unlink the native Rolldown binding because the portfolio's Vite development server had it open. To avoid stopping the user's live server, the clean-install, test, lint, and build gates were run against an ignored source copy at `.local/phase0-clean/frontend`, excluding the old `node_modules`, `dist`, and `.env`. This validates the same source and lockfile without affecting the running session.

## Production build sizes

| Artifact | Minified | Gzip |
| --- | ---: | ---: |
| `index.html` | 0.96 kB | 0.52 kB |
| Main CSS | 59.11 kB | 12.78 kB |
| Main JS | 460.75 kB | 143.38 kB |
| Lazy `IcebergScene` JS | 972.17 kB | 261.90 kB |
| Draco JS decoder | 719.41 kB | Not reported |
| Draco WASM decoders | 192.42 kB and 285.74 kB | 64.11 kB and 89.66 kB |
| Draco wrappers | 58.45 kB and 58.76 kB | Not reported |

Vite warns that chunks exceed 500 kB after minification. This is baseline evidence for Phase 4 and was intentionally not optimized during Phase 0.

## Public asset inventory

`frontend/public` contains 12 files totaling 1,271,335 bytes (1.212 MiB):

| Group | Files | Bytes |
| --- | ---: | ---: |
| Root assets | 4 | 27,734 |
| `draco/` | 3 | 252,271 |
| `fonts/` | 3 | 881,598 |
| `images/` | 1 | 31,652 |
| `models/` | 1 | 78,080 |

## Git hygiene

- Real backend and frontend `.env` files are ignored; `.env.example` files remain trackable.
- Root ignore rules cover dependencies, build output, logs, environment files, local launch scratch space, database dump formats, Lighthouse/Playwright/test reports, HAR files, and recordings.
- No tracked path name matched environment, credential, secret, backup, database dump, Lighthouse, or browser-test report patterns other than the two intentional `.env.example` files.

## Baseline issues carried forward

1. Backend dependency audit reports 6 high, 3 moderate, and 3 low vulnerabilities. Review and disposition are required before release; no automatic dependency mutation was performed in Phase 0.
2. The lazy 3D scene and Draco decoder exceed Vite's chunk warning threshold. Analyze in Phase 4.
3. Staging and production hostnames are intended but not proven provisioned by repository configuration.
4. Staging notification variables are not configured locally. End-to-end notification testing belongs to Phase 1/staging.
5. `mongodump` and `mongorestore` are not installed; the documented backup/restore gate must be executed before any data mutation.
6. The worktree is not clean. Existing user work must be classified during release preparation; no cleanup was performed in Phase 0.
