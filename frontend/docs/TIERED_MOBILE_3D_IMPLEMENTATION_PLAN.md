# Tiered Mobile 3D Iceberg — Implementation Plan

Status: First complete implementation is in place; physical-device rollout validation remains.

## Implementation progress — 2026-09-11

- Completed the four-tier policy, versioned local calibration, Data Saver/reduced-motion/WebGL fallbacks, hysteresis, and performance thresholds.
- Added shared frozen quality budgets and a single scene that changes DPR, material cost, particle count, marine-life density, and animation cadence without remounting the canvas or refetching the GLB.
- Added a pure portrait/mobile-landscape camera path with the approved checkpoint depths and a 200° reversible orbit shared by both mobile 3D tiers.
- Added sticky normal-document mobile scrolling, compact depth instrumentation, fixed model-space marker projection, exclusive accessible labels, and viewport-safe label panels.
- Preserved the approved 450° desktop camera path and existing desktop scene composition.
- Verified the production build, lint, 69 automated checks, one-canvas behavior, no horizontal overflow, all label transition states, footer reachability, and desktop/mobile tier selection.
- Browser-reviewed the mobile journey at 320×740 and 390×844 and the desktop journey at the available 1265px-wide preview.
- Remaining rollout work requires physical lower-powered, typical, flagship, and iOS devices. Their measurements may lower the starting quality budgets or promotion threshold; they should not expand visual scope during rollout.

## Objective

Extend the existing desktop iceberg journey to capable mobile devices while preserving reliable touch scrolling, readable content, accessibility, battery awareness, and a safe static fallback.

The implementation must use the current React, Vite, React Router, Three.js, React Three Fiber, and drei foundation. It must preserve the approved iceberg geometry, desktop camera journey, backend integration, routes, content order, and static poster.

## Approved experience tiers

| Device/runtime condition | Starting experience |
| --- | --- |
| Low-power device, reduced motion, Data Saver, or failed WebGL | Static iceberg |
| Typical mobile device | Lightweight 3D |
| Capable flagship device | Enhanced mobile 3D |
| Desktop with mouse/trackpad | Full desktop 3D |

The enhanced mobile tier is earned through runtime capability and performance evidence. It must not depend on phone brand, model name, price, or screen resolution alone.

## Non-negotiable behavior

- Normal document scrolling remains the only scroll source.
- The canvas never captures touch gestures or creates a second scroll container.
- The checkpoint sequence remains Full-stack, Blockchain, Distributed Systems, Hardware / CNC, Music, and Contact.
- Checkpoint depths remain 0, 18, 34, 50, 66, and 84 metres.
- Only one checkpoint label may be readable and interactive at a time.
- Every checkpoint marker remains attached to its saved iceberg point across scrolling, resizing, and orientation changes.
- HTML contains every important heading, description, and link. WebGL is never the only source of content.
- Reduced-motion users receive the static journey without an automatic 3D promotion.
- The existing desktop experience remains visually unchanged unless a shared bug requires a documented fix.
- WebGL failure, model failure, context loss, or sustained poor performance must fall back without blocking navigation.

## Architecture

Use one scene implementation with tier-specific configuration rather than four separate scenes.

```text
scene policy
    ↓
initial tier decision
    ↓
static ───────────────────────────────→ HTML journey + poster
    │
    ├── mobile-light ── runtime sample ──→ mobile-enhanced
    │          ↑                              │
    │          └──────── sustained slowdown ─┘
    │
    └── desktop-full ───────────────────→ current desktop scene
```

Recommended source responsibilities:

| Source | Responsibility |
| --- | --- |
| `scene-policy.js` | Pure initial tier selection and policy tests |
| `scene-quality.js` | Frozen settings for static, mobile-light, mobile-enhanced, and desktop-full |
| `use-performance-tier.js` | Runtime sampling, promotion, downgrade, and cleanup |
| `IcebergHero.jsx` | Poster-first loading, scene boundary, tier changes, and failure fallback |
| `IcebergScene.jsx` | Apply the selected quality configuration without duplicating scene logic |
| `camera-path.mjs` | Preserve the approved desktop camera path |
| `mobile-camera-path.mjs` | Portrait-specific camera sampler using the same normalized progress |
| `ScrollCamera.jsx` | Choose a path by tier and apply the shared damped progress |
| `OceanEnvironment.jsx` | Tier-specific water, lighting, sky, and underwater effects |
| `MarineLife.jsx` | Tier-specific counts, geometry, visibility, and animation frequency |
| `JourneyContent.jsx` | Accessible HTML labels and exclusive transition timing |
| `DepthGauge.jsx` | Desktop rail and compact mobile depth presentation |

No dependency should be added unless existing Three.js/R3F capabilities cannot meet a measured requirement.

## Initial quality matrix

These values are starting budgets. Phase measurements may justify lowering them; increases require evidence from representative devices.

| Capability | Static | Mobile light | Mobile enhanced | Desktop full |
| --- | ---: | ---: | ---: | ---: |
| WebGL canvas | No | Yes | Yes | Yes |
| Device pixel ratio | N/A | 0.75–1.0 | 1.0–1.5 | Current cap, maximum 1.5 |
| Ambient render target | 0 FPS | 20–24 FPS | 30 FPS | Current desktop behavior |
| Active-scroll target | N/A | 30 FPS or better | 45 FPS target where sustainable | Current responsive rendering |
| Dynamic reflections/refraction | No | No | Reduced resolution, only if budget passes | Current full effect |
| Dynamic shadows | No | No | No | Current scene setting |
| Marine snow | Poster only | 40–80 particles | 120–180 particles | Current desktop count |
| Fish | Poster only | One subdued distant school | Current mobile-appropriate schools | Current desktop behavior |
| Jellyfish/organisms | Poster only | Maximum one simple form | A few depth-appropriate forms | Current desktop behavior |
| Ice material | Poster | Cheap translucent/faceted material | Transmission with reduced samples | Current physical material |
| Water | Poster | Single simple ripple surface | Ripple surface plus reduced optical effect | Current reflection/refraction system |
| Aurora/stars | Poster | CSS/background only above water | Lightweight above-water treatment | Current full desktop treatment |
| Underwater particles/effects | Poster | Sparse and depth-gated | Moderate and depth-gated | Current desktop behavior |
| Camera orbit | None | Approximately 160–200° | Approximately 200–240° | Approved 450° desktop path |

## Phase M0 — Baseline and acceptance budgets

### Work

- Record the current static-mobile and full-desktop behavior before changing policy.
- Measure the current production bundle, GLB, Draco decoder, first scene readiness, layout shift, and scrolling cadence.
- Capture representative layouts at 320×740, 360×800, 390×844, 412×915, 430×932, 1366×768, and 1440×900.
- Verify the current route, backend, loading, model-failure, WebGL-loss, mobile-static, and reduced-motion tests.
- Record at least one typical Android device and one capable flagship device when physical devices are available.
- Define the initial promotion and downgrade thresholds from measurements rather than an assumed universal FPS.

### Completion gate

- Existing tests, lint, and production build pass.
- Baseline screenshots and device/browser details are recorded.
- Static mobile and desktop behavior are unchanged.
- Performance thresholds are explicit and testable.

## Phase M1 — Tier policy and quality configuration

### Work

- Replace the desktop/static binary policy with `static`, `mobile-light`, `mobile-enhanced`, and `desktop-full`.
- Keep the decision logic pure so it can be tested without mounting Three.js.
- Select static immediately when reduced motion is enabled, WebGL is unavailable, Data Saver is enabled, or a previous session recorded a compatible hard failure.
- Select desktop full only when the existing desktop viewport and precise-pointer conditions pass.
- Select mobile light as the safe default for eligible touch/mobile devices.
- Mark a device as an enhanced candidate using capability hints such as WebGL limits, logical cores, device memory when available, and a previously successful versioned calibration. Hints alone must not trigger the final promotion.
- Store quality settings in a frozen configuration object consumed by the scene components.
- Version any locally remembered tier result so future scene changes invalidate stale measurements.
- Listen for reduced-motion, orientation, viewport, visibility, and connection-policy changes and resolve them without duplicate canvases.

### Initial conservative rules

- `prefers-reduced-motion: reduce` → static.
- WebGL unavailable or context creation fails → static.
- `navigator.connection.saveData === true` → static.
- Desktop media query passes → desktop full.
- Eligible phone/tablet without a trusted calibration → mobile light.
- Eligible phone/tablet with a recent successful calibration for the current tier version → start at its last safe mobile tier.

Device-memory and logical-core values are optional hints. Missing browser APIs must never be interpreted as low power or high power by themselves.

### Completion gate

- Unit tests cover every initial tier and changes to media preferences.
- Static selection does not import the 3D feature bundle.
- No user-agent or phone-model list exists.
- Tier changes never produce two canvases or stale listeners.

## Phase M2 — Refactor the existing scene for quality tiers

### Work

- Pass a quality configuration from `IcebergHero` into `IcebergScene`, `OceanEnvironment`, `MarineLife`, materials, and the animation scheduler.
- Preserve the desktop configuration as the reference implementation.
- Disable reflection/refraction render targets, costly transmission settings, excess particles, and desktop-only atmosphere in mobile light.
- Add a reduced optical configuration for mobile enhanced.
- Cap DPR per tier and update it safely after promotion or downgrade.
- Keep demand rendering and the existing hidden/offscreen pause behavior.
- Dispose replaced materials, timers, render targets, and event listeners during a tier change.
- Prevent a tier change from refetching the unchanged GLB.
- Keep the static poster under the canvas until the first correct frame is ready.

### Completion gate

- Desktop screenshots match the pre-change baseline within reviewed tolerances.
- Mobile light mounts one canvas and creates no reflection/refraction render targets.
- Mobile enhanced mounts one canvas with only its configured effects.
- Tier switching does not refetch the GLB, leak resources, flash an empty canvas, or reset document scroll.

## Phase M3 — Portrait camera path

### Work

- Create a pure mobile camera sampler with the same normalized progress and checkpoint depths as desktop.
- Frame the complete iceberg in the opening mobile composition.
- Move the iceberg toward the centre as descent begins.
- Use less horizontal orbit and lateral translation than desktop.
- Keep the waterline legible through the first transition.
- Preserve clear label space at every stop.
- Keep the keel and Contact anchor visible at the final stop.
- Define separate portrait and mobile-landscape framing where one path cannot compose both reliably.
- Preserve exact geometric reversal when the user scrolls upward.
- Add a checked-in sample fixture and clearance/continuity tests equivalent to the desktop path checks.

### Completion gate

- No tested stop clips the checkpoint anchor or makes the label unreadable.
- The path is finite, continuous, monotonic in journey progress, and exactly reversible.
- Resize and orientation changes resample the current progress without jumping to another checkpoint.
- The desktop path and its existing fixture remain unchanged.

## Phase M4 — Mobile scroll composition

### Work

- Keep one normal document scroll range and a pointer-events-disabled sticky canvas.
- Use `svh`/`dvh` carefully so expanding and collapsing browser chrome does not move the camera abruptly.
- Start with the current editorial introduction and poster.
- Activate the sticky 3D descent only after the scene has produced a valid first frame.
- Synchronize scene progress before crossfading from poster to canvas.
- Release the sticky scene cleanly before the footer.
- Recalculate scroll bounds on resize, orientation change, font load, profile load, and viewport-height changes.
- Preserve route navigation, browser Back/Forward restoration, direct hash entry, and a page opened partway down.
- Never call `preventDefault` for ordinary touch scrolling.

### Completion gate

- Slow drag, fast flick, momentum scroll, reversal, browser chrome changes, and orientation changes do not trap or jump the page.
- The canvas does not intercept links or touches.
- No horizontal scrollbar appears at any supported mobile width.
- The footer and direct routes remain reachable with JavaScript, WebGL, or the model unavailable.

## Phase M5 — Checkpoint labels and mobile depth instrument

### Work

- Reuse the existing accessible HTML checkpoint content instead of rendering essential text in WebGL.
- Attach each marker to one saved model-space point and project it into screen space every rendered frame.
- Add portrait-specific label offsets that avoid the iceberg silhouette, navbar, depth instrument, and viewport edges.
- Keep the approved transition rule: a label may appear shortly before its stop and linger shortly after, but the next label begins only after the previous label is fully gone.
- Make only the active label interactive and exposed in the reading order.
- Use 16px or larger for primary label/body text, 14px or larger for controls, and 12–13px only for secondary instrument metadata.
- Adapt the depth indicator to the available width. Use the full 0/18/34/50/66/84 m rail when it does not obstruct the scene; otherwise use a compact current-depth readout with checkpoint ticks.
- Preserve a minimum 44px target for checkpoint navigation and calls to action.

### Completion gate

- Exactly one checkpoint label is readable, focusable, and announced at a time.
- Every marker remains attached to the same saved facet across scroll, resize, and orientation changes.
- Labels remain legible at 200% text enlargement without horizontal overflow.
- Static and reduced-motion modes expose the same information in normal document flow.

## Phase M6 — Runtime calibration, promotion, and downgrade

### Work

- Start an uncalibrated eligible mobile device in mobile light.
- Sample a short bounded period after the first valid frame without delaying visible content.
- Measure frame intervals while the scene is actually rendering, main-thread long tasks where supported, renderer limits, and context stability.
- Promote an enhanced candidate only after a healthy sample. Complete promotion before the first checkpoint when possible.
- Require headroom rather than barely passing the desired frame interval.
- Ignore isolated loading spikes; use a sustained window and hysteresis.
- Downgrade mobile enhanced to mobile light after repeated poor samples.
- Downgrade mobile light to static only after sustained severe performance, memory/context failure, or repeated recovery failure.
- Add a cooldown so tiers cannot oscillate during a session.
- Remember only the last safe result, the calibration version, and a short timestamp. Do not store device identifiers or browsing telemetry.
- Recalibrate after a version change and treat orientation changes as a reason to reassess DPR, not automatically change tier.

### Starting threshold proposal

Tune these values during Phase M0 and physical-device testing:

- Promotion sample: at least 90 relevant rendered intervals after initialization.
- Promote when p95 remains at or below approximately 24 ms, no context instability occurs, and long tasks do not dominate the sample.
- Downgrade enhanced when p95 remains above approximately 34 ms for multiple consecutive windows.
- Fall back to static when the lightweight tier remains above approximately 50 ms for multiple windows or WebGL becomes unstable.
- Minimum 10-second cooldown between automatic tier changes.

These thresholds measure local runtime health; they are not claims that every browser exposes accurate GPU timing.

### Completion gate

- A simulated flagship candidate promotes once and remains stable.
- A typical-device simulation stays in mobile light.
- Sustained slowdown causes one controlled downgrade without scroll loss.
- One slow frame does not change tier.
- Reduced motion, Data Saver, context loss, and model failure always override promotion.

## Phase M7 — Depth-appropriate mobile effects

Add effects one group at a time and keep each addition only if it passes the tier budget.

### Mobile light

- Simple rippling surface with no dynamic reflection/refraction render passes.
- Fast depth-dependent ice tint and light falloff.
- Very sparse particles away from labels.
- One subdued distant fish school between approximately 18 and 34 m.
- Broad low-contrast sediment between approximately 34 and 50 m.
- Maximum one simple jellyfish and sparse plankton between approximately 50 and 66 m.
- Quiet darkness with occasional distant light below approximately 66 m.

### Mobile enhanced

- Higher-quality ice transmission with tightly bounded samples.
- Reduced-resolution water optical effect only if measurements allow it.
- Moderate marine snow with text-column suppression.
- More natural fish variation and a few depth-appropriate organisms.
- Stronger but restrained caustic/rim treatment near the surface.

### Rules for both mobile tiers

- Stars exist only above water.
- Aurora color below water appears only as a faint blurred surface influence near the waterline.
- Sun rays and surface glow fade quickly with depth.
- Marine life placement must not obscure checkpoint text or suggest biologically implausible density.
- Effects must transition by depth rather than appearing across the entire journey.

### Completion gate

- Each depth band is visually distinct but continuous with adjacent bands.
- Mobile light stays inside its performance budget after all effects are enabled.
- Enhanced effects disappear cleanly when downgraded.
- Static fallback remains visually coherent with the live scene.

## Phase M8 — Accessibility, lifecycle, and failure hardening

### Work

- Verify semantic headings, link names, focus order, skip link, route focus restoration, and active-checkpoint exposure.
- Test reduced motion at initial load and when the preference changes during the session.
- Test 200% text enlargement and browser zoom.
- Test model 404, Draco failure, delayed model response, WebGL unavailable, actual context loss, and failed context recovery.
- Test page visibility changes, background/foreground return, route unmount, React Strict Mode, and repeated orientation changes.
- Ensure fallback does not display a blocking technical error.
- Confirm no ambient timers, observers, or render loops remain after leaving Home.
- Verify that no capability or performance information is transmitted off the device.

### Completion gate

- All content and routes remain usable with the canvas absent.
- Failure produces one stable poster and zero canvases.
- Reduced motion never starts calibration or animated 3D.
- Automated lifecycle checks show no duplicate listeners, canvases, or animation schedulers.

## Phase M9 — Device matrix, performance review, and rollout

### Automated viewport matrix

- 320×740
- 360×800
- 390×844
- 412×915
- 430×932
- Representative mobile landscape sizes
- 768px tablet portrait
- 1366×768 desktop
- 1440×900 desktop
- 1920×1080 desktop
- 2560×1080 ultrawide

### Physical review

- At least one lower-powered Android phone.
- At least one typical mid-range phone.
- At least one current flagship phone.
- iOS Safari when an iPhone is available.
- Android Chrome and Samsung Internet when available.
- A lower-powered laptop and the current development laptop.

### Required scenarios

- Cold and warm load.
- Slow network and Data Saver.
- Portrait/landscape rotation.
- Slow touch drag and fast momentum flick.
- Reversal around every checkpoint.
- Background/foreground switching.
- Low-power/battery-sensitive mode where observable without changing user settings.
- Direct hash entry, route return, refresh, and browser Back/Forward.
- Reduced motion, 200% text, and screen-reader/keyboard navigation.

### Rollout order

1. Ship the tier architecture with static and mobile light only behind a local development override.
2. Validate the portrait path and lightweight effects on physical devices.
3. Enable mobile light as the default for eligible mobile devices.
4. Collect local-only runtime measurements during testing; do not add analytics for this feature without a separate decision.
5. Enable enhanced promotion after flagship testing passes.
6. Recheck desktop-full regression and production caching.
7. Remove development overrides and complete the staging review.

### Final completion gate

- Every eligible device selects the expected starting tier.
- A capable flagship promotes before the first checkpoint or remains safely in light mode when current conditions are poor.
- A typical device scrolls smoothly in light mode.
- A low-power, reduced-motion, Data Saver, or failed-WebGL device receives the complete static experience.
- Desktop retains the existing full scene and approved camera path.
- No tier has horizontal overflow, overlapping labels, inaccessible content, scroll trapping, or lifecycle leaks.
- Production build, lint, automated checks, physical-device review, and staging review pass.

## Test plan

Add focused tests around behavior that can regress; avoid tests that merely reproduce configuration constants.

| Area | Meaningful checks |
| --- | --- |
| Tier policy | Media/capability inputs resolve the correct initial tier; missing optional APIs remain safe |
| Promotion | Healthy sustained samples promote once; isolated spikes do not |
| Downgrade | Sustained poor samples downgrade with hysteresis and cooldown |
| Overrides | Reduced motion, Data Saver, WebGL/model failure, and context loss force static |
| Camera | Mobile samples are finite, continuous, reversible, and clear the model |
| Scroll mapping | Resize, orientation, history restoration, and direct hash entry preserve progress |
| Checkpoint timing | Previous label reaches zero before the next begins; only one is interactive |
| Lifecycle | Tier changes and route unmount dispose timers, observers, render targets, and listeners |
| Fallback | Static mode does not import the 3D bundle and remains fully navigable |
| Responsive UI | Supported widths and 200% text produce no clipping or horizontal overflow |

## Development diagnostics

Keep diagnostics development-only and excluded from the production bundle.

Suggested query controls:

- `?tier=static`
- `?tier=mobile-light`
- `?tier=mobile-enhanced`
- `?tier=desktop-full`
- `?review=model-failure`
- `?review=webgl-loss`
- `?review=slow-frame`

The override must affect only local development/review builds and must never bypass reduced motion in production.

## Performance decisions deferred until measurement

- Whether mobile enhanced can afford dynamic reflection/refraction.
- Whether the current Draco-compressed GLB plus decoder is cheaper than a dedicated mobile asset.
- Whether the iceberg needs a reduced-triangle mobile GLB.
- Whether mobile enhanced can sustain DPR 1.5 during scrolling.
- Whether marine-life geometry should be simplified further.

Do not create a second model or add a new compression/runtime dependency until Phase M0–M3 measurements demonstrate a concrete benefit.

## Implementation checkpoints

- [ ] M0 — Baseline and budgets
- [ ] M1 — Tier policy and configuration
- [ ] M2 — Shared tier-aware scene
- [ ] M3 — Portrait camera path
- [ ] M4 — Mobile scroll composition
- [ ] M5 — Labels and depth instrument
- [ ] M6 — Runtime calibration and adaptive tiers
- [ ] M7 — Depth-appropriate effects
- [ ] M8 — Accessibility and failure hardening
- [ ] M9 — Physical devices, staging, and rollout

## Recommended first implementation slice

Complete M0–M4 with mobile light only. The first reviewable mobile build should include the real iceberg, portrait camera path, normal touch scrolling, basic depth tint, poster-first loading, and static failure behavior. Add enhanced promotion and richer effects only after this slice is smooth on a real typical phone.
