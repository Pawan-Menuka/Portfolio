# Phase 5 — Temporary labels and composition

Completed 2026-09-08.

## Delivered

- Full-stack, Blockchain, Distributed Systems, Hardware / CNC, Creative, and Contact labels, using drei Billboard and Text.
- Labels face the sampled camera and occupy the left reading column. One shared damped progress controls their fades and matching HTML content. Each reading interval reaches full opacity; intervals do not overlap and behave identically in reverse.
- Matching HTML headings, brief neutral descriptions, section-filtered project links, and Contact links. These are navigation prompts rather than invented portfolio claims.
- Inactive desktop content is inert. Scene cleanup restores normal HTML controls on mobile or failure. Headings are only visually hidden after their 3D font has synchronized, so they remain available to assistive technology and serve as the font-loading fallback.
- Locally served Inter font, upstream license and source hash in `public/fonts/README.md`. Text has an independent Suspense/error boundary, with local default/fallback font configuration. Mobile/static mode imports neither the scene nor its font.

## Composition decision

The original canvas occupied only the right half of the hero. It now extends across the hero's inner width so the labels can occupy the reading column. A horizontal camera view offset of minus one-quarter of the full canvas width retains the iceberg's right-side framing. Camera position, target, FOV, stop timing, 450-degree orbit, and mesh geometry are unchanged; the original 2,001-sample camera verification still passes.

Labels use a stable projected position, with font size bounded between 25 and 42 CSS pixels. Pale cyan text has a subtle dark outline and bypasses scene tone mapping. The intro fades out before the first label starts. Contact's two links have separate lines.

## Browser review

All six stops were inspected at each planned desktop size:

| Viewport | Labels | Findings |
| --- | --- | --- |
| 1920 × 1080 | 6 of 6 | Readable; clear separation from the silhouette |
| 1440 × 900 | 6 of 6 | Readable; corrected title alignment and Contact link spacing |
| 1366 × 768 | 6 of 6 | Readable; descriptions and links fit below the titles |
| 2560 × 1080 | 6 of 6 | Centered content width preserved; labels remain beside the model |

No horizontal page overflow, label occlusion, or overlapping active labels was observed in the settled views. The camera's deliberate close views crop portions of the iceberg; this was already part of the approved path. Viewport changes during review occasionally required revisiting the first anchor after browser resizing/HMR; the settled views were rechecked.

The Hardware / CNC link opened `/projects?section=hardware` and displayed both existing CNC projects. Browser Back returned to the journey. At 390 × 844, all six HTML headings and destinations were present, with zero canvases, zero inert cards and no horizontal overflow.

## Checks and limits

30 UI test cases and 8 Node test entries pass. New checks cover stop alignment, non-overlapping fade windows, symmetric fade behavior, and HTML headings/anchors/destinations without a canvas. The existing camera suite verifies 2,001 samples. Lint and production build pass.

The font is currently the complete 876,576-byte upstream TTF. The lazy scene bundle is approximately 1.06MB minified / 294kB gzip. Font subsetting and transfer/frame-time profiling remain production optimization work; this phase does not claim a frame-rate benchmark. The existing Vite large-chunk warning and Three.Clock dependency deprecation remain.

Font absence is covered by the HTML-first rendering design and standalone HTML tests, rather than a live CDN/network-blocking test. Physical trackpad feel and native scrollbar dragging remain the manual checks recorded in Phase 4. No new backend changes, database writes, package installations, geometry edits, deployment or runtime realism effects were added.

## Next

Phase 6 refines the hero, typography, content transitions and fallback experience. These six labels and brief navigation prompts remain temporary composition content pending the later structural review.
