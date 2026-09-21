# Phase 6 — Hero and fallback refinement

Implemented 2026-09-08. The frontend now uses a shared deep navy/cyan theme, lighter display typography, an iceberg wordmark and favicon, quieter navigation, translucent project cards, and consistent buttons/forms. HTML retains the system font, so mobile does not download another display font.

The hero pairs the identity and role with the iceberg, provides Projects/About actions and a working descent anchor, and replaces the known seeded API-edit biography with clearly marked draft introduction copy. Profile records were not changed. Route metadata uses available profile information.

The poster remains present during loading and fades into the canvas. Static, reduced-motion, unavailable-WebGL, and failed-scene layouts retain ordinary HTML content. Short windows or enlarged text use the static layout when viewport height is less than 40 root-font units; resize/root-size observers are cleaned up on unmount. Buttons wrap at narrow widths. No model geometry, camera path, backend, or runtime realism was changed.

## Validation

- Lint passed; 31 UI tests and 8 Node test entries passed, including the 2,001-sample camera fixture.
- Browser review: 1440×900 desktop opening; 1366×768 laptop opening and Full-stack stop; 390×844 mobile; 320px narrow layout.
- Tested 200% text with a temporary root font size of 32px at laptop and 320px widths. It switched to static content, with no horizontal overflow on Home or Contact after correcting button wrapping. The temporary override was removed.
- The descent link reaches Full-stack; keyboard Tab reaches its project link with a visible cyan outline. Projects and Contact navigation remains available. Project metadata updates correctly.
- Desktop → mobile → desktop resulted in one → zero → one canvases. Leaving Home for Projects removed the canvas. Existing tests cover preference changes, timeout, context loss, and scene cleanup; a new test covers enlarged-text fallback and restoration.
- API-unavailable draft content was visible before the backend started; successful profile/project content was reviewed afterward. No contact message was sent.
- Production build passes. The existing large lazy Three.js chunk warning remains; this pass adds no scene dependencies.

## Remaining integrated review

Phase 7 should measure cache/transfer behavior across repeated mode changes, rather than assuming that a recreated loader means either a new download or a cache hit. That network portion of the original Phase 6 checklist remains explicitly unverified. Full route/error-state and aspect-ratio regression review also belongs to Phase 7. Physical trackpad/native-scrollbar feel remains the manual Phase 4 check.

Profile copy is still draft. The surface theme is implemented; realistic water, underwater fog, particles, and lighting refinement remain Phase 8, after the structural review.
