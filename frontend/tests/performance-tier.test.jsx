import { describe, expect, it } from 'vitest';
import {
  PERFORMANCE_THRESHOLDS,
  evaluatePerformanceWindow,
  nextAdaptiveTier,
  percentile95,
} from '../src/features/iceberg/use-performance-tier.js';
import { SCENE_TIERS } from '../src/features/iceberg/scene-policy.js';

const frames = value => Array.from({ length: PERFORMANCE_THRESHOLDS.sampleSize }, () => value);

describe('runtime tier calibration', () => {
  it('promotes a candidate only after a complete healthy sample', () => {
    expect(evaluatePerformanceWindow({ tier: SCENE_TIERS.MOBILE_LIGHT, enhancedCandidate: true, intervals: frames(20) }).action).toBe('promote');
    expect(evaluatePerformanceWindow({ tier: SCENE_TIERS.MOBILE_LIGHT, enhancedCandidate: false, intervals: frames(20) }).action).toBe('keep');
    expect(evaluatePerformanceWindow({ tier: SCENE_TIERS.MOBILE_LIGHT, enhancedCandidate: true, intervals: frames(20).slice(1) }).action).toBe('keep');
  });

  it('uses p95 so one isolated slow frame does not downgrade', () => {
    const intervals = frames(20);
    intervals[0] = 200;
    expect(percentile95(intervals)).toBe(20);
    expect(evaluatePerformanceWindow({ tier: SCENE_TIERS.MOBILE_ENHANCED, intervals }).action).toBe('keep');
  });

  it('blocks promotion when long tasks dominate the sample', () => {
    expect(evaluatePerformanceWindow({
      tier: SCENE_TIERS.MOBILE_LIGHT,
      enhancedCandidate: true,
      intervals: frames(20),
      longTaskRatio: 0.2,
    }).action).toBe('keep');
  });

  it('requires consecutive poor windows before a controlled downgrade', () => {
    const first = nextAdaptiveTier({ tier: SCENE_TIERS.MOBILE_ENHANCED, action: 'poor', now: 20_000 });
    expect(first).toEqual({ tier: SCENE_TIERS.MOBILE_ENHANCED, poorWindows: 1 });
    const second = nextAdaptiveTier({ tier: first.tier, action: 'poor', poorWindows: first.poorWindows, now: 21_000 });
    expect(second).toEqual({ tier: SCENE_TIERS.MOBILE_LIGHT, poorWindows: 0 });
  });

  it('falls from light to static only after sustained severe performance', () => {
    const action = evaluatePerformanceWindow({ tier: SCENE_TIERS.MOBILE_LIGHT, intervals: frames(60) }).action;
    const first = nextAdaptiveTier({ tier: SCENE_TIERS.MOBILE_LIGHT, action, now: 20_000 });
    const second = nextAdaptiveTier({ tier: first.tier, action, poorWindows: first.poorWindows, now: 21_000 });
    expect(first.tier).toBe(SCENE_TIERS.MOBILE_LIGHT);
    expect(second.tier).toBe(SCENE_TIERS.STATIC);
  });

  it('honors cooldown after a tier change', () => {
    const result = nextAdaptiveTier({ tier: SCENE_TIERS.MOBILE_ENHANCED, action: 'poor', poorWindows: 1, now: 15_000, lastChangeAt: 10_000 });
    expect(result).toEqual({ tier: SCENE_TIERS.MOBILE_ENHANCED, poorWindows: 1 });
  });
});
