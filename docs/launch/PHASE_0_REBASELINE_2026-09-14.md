# Phase 0 launch rebaseline — expanded frontend

Captured: 2026-09-14 15:19:17 +05:30

Status: **Pass. Phase 0 is complete; the repeat of Phase 1 has not started.**

The original `PHASE_0_BASELINE.md` and `PHASE_1_INTEGRATION_REPORT.md` remain historical evidence. This report supersedes their build, test, route, and asset measurements for subsequent launch work because the frontend page set changed.

## Source state

| Item | Value |
| --- | --- |
| Branch | `Develop` |
| Commit | `79ac002d921533df9b0ec8362ed9f4de44074c13` |
| Worktree | Modified and untracked; current source was copied exactly except ignored dependencies, build output, and `.env` files |
| Node | `v24.19.0` |
| npm used | `11.6.0` through the bundled temporary runtime |
| Bundled pnpm launcher | `11.19.0` |
| Backend lockfile SHA-256 | `5906505A086D09B0C2D812DC0B8D5FF52DC20C6CD279729147AEA1B7CE7E52B8` |
| Frontend lockfile SHA-256 | `D3D8AEC0260E41AAD7BF3466F57B1B0D7FC4807564DB10DAC73EA70497819071` |

The commit and lockfile hashes are unchanged from the original baseline, but the uncommitted frontend source and tests have expanded. The existing redesign ZIP now appears as `frontend/Portfolio landing page redesign (1).zip`; it was not opened, moved, or deleted.

## Route and page inventory

The current browser router defines:

| Route | Component |
| --- | --- |
| `/` | Home |
| `/projects` | Projects |
| `/projects/:slug` | Project Detail |
| `/about` | About |
| `/cv` | CV |
| `/contact` | Contact |
| `*` | Not Found |

`frontend/src/pages` contains 11 files: six JSX modules and five page-specific stylesheets, totaling 63,156 bytes.

## Clean verification

Backend and frontend were copied into `.local/phase0-rebaseline-2026-09-14`, excluding `node_modules`, `dist`, `.git`, and real `.env` files. This preserved the user's working dependency tree while proving both lockfiles from empty install directories.

| Check | Result | Evidence |
| --- | --- | --- |
| Backend `npm ci` | Pass | 223 packages installed |
| Backend dependency audit | Attention required | 12 findings: 3 low, 3 moderate, 6 high |
| Backend `npm test` | Pass | 91 tests, 34 suites, zero failures |
| Frontend `npm ci` | Pass | 294 packages installed; zero audit findings |
| Frontend `npm test` | Pass | 9 Node tests plus 63 Vitest tests in 10 files; 72 total, zero failures |
| Frontend `npm run lint` | Pass | Oxlint completed with no findings against the identical workspace source |
| Frontend `npm run build` | Pass with existing size warning | Vite 8.2.2, 256 transformed modules, 3.53 seconds |

Oxlint was run from the workspace source because it honors the parent `/.local/` Git-ignore rule and therefore intentionally found no files inside the clean-room path. Tests and the production build ran against the clean-installed copy.

## Production bundle rebaseline

Built with `VITE_API_URL=http://localhost:5000/api/v1`.

| Artifact | Current minified | Current gzip | Previous minified | Change |
| --- | ---: | ---: | ---: | ---: |
| `index.html` | 0.96 kB | 0.51 kB | 0.96 kB | 0.00 kB |
| Main CSS | 72.65 kB | 15.58 kB | 59.11 kB | +13.54 kB |
| Main JS | 463.75 kB | 144.00 kB | 460.75 kB | +3.00 kB |
| Lazy `IcebergScene` JS | 972.19 kB | 261.90 kB | 972.17 kB | +0.02 kB |
| Draco JS decoder | 719.41 kB | Not reported | 719.41 kB | 0.00 kB |
| Draco WASM decoders | 192.42 / 285.74 kB | 64.11 / 89.66 kB | Same | 0.00 kB |

The application now transforms four more modules and contains three additional Vitest tests. The principal bundle growth is page styling. Vite's chunk-over-500-kB warning remains baseline evidence for Phase 4; it was not optimized during Phase 0.

## Public asset inventory

`frontend/public` remains unchanged at 12 files and 1,271,335 bytes (1.212 MiB):

| Group | Files | Bytes |
| --- | ---: | ---: |
| Root assets | 4 | 27,734 |
| `draco/` | 3 | 252,271 |
| `fonts/` | 3 | 881,598 |
| `images/` | 1 | 31,652 |
| `models/` | 1 | 78,080 |

## Environment, secrets, and recovery

- The intended local, staging, and production URLs in `ENVIRONMENT_MATRIX.md` remain unchanged.
- Local `VITE_API_URL` is `http://localhost:5000/api/v1`.
- Real frontend/backend `.env` files, `dist`, clean-room files, reports, recordings, and database-dump formats are ignored.
- No secret values were copied into the clean room or this report.
- No database read, write, migration, backup, or deletion occurred during this rebaseline.
- `DATABASE_BACKUP_AND_RESTORE.md` remains the documented restore path. Its verified-backup gate is still required before any later database mutation.

## Worktree preservation

All pre-existing modifications and untracked files were retained. Phase 0 added only this dated report and the corresponding launch-log entry. The clean-room directory is generated, ignored, and safe to remove after verification.

## Exit criteria

| Criterion | Result |
| --- | --- |
| Both lockfiles install with `npm ci` | Pass |
| Existing tests pass | Pass |
| Frontend lint passes | Pass |
| Production build passes | Pass, with documented size warning |
| Staging/production origins decided | Pass via `ENVIRONMENT_MATRIX.md`; provisioning remains later work |
| Database restoration path verified or documented | Pass on documented-path branch via `DATABASE_BACKUP_AND_RESTORE.md` |

## Next gate

The previous Phase 1 report is now historical and must not be treated as verification of the expanded frontend. The next authorized step is a complete Phase 1 repeat across every route and state above. Phase 1 was not started during this rebaseline.
