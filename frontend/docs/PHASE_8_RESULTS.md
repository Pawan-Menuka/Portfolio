# Phase 8 — Runtime realism

Completed 2026-09-09 following the owner's instruction to proceed after Phase 7. UI redesign is the next owner-led step.

## Delivered

- Physical ice materials with transmission, cool attenuation, flat facet lighting and a locally generated HDR environment.
- Depth-dependent underwater tint and light falloff, subtle upper caustics, rim illumination and a faint keel light.
- Rippling ocean surface with Fresnel reflection/refraction using two 256 × 256 render targets. Scene labels are excluded from reflections.
- Dark ocean atmosphere and 420 drifting marine-snow particles, subdued in the reading column.
- A visible-scene 24 Hz animation timer; scrolling can invalidate more frequently. Hidden/offscreen animation pauses and resources are disposed on unmount.

These are stylized real-time approximations: ice optical thickness uses uniform material thickness plus a radial body approximation; caustics and water normals are procedural, not simulated light transport or fluid dynamics. There is no added external texture download. The static poster retains its earlier Blender appearance.

## Verification

- Lint and production build pass. All 46 tests pass (38 UI/material/scheduler tests plus 8 Node tests).
- New tests check unchanged geometry/normals, material disposal, finite generated HDR data, and animation pause/resume/cleanup.
- Desktop browser inspection covered the surface, water crossing, deeper sections and upward reversal. Reflection alignment was corrected during review; deep labels remain readable.
- At 390 × 844: zero canvases and no horizontal overflow. Returning to 1440 × 900 mounts exactly one ready canvas.
- Actual simulated WebGL context loss removes the canvas and exposes the static poster plus all HTML sections and navigation. Reduced-motion behavior remains covered by the existing suite.
- Local backend restarted successfully; no backend source changes or database writes were made in this phase.
- GLB SHA-256 remains `3c94763b3235326f89f5f5f2de62a8ec6ea8fe482959a0a4516d9274fae5b895`; camera module remains `48d9a930987e92a4c4e8b3531e697be6491c421652b66acb2258c0f70a49bd91`.
- Model remains 78,080 bytes, 3,848 triangles, two meshes, dimensions 56.930330 × 100 × 47.359182 and zero waterline gap.

## Performance and limits

Local Chromium desktop review at 1440 × 900, DPR approximately 1, on the same machine described in Phase 7. These diagnostics measure DOM progress-update intervals while the camera is unsettled, not GPU render time or a universal FPS guarantee.

- 650 moving intervals: median 16.7 ms, p95 22.2 ms. Phase 7 recorded 16.7 / 17.4 ms using its earlier progress-update sample. Sampling differs, so the comparison is indicative only.
- Three long tasks of 65–67 ms occurred near initial loading. Model loading in this run was 174 ms; prior Phase 7 warm runs were 28–29 ms. Cache/initialization conditions were not controlled.
- Production main JS stays 432.63 KB / 135.98 KB gzip. Lazy scene is 1,072.08 KB / 298.96 KB gzip, about 4.85 KB more compressed than Phase 7.
- Large lazy chunk and existing Three.Clock deprecation remain. Cold production loads, lower-powered devices and physical trackpad feel still need owner/device review.

## Next

Review the local design and make the requested UI changes: typography, buttons, spacing, composition and stronger ocean/iceberg visual identity. Then complete real content, CV destinations and staging/production integration under Phase 9. Nothing has been deployed or merged.
