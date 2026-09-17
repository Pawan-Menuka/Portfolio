import { clamp, stops } from './camera-path.mjs';

// Both mobile quality tiers share a composition: promoting visual quality must
// never rotate the iceberg or move a saved marker beneath the visitor's finger.
export const mobileStops = Object.freeze(stops.map((stop, index) => Object.freeze({
  ...stop,
  radius: [160, 86, 82, 76, 69, 61, 54, 48][index],
  angle: [0, 12, 35, 68, 102, 136, 168, 200][index],
  targetY: [-30, 1, -6, -22, -36, -50, -64, -69][index],
})));

const mix = (a, b, t) => a + (b - a) * t;
const smootherstep = t => clamp(t ** 3 * (t * (t * 6 - 15) + 10));

/** Portrait-aware framing with the desktop checkpoint depths and reading windows.
 * A wider field of view in landscape preserves vertical clearance. In portrait,
 * distance grows with the horizontal constraint instead of cropping the iceberg.
 * This is a pure sampler, so reverse scrolling retraces the same geometry.
 */
export function sampleMobileCamera(progress, { aspect = 9 / 16 } = {}) {
  if (!Number.isFinite(progress)) throw new TypeError('Progress must be finite');
  if (!Number.isFinite(aspect) || aspect <= 0) throw new TypeError('Aspect must be positive and finite');
  const t = clamp(progress);
  const index = Math.min(mobileStops.length - 2, Math.max(0, mobileStops.findIndex(stop => stop.t >= t) - 1));
  const a = mobileStops[index], b = mobileStops[index + 1];
  const local = clamp((t - a.t) / (b.t - a.t));
  const blend = smootherstep(clamp((local - .1) / .8));
  const framing = Math.max(1, .8 / Math.max(.25, aspect));
  const radius = mix(a.radius, b.radius, blend) * framing;
  const angleDegrees = mix(a.angle, b.angle, blend);
  const radians = angleDegrees * Math.PI / 180;
  return {
    progress: t,
    position: [Math.sin(radians) * radius, mix(a.y, b.y, blend), Math.cos(radians) * radius],
    target: [0, mix(a.targetY, b.targetY, blend), 0],
    radius, angleDegrees, fov: mix(48, 54, clamp((aspect - 1) / .8)),
    section: local < .5 ? a.id : b.id,
  };
}
