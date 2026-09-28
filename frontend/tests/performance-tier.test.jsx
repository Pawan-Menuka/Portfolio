import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PERFORMANCE_THRESHOLDS,
  evaluatePerformanceWindow,
  nextAdaptiveTier,
  percentile95,
  usePerformanceTier,
} from '../src/features/iceberg/use-performance-tier.js';
import { SCENE_TIERS } from '../src/features/iceberg/scene-policy.js';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); window.localStorage.clear(); });

const frames = value => Array.from({ length: PERFORMANCE_THRESHOLDS.sampleSize }, () => value);

describe('runtime tier calibration', () => {
  function feed(view, start, count, interval, context) {
    act(() => {
      for (let i = 0; i < count; i += 1) view.result.current.recordFrame(start + i * interval, context);
    });
  }

  it('starts calibration only after the first ready frame and resets partial activation samples', () => {
    const view = renderHook(({ active }) => usePerformanceTier({ initialTier: SCENE_TIERS.MOBILE_LIGHT, enhancedCandidate: true, active }), { initialProps: { active: false } });
    feed(view, 0, 200, 20);
    expect(view.result.current.tier).toBe(SCENE_TIERS.MOBILE_LIGHT);
    view.rerender({ active: true });
    feed(view, 4000, 50, 20);
    view.rerender({ active: false });
    view.rerender({ active: true });
    feed(view, 6000, 50, 20);
    expect(view.result.current.tier).toBe(SCENE_TIERS.MOBILE_LIGHT);
    feed(view, 7000, 41, 20);
    expect(view.result.current.tier).toBe(SCENE_TIERS.MOBILE_ENHANCED);
  });

  it('does not combine performance windows across an offscreen/visible cycle', () => {
    const view = renderHook(() => usePerformanceTier({ initialTier: SCENE_TIERS.MOBILE_LIGHT, enhancedCandidate: true }));
    feed(view, 0, 50, 20, { epoch: 1 });
    // Demand rendering may produce no frames while offscreen. The visibility
    // epoch still discards the old sample when the first visible frame arrives.
    feed(view, 5000, 50, 20, { epoch: 3 });
    expect(view.result.current.tier).toBe(SCENE_TIERS.MOBILE_LIGHT);
    feed(view, 6000, 41, 20, { epoch: 3 });
    expect(view.result.current.tier).toBe(SCENE_TIERS.MOBILE_ENHANCED);
  });

  it('ignores hidden frames and discards partial windows on background return', () => {
    let hidden = false;
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    const view = renderHook(() => usePerformanceTier({ initialTier: SCENE_TIERS.MOBILE_LIGHT, enhancedCandidate: true }));
    feed(view, 0, 50, 20);
    act(() => { hidden = true; document.dispatchEvent(new Event('visibilitychange')); });
    feed(view, 1000, 200, 20);
    act(() => { hidden = false; document.dispatchEvent(new Event('visibilitychange')); });
    feed(view, 5000, 50, 20);
    expect(view.result.current.tier).toBe(SCENE_TIERS.MOBILE_LIGHT);
    feed(view, 6000, 41, 20);
    expect(view.result.current.tier).toBe(SCENE_TIERS.MOBILE_ENHANCED);
  });

  it('uses actual long-task durations and releases the observer on unmount', () => {
    let notify;
    const disconnect = vi.fn();
    vi.stubGlobal('PerformanceObserver', class {
      constructor(callback) { notify = callback; }
      observe() {}
      disconnect = disconnect;
    });
    const view = renderHook(() => usePerformanceTier({ initialTier: SCENE_TIERS.MOBILE_LIGHT, enhancedCandidate: true }));
    feed(view, 0, 1, 20);
    act(() => notify({ getEntries: () => [{ startTime: 10, duration: 500 }] }));
    feed(view, 20, 90, 20);
    expect(view.result.current.tier).toBe(SCENE_TIERS.MOBILE_LIGHT);
    // One clean window can earn promotion after the long task is gone.
    feed(view, 1820, 90, 20);
    expect(view.result.current.tier).toBe(SCENE_TIERS.MOBILE_ENHANCED);
    view.unmount();
    expect(disconnect).toHaveBeenCalled();
  });
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
