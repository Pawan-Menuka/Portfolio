/** Shared A/B camera path. Metres, Three.js Y-up; no browser dependencies. */
export const stops = Object.freeze([
  { id: 'intro',      t: 0,    y: 12,  radius: 150, angle: 0,   targetY: -28 },
  { id: 'full-stack', t: 0.14, y: 8,   radius: 80,  angle: 20,  targetY: 0 },
  { id: 'waterline',  t: 0.25, y: 2,   radius: 74,  angle: 75,  targetY: -6 },
  { id: 'blockchain', t: 0.39, y: -18, radius: 72,  angle: 140, targetY: -22 },
  { id: 'systems',   t: 0.53, y: -34, radius: 66,  angle: 210, targetY: -36 },
  { id: 'hardware',  t: 0.67, y: -50, radius: 60,  angle: 285, targetY: -50 },
  { id: 'creative',  t: 0.81, y: -66, radius: 52,  angle: 360, targetY: -64 },
  { id: 'contact',   t: 1,    y: -84, radius: 46,  angle: 450, targetY: -69 },
].map(Object.freeze));

export const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const mix = (a, b, t) => a + (b - a) * t;
// Zero first and second derivatives at each end prevent sudden accelerations.
const smootherstep = x => clamp(x * x * x * (x * (x * 6 - 15) + 10));

export function sampleCamera(progress) {
  if (!Number.isFinite(progress)) throw new TypeError('Progress must be finite');
  const t = clamp(progress);
  const index = Math.min(stops.length - 2, Math.max(0, stops.findIndex(s => s.t >= t) - 1));
  const a = stops[index], b = stops[index + 1];
  const local = clamp((t - a.t) / (b.t - a.t));
  // A small stationary reading window either side of each content stop.
  const blend = smootherstep(clamp((local - 0.10) / 0.80));
  const radius = mix(a.radius, b.radius, blend);
  const y = mix(a.y, b.y, blend);
  const angleDegrees = mix(a.angle, b.angle, blend);
  const radians = angleDegrees * Math.PI / 180;
  return {
    progress: t,
    position: [Math.sin(radians) * radius, y, Math.cos(radians) * radius],
    target: [0, mix(a.targetY, b.targetY, blend), 0],
    radius, angleDegrees, fov: 48,
    section: local < 0.5 ? a.id : b.id,
  };
}

/** Damping changes progress only: camera and content stay on the same path.
 * Clamp dt after background-tab pauses. Use the static layout for reduced motion.
 */
export function advanceProgress(current, requested, deltaSeconds) {
  if (![current, requested, deltaSeconds].every(Number.isFinite)) {
    throw new TypeError('Camera timing must be finite');
  }
  const alpha = -Math.expm1(-4 * clamp(deltaSeconds, 0, 0.05));
  return mix(clamp(current), clamp(requested), alpha);
}

export function progressForSection(id) {
  const stop = stops.find(s => s.id === id);
  if (!stop) throw new RangeError(`Unknown section: ${id}`);
  return stop.t;
}
