import { useCallback, useEffect, useRef, useState } from 'react';
import { SCENE_TIERS, writeTierCalibration } from './scene-policy.js';

function localStorageOrNull() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const PERFORMANCE_THRESHOLDS = Object.freeze({
  sampleSize: 90,
  promoteP95Ms: 24,
  downgradeP95Ms: 34,
  staticP95Ms: 50,
  consecutivePoorWindows: 2,
  maxLongTaskRatio: 0.1,
  cooldownMs: 10_000,
});

export function percentile95(values) {
  if (!values.length) return Infinity;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * 0.95) - 1];
}

export function evaluatePerformanceWindow({ tier, intervals, enhancedCandidate = false, longTaskRatio = 0 }) {
  if (tier !== SCENE_TIERS.MOBILE_LIGHT && tier !== SCENE_TIERS.MOBILE_ENHANCED) return { action: 'keep', p95: Infinity };
  if (intervals.length < PERFORMANCE_THRESHOLDS.sampleSize) return { action: 'keep', p95: percentile95(intervals) };
  const p95 = percentile95(intervals);
  if (tier === SCENE_TIERS.MOBILE_ENHANCED && p95 > PERFORMANCE_THRESHOLDS.downgradeP95Ms) return { action: 'poor', p95 };
  if (tier === SCENE_TIERS.MOBILE_LIGHT && p95 > PERFORMANCE_THRESHOLDS.staticP95Ms) return { action: 'severe', p95 };
  if (tier === SCENE_TIERS.MOBILE_LIGHT && enhancedCandidate && p95 <= PERFORMANCE_THRESHOLDS.promoteP95Ms && longTaskRatio <= PERFORMANCE_THRESHOLDS.maxLongTaskRatio) {
    return { action: 'promote', p95 };
  }
  return { action: 'keep', p95 };
}

export function nextAdaptiveTier({ tier, action, poorWindows = 0, now, lastChangeAt = -Infinity }) {
  if (now - lastChangeAt < PERFORMANCE_THRESHOLDS.cooldownMs) return { tier, poorWindows };
  if (action === 'promote' && tier === SCENE_TIERS.MOBILE_LIGHT) return { tier: SCENE_TIERS.MOBILE_ENHANCED, poorWindows: 0 };
  if (action === 'poor' && tier === SCENE_TIERS.MOBILE_ENHANCED) {
    const count = poorWindows + 1;
    return count >= PERFORMANCE_THRESHOLDS.consecutivePoorWindows
      ? { tier: SCENE_TIERS.MOBILE_LIGHT, poorWindows: 0 }
      : { tier, poorWindows: count };
  }
  if (action === 'severe' && tier === SCENE_TIERS.MOBILE_LIGHT) {
    const count = poorWindows + 1;
    return count >= PERFORMANCE_THRESHOLDS.consecutivePoorWindows
      ? { tier: SCENE_TIERS.STATIC, poorWindows: 0 }
      : { tier, poorWindows: count };
  }
  return { tier, poorWindows: 0 };
}

/** Call recordFrame from the scene's existing render loop; this hook starts no second loop. */
export function usePerformanceTier({ initialTier, enhancedCandidate = false, active = true } = {}) {
  const [tier, setTier] = useState(initialTier ?? SCENE_TIERS.STATIC);
  const state = useRef({ intervals: [], lastFrameAt: null, poorWindows: 0, lastChangeAt: -Infinity, longTasks: 0, windowStartedAt: null });

  useEffect(() => {
    if (!active || tier === SCENE_TIERS.STATIC || tier === SCENE_TIERS.DESKTOP_FULL || typeof PerformanceObserver === 'undefined') return;
    let observer;
    try {
      observer = new PerformanceObserver(list => { state.current.longTasks += list.getEntries().length; });
      observer.observe({ type: 'longtask', buffered: false });
    } catch {
      return;
    }
    return () => observer.disconnect();
  }, [active, tier]);

  const recordFrame = useCallback((timestamp = globalThis.performance?.now?.() ?? Date.now()) => {
    if (!active || (tier !== SCENE_TIERS.MOBILE_LIGHT && tier !== SCENE_TIERS.MOBILE_ENHANCED)) return;
    const sample = state.current;
    if (sample.lastFrameAt === null) {
      sample.lastFrameAt = timestamp;
      sample.windowStartedAt = timestamp;
      return;
    }
    const interval = timestamp - sample.lastFrameAt;
    sample.lastFrameAt = timestamp;
    if (interval <= 0 || interval > 1000) return;
    sample.intervals.push(interval);
    if (sample.intervals.length < PERFORMANCE_THRESHOLDS.sampleSize) return;
    const elapsed = Math.max(1, timestamp - sample.windowStartedAt);
    const longTaskRatio = Math.min(1, (sample.longTasks * 50) / elapsed);
    const result = evaluatePerformanceWindow({ tier, intervals: sample.intervals, enhancedCandidate, longTaskRatio });
    const transition = nextAdaptiveTier({ tier, action: result.action, poorWindows: sample.poorWindows, now: timestamp, lastChangeAt: sample.lastChangeAt });
    sample.intervals = [];
    sample.longTasks = 0;
    sample.windowStartedAt = timestamp;
    sample.poorWindows = transition.poorWindows;
    if (transition.tier !== tier) {
      sample.lastChangeAt = timestamp;
      writeTierCalibration(localStorageOrNull(), transition.tier);
      setTier(transition.tier);
    }
  }, [active, enhancedCandidate, tier]);

  const reportFailure = useCallback(() => {
    writeTierCalibration(localStorageOrNull(), SCENE_TIERS.STATIC);
    setTier(SCENE_TIERS.STATIC);
  }, []);

  return { tier, recordFrame, reportFailure };
}
