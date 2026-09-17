# Phase 3 — Bare Version B scene

Completed 2026-09-08. Geometry and backend source remain unchanged.

## Delivered

- Lazy desktop R3F scene with original portable materials and simple lights.
- Static poster stays visible until readiness; model/network/renderer failures and a 25-second loading timeout restore it.
- Widths below 901px, coarse pointers, reduced motion, and missing WebGL2 select static mode before importing the scene.
- Media preference changes create a fresh preview session. Scene unmount aborts fetches, releases model resources and listeners, and disposes decoder workers after pending decode completes.
- Demand rendering and DPR capped at 1.5. This is a stationary inspection camera; the validated scroll path is reserved for Phase 4.

## Verification and baseline

Actual browser-decoded asset: `ice_above` and `ice_below`, 3,848 triangles, dimensions 56.930330 × 100 × 47.359182. Above reaches Y=20, below reaches Y=-80, waterline gap is zero. No observed orientation/culling issue or seam gap in the inspected view.

Codex in-app browser on this Windows machine: desktop 1440×900 and 1366×768 rendered successfully. Mobile 390×844 had zero canvases and no horizontal overflow. Returning to desktop produced one ready canvas; Projects removed the canvas and returning Home restored it. The laptop hero extends below the viewport through normal document scrolling; the model fits its canvas.

Observed model fetch/parse/verification times were 43ms and 156ms on localhost, with DPR approximately 1. These are warm/local development observations, excluding lazy bundle startup and first paint, not cold-network or GPU benchmarks. GPU model and frame timing were not measured. The stationary scene requests frames on demand; no continuous FPS claim is made.

Production output baseline: main JS approximately 429kB (135kB gzip), lazy scene approximately 935kB (250kB gzip). The model is 78,080 bytes. Explicit local Draco assets are 58,456-byte wrapper and 192,420-byte WASM. Vite also emits dependency-default decoder assets; the loader explicitly selects `/draco/` URLs. Bundle size warning remains a performance-review item for Phase 7.

Tests: 26 UI cases and 8 Node test entries passed, including the existing 2,001 camera samples. Added coverage checks static selection without importing the scene, loading handoff, timeout, simulated failure/context-loss callback, preference re-entry, missing WebGL2, camera fit, and shared-resource disposal. Reduced motion and context loss were simulated in tests rather than forced on the live GPU. Lint and production build pass.

One Windows Vite file-watcher EBUSY error occurred while copying decoder attribution. The app kept its fallback; restarting the development server resolved it and resize/navigation checks were repeated. No blocking renderer error was observed afterward. The installed R3F/Three combination emits a non-blocking THREE.Clock deprecation warning.

## Asset provenance

Draco wrapper, WASM and upstream README were copied unchanged from the installed `three/examples/jsm/libs/draco/gltf/` directory (README from its parent). See `public/draco/README.md` for upstream details and licensing. Vendored decoder code is excluded from application lint.

Version B SHA256 remains `3c94763b3235326f89f5f5f2de62a8ec6ea8fe482959a0a4516d9274fae5b895`.

## Next

Phase 4 connects document scroll to the existing camera sampler and damping. Water, fog, particles, labels, and runtime realism remain outside this phase. No deployment or backend mutation was performed.
