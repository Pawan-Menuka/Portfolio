# Mobile calibration hardening — 2026-09-26

## Completed behavior

- Runtime calibration starts after the iceberg's first ready frame. Loading/decode frames cannot earn a promotion or trigger a performance downgrade.
- The existing atmosphere visibility observer exposes a local active signal and visibility epoch. The candidate probe pauses while hidden or offscreen; resumed rendering starts a fresh calibration window even when demand rendering emitted no frames during the pause.
- Calibration discards partial windows after activation changes, background return, visibility-epoch changes, and invalid/discontinuous frame timestamps. Cooldown remains tied to the same monotonic performance clock.
- Long-task pressure uses actual task duration overlapping the sample window, rather than treating every task as 50 ms. Frame and long-task timestamps now use the same navigation-relative clock.
- Regression coverage exercises readiness/reactivation, background frames, offscreen sample isolation, long-task pressure, observer cleanup, and the atmosphere's visibility signal.

The implementation preserves existing scene tiers, quality budgets, model geometry, camera paths, contact behavior, and backend contracts. Measurements remain on the device.

## Validation

- Focused performance and atmosphere regression: 13 tests passed across two files.
- Full frontend Vitest regression: 75 tests passed across 11 files, using `--pool threads --maxWorkers=1 --testTimeout=15000` (91.94 seconds). The one-worker fork run also passed all 75 tests.
- Frontend API/camera Node suite: 9 tests passed.
- Frontend lint: passed with zero warnings.
- Frontend production build: passed.
- `git diff --check`: passed.

The final frontend total is 84 passing tests. An earlier incomplete run under heavy parallel-project test load timed out in five existing Contact tests at the default five-second limit; both complete final runs use one worker and a 15-second test timeout. These are test-runner wall-clock settings, not product timeout changes.

## Remaining rollout gates

Physical Android/iPhone measurements and screen-reader review remain necessary. Hosting/staging, Atlas credential rotation plus verified backup/restore, and controlled Resend storage/inbox verification remain the launch inputs already recorded in `docs/launch/LAUNCH_LOG.md`. This local hardening pass does not close those gates or deploy the site.
