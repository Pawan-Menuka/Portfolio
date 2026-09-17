import { describe, expect, it } from 'vitest';
import {
  SCENE_TIERS,
  TIER_CALIBRATION_KEY,
  TIER_CALIBRATION_VERSION,
  isEnhancedCandidate,
  readTierCalibration,
  selectInitialSceneTier,
  writeTierCalibration,
} from '../src/features/iceberg/scene-policy.js';
import { getSceneQuality, SCENE_QUALITY } from '../src/features/iceberg/scene-quality.js';

const eligibleMobile = { webgl2: true, mobile: true };

describe('scene tier policy', () => {
  it.each([
    [{ ...eligibleMobile, reducedMotion: true }, 'reduced motion'],
    [{ ...eligibleMobile, saveData: true }, 'Data Saver'],
    [{ ...eligibleMobile, webgl2: false }, 'missing WebGL2'],
    [{ ...eligibleMobile, hardFailure: true }, 'a compatible hard failure'],
  ])('selects static for %s', (input) => {
    expect(selectInitialSceneTier(input)).toBe(SCENE_TIERS.STATIC);
  });

  it('selects full only for a tall precise-pointer desktop', () => {
    expect(selectInitialSceneTier({ webgl2: true, desktop: true, viewportTallEnough: true })).toBe(SCENE_TIERS.DESKTOP_FULL);
    expect(selectInitialSceneTier({ webgl2: true, desktop: true, viewportTallEnough: false })).toBe(SCENE_TIERS.STATIC);
  });

  it('starts an eligible uncalibrated mobile in light mode', () => {
    expect(selectInitialSceneTier(eligibleMobile)).toBe(SCENE_TIERS.MOBILE_LIGHT);
    expect(selectInitialSceneTier({ webgl2: true })).toBe(SCENE_TIERS.STATIC);
  });

  it('uses only a current compatible calibration as a starting hint', () => {
    const timestamp = 100;
    expect(selectInitialSceneTier({ ...eligibleMobile, calibration: { version: TIER_CALIBRATION_VERSION, tier: SCENE_TIERS.MOBILE_ENHANCED, timestamp } })).toBe(SCENE_TIERS.MOBILE_ENHANCED);
    expect(selectInitialSceneTier({ ...eligibleMobile, calibration: { version: 0, tier: SCENE_TIERS.MOBILE_ENHANCED, timestamp } })).toBe(SCENE_TIERS.MOBILE_LIGHT);
  });

  it('treats capability values as candidate hints rather than direct promotion', () => {
    expect(isEnhancedCandidate({ logicalCores: 8, deviceMemory: 8 })).toBe(true);
    expect(isEnhancedCandidate({})).toBe(false);
    expect(selectInitialSceneTier({ ...eligibleMobile, logicalCores: 16, deviceMemory: 16 })).toBe(SCENE_TIERS.MOBILE_LIGHT);
  });
});

describe('local calibration record', () => {
  it('stores only version, safe tier, and timestamp and rejects stale records', () => {
    const values = new Map();
    const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    expect(writeTierCalibration(storage, SCENE_TIERS.MOBILE_ENHANCED, 1_000)).toBe(true);
    const raw = JSON.parse(values.get(TIER_CALIBRATION_KEY));
    expect(raw).toEqual({ version: TIER_CALIBRATION_VERSION, tier: SCENE_TIERS.MOBILE_ENHANCED, timestamp: 1_000 });
    expect(readTierCalibration(storage, 1_001)).toEqual(raw);
    expect(readTierCalibration(storage, 30 * 24 * 60 * 60 * 1000)).toBeNull();
  });

  it('fails closed when storage is unavailable or corrupt', () => {
    const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    expect(readTierCalibration(broken)).toBeNull();
    expect(writeTierCalibration(broken, SCENE_TIERS.MOBILE_LIGHT)).toBe(false);
  });
});

describe('quality configuration', () => {
  it('is immutable and gives static for unknown tiers', () => {
    expect(Object.isFrozen(SCENE_QUALITY)).toBe(true);
    expect(Object.isFrozen(SCENE_QUALITY[SCENE_TIERS.MOBILE_LIGHT].dpr)).toBe(true);
    expect(getSceneQuality('unknown')).toBe(SCENE_QUALITY[SCENE_TIERS.STATIC]);
  });

  it('keeps expensive work out of light mode', () => {
    const light = getSceneQuality(SCENE_TIERS.MOBILE_LIGHT);
    expect(light.canvas).toBe(true);
    expect(light.reflections).toBe(false);
    expect(light.refraction).toBe(false);
    expect(light.shadows).toBe(false);
    expect(light.dpr[1]).toBe(1);
  });
});
