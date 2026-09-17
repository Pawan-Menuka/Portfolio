# Phase 4 — Document-scroll camera

Implemented 2026-09-08.

## Behavior

- The existing `sampleCamera` and `advanceProgress` drive position, target, reading windows and the original 450-degree orbit. Their source and fixtures are unchanged. FOV remains the sampler's 48 degrees.
- Home provides a 600vh desktop journey with a sticky viewport and ordinary document scrolling. Intro and Contact anchors target real HTML elements; direct routes remain available in the sticky header.
- A single normalized progress value lives in a ref, with no React update on every frame. Intro opacity and the current section derive from the same damped progress. Focused intro controls remain visible for keyboard users.
- The scene requests frames until settled, then idles. Background visibility stops further invalidation; resume restarts damping with the existing capped delta.
- Scroll, resize, pageshow and ResizeObserver measurements account for restored positions and changing layout. All listeners and observers are removed on unmount.
- Loading reserves the desktop journey's dimensions. Static/mobile/reduced-motion/failure modes use normal content height and keep contact accessible.

## Validation

28 UI cases and 8 Node test entries pass. Existing camera tests compare all 2,001 reference samples, continuity, reversal, reading stops, and damping at different frame rates. New observer tests cover restored scroll at mount, forward/reverse progress, changing geometry and cleanup. Lint and production build pass.

In-app browser checks at 1440×900 and 1366×768 covered Intro and Contact anchors, keyboard PageUp/PageDown, browser-generated wheel scrolling, intermediate waterline/systems/creative views, resize, route unmount/return, browser Back and refresh partway down. Refresh retained progress 0.5568 at the Systems view. Projects had no canvas; Home restored one. Mobile 390×844 had no canvas or horizontal overflow and reverted to normal page height.

The existing camera intentionally crops the rest of the iceberg while approaching each depth. No camera-through-surface or near-plane intersection was observed in inspected views. Final label placement and the wider aspect-ratio matrix belong to Phase 5.

Physical trackpad feel and dragging the native scrollbar remain manual input checks for the structural review. The browser automation viewport excludes the native scrollbar, so its drag could not be verified. No custom wheel or keyboard interception exists: all input follows the document scroll position.

The previous large lazy bundle warning and non-blocking Three.Clock dependency deprecation remain. No new dependencies, backend edits, model changes, contact submissions or deployment were introduced.

## Next

Phase 5 adds temporary labels and checks composition at each narrative stop. The empty space between the introductory and contact copy is intentional at this stage; real journey content and realism are later phases.
