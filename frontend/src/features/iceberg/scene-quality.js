import { SCENE_TIERS } from './scene-policy.js';

function deepFreeze(value) {
  Object.values(value).forEach(item => {
    if (item && typeof item === 'object' && !Object.isFrozen(item)) deepFreeze(item);
  });
  return Object.freeze(value);
}

export const SCENE_QUALITY = deepFreeze({
  [SCENE_TIERS.STATIC]: {
    tier: SCENE_TIERS.STATIC, canvas: false, dpr: [1, 1], ambientFps: 0, activeFps: 0,
    reflections: false, refraction: false, shadows: false, transmissionSamples: 0,
    marineSnowCount: 0, fishSchoolCount: 0, jellyfishCount: 0, cameraOrbitDegrees: 0,
    water: 'poster', atmosphere: 'poster',
  },
  [SCENE_TIERS.MOBILE_LIGHT]: {
    tier: SCENE_TIERS.MOBILE_LIGHT, canvas: true, dpr: [0.75, 1], ambientFps: 22, activeFps: 30,
    reflections: false, refraction: false, shadows: false, transmissionSamples: 0,
    marineSnowCount: 60, fishSchoolCount: 1, jellyfishCount: 1, cameraOrbitDegrees: 180,
    water: 'simple-ripples', atmosphere: 'depth-gated-light',
  },
  [SCENE_TIERS.MOBILE_ENHANCED]: {
    tier: SCENE_TIERS.MOBILE_ENHANCED, canvas: true, dpr: [1, 1.5], ambientFps: 30, activeFps: 45,
    reflections: true, refraction: true, shadows: false, transmissionSamples: 2,
    marineSnowCount: 150, fishSchoolCount: 2, jellyfishCount: 3, cameraOrbitDegrees: 220,
    water: 'reduced-optical', atmosphere: 'depth-gated-enhanced',
  },
  [SCENE_TIERS.DESKTOP_FULL]: {
    tier: SCENE_TIERS.DESKTOP_FULL, canvas: true, dpr: [1, 1.5], ambientFps: null, activeFps: null,
    reflections: true, refraction: true, shadows: true, transmissionSamples: 6,
    marineSnowCount: 1100, fishSchoolCount: 2, jellyfishCount: 2, cameraOrbitDegrees: 450,
    water: 'full-optical', atmosphere: 'desktop-full',
  },
});

export function getSceneQuality(tier) {
  return SCENE_QUALITY[tier] ?? SCENE_QUALITY[SCENE_TIERS.STATIC];
}
