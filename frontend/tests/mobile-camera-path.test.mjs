import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stops } from '../src/features/iceberg/camera-path.mjs';
import { mobileStops, sampleMobileCamera } from '../src/features/iceberg/mobile-camera-path.mjs';

for (const aspect of [320 / 568, 390 / 844, 430 / 932, 768 / 1024, 844 / 390]) {
  let previous;
  for (let i = 0; i <= 2000; i++) {
    const sample = sampleMobileCamera(i / 2000, { aspect });
    assert.ok([...sample.position, ...sample.target, sample.fov].every(Number.isFinite));
    // The model's entire horizontal bounding cylinder has radius under 38m.
    assert.ok(sample.radius >= 48, 'Camera must remain outside the model envelope');
    assert.deepEqual(sampleMobileCamera((2000 - (2000 - i)) / 2000, { aspect }), sample);
    if (previous) {
      assert.ok(sample.position[1] <= previous.position[1] + 1e-9);
      assert.ok(sample.angleDegrees >= previous.angleDegrees - 1e-9);
      assert.ok(Math.hypot(...sample.position.map((value, j) => value - previous.position[j])) < 1.5);
    }
    previous = sample;
  }
  for (const stop of stops) {
    const sample = sampleMobileCamera(stop.t, { aspect });
    assert.equal(sample.position[1], stop.y, 'Depth gauge must match the approved checkpoints');
    for (const delta of [-.001, .001]) assert.deepEqual(sampleMobileCamera(stop.t + delta, { aspect }).position, sample.position);
  }
}
assert.equal(mobileStops.at(-1).angle, 200);
const fixture = JSON.parse(readFileSync(new URL('./fixtures/iceberg/mobile-path-samples.json', import.meta.url), 'utf8'));
for (const expected of fixture) {
  const sample = sampleMobileCamera(expected.t, { aspect: .8 });
  assert.deepEqual({ t: sample.progress, y: sample.position[1], radius: sample.radius, angle: sample.angleDegrees, targetY: sample.target[1] }, expected);
}
assert.deepEqual(sampleMobileCamera(-1), sampleMobileCamera(0));
assert.deepEqual(sampleMobileCamera(2), sampleMobileCamera(1));
assert.throws(() => sampleMobileCamera(NaN));
assert.throws(() => sampleMobileCamera(0, { aspect: 0 }));
// Mobile quality changes must not change composition or marker projection.
assert.deepEqual(sampleMobileCamera(.53, { tier: 'mobile-light' }), sampleMobileCamera(.53, { tier: 'mobile-enhanced' }));
console.log('PASS: mobile camera clearance, continuity, reversal, depth parity and tier-stable framing across five aspect ratios.');
