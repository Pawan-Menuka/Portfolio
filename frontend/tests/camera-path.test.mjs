import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stops, sampleCamera, advanceProgress, progressForSection } from '../src/features/iceberg/camera-path.mjs';

const samples = Array.from({length: 2001}, (_, i) => sampleCamera(i / 2000));
for (let i = 0; i < samples.length; i++) {
  const s = samples[i];
  assert.ok([...s.position, ...s.target].every(Number.isFinite));
  assert.ok(s.radius >= 46);
  // Sampling in reverse yields the identical path, without accumulated rotation.
  assert.deepEqual(sampleCamera((2000 - (2000 - i)) / 2000), s);
  if (i) {
    assert.ok(s.position[1] <= samples[i - 1].position[1] + 1e-9);
    assert.ok(s.angleDegrees >= samples[i - 1].angleDegrees - 1e-9);
    assert.ok(Math.hypot(...s.position.map((x, j) => x - samples[i - 1].position[j])) < 1);
  }
}
for (const stop of stops) {
  assert.equal(progressForSection(stop.id), stop.t);
  const at = sampleCamera(stop.t);
  assert.equal(at.position[1], stop.y);
  assert.ok(Math.abs(at.radius - stop.radius) < 1e-9);
  for (const offset of [-0.001, 0.001]) {
    assert.deepEqual(sampleCamera(stop.t + offset).position, at.position);
  }
}
const integrate = fps => {
  let value = 0;
  for (let i = 0; i < fps; i++) value = advanceProgress(value, 1, 1 / fps);
  return value;
};
assert.ok(Math.abs(integrate(30) - integrate(144)) < 1e-12);
assert.ok(advanceProgress(0.7, 0.2, 1/60) < 0.7);
assert.ok(advanceProgress(0.7, 0.2, 1/60) > 0.2);
assert.deepEqual(sampleCamera(-1), sampleCamera(0));
assert.deepEqual(sampleCamera(2), sampleCamera(1));
assert.throws(() => sampleCamera(NaN));
assert.throws(() => progressForSection('missing'));
const reference = JSON.parse(readFileSync(new URL('./fixtures/iceberg/path-samples.json', import.meta.url), 'utf8'));
assert.deepEqual({ stops, samples }, reference, 'Camera path must match the approved Blender-study samples');
console.log('PASS: 2,001 samples; finite, monotonic, reversible, continuous, settled stops; 30/144 fps damping equivalence.');
