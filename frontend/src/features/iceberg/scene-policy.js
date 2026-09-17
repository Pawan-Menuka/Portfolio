export const SCENE_TIERS = Object.freeze({
  STATIC: 'static',
  MOBILE_LIGHT: 'mobile-light',
  MOBILE_ENHANCED: 'mobile-enhanced',
  DESKTOP_FULL: 'desktop-full',
});

export const desktopQuery = '(min-width: 901px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
export const mobileQuery = '(max-width: 900px), (hover: none), (pointer: coarse)';
export const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
export const TIER_CALIBRATION_KEY = 'iceberg-scene-tier-v1';
export const TIER_CALIBRATION_VERSION = 1;
export const TIER_CALIBRATION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

function storageRecord(value) {
  if (!value || value.version !== TIER_CALIBRATION_VERSION) return null;
  if (!Object.values(SCENE_TIERS).includes(value.tier)) return null;
  if (!Number.isFinite(value.timestamp)) return null;
  return value;
}

export function readTierCalibration(storage, now = Date.now()) {
  if (!storage) return null;
  try {
    const value = storageRecord(JSON.parse(storage.getItem(TIER_CALIBRATION_KEY)));
    if (!value || now - value.timestamp < 0 || now - value.timestamp > TIER_CALIBRATION_MAX_AGE_MS) return null;
    return value;
  } catch {
    return null;
  }
}

export function writeTierCalibration(storage, tier, now = Date.now()) {
  if (!storage || !Object.values(SCENE_TIERS).includes(tier)) return false;
  try {
    storage.setItem(TIER_CALIBRATION_KEY, JSON.stringify({ version: TIER_CALIBRATION_VERSION, tier, timestamp: now }));
    return true;
  } catch {
    return false;
  }
}

/** Pure initial classifier. Optional browser APIs should be normalized by the caller. */
export function selectInitialSceneTier({
  reducedMotion = false,
  webgl2 = false,
  saveData = false,
  hardFailure = false,
  desktop = false,
  mobile = false,
  viewportTallEnough = true,
  calibration = null,
} = {}) {
  if (reducedMotion || !webgl2 || saveData || hardFailure) return SCENE_TIERS.STATIC;
  if (desktop) return viewportTallEnough ? SCENE_TIERS.DESKTOP_FULL : SCENE_TIERS.STATIC;
  if (!mobile) return SCENE_TIERS.STATIC;
  if (storageRecord(calibration)?.tier === SCENE_TIERS.STATIC) return SCENE_TIERS.STATIC;
  if (storageRecord(calibration)?.tier === SCENE_TIERS.MOBILE_ENHANCED) return SCENE_TIERS.MOBILE_ENHANCED;
  return SCENE_TIERS.MOBILE_LIGHT;
}

export function isEnhancedCandidate({ logicalCores, deviceMemory, calibration } = {}) {
  if (storageRecord(calibration)?.tier === SCENE_TIERS.MOBILE_ENHANCED) return true;
  const cores = Number.isFinite(logicalCores) ? logicalCores : 0;
  const memory = Number.isFinite(deviceMemory) ? deviceMemory : 0;
  return cores >= 8 || (cores >= 6 && memory >= 6);
}

function rootTextSize() {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return 16;
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function browserPolicyInput() {
  if (typeof window === 'undefined') return {};
  const calibration = readTierCalibration(browserStorage());
  const desktop = window.matchMedia?.(desktopQuery).matches ?? false;
  // desktopQuery already requires no-preference, so a real browser cannot match
  // both. The guard also keeps policy deterministic in minimal test shims.
  const reducedMotion = !desktop && (window.matchMedia?.(reducedMotionQuery).matches ?? false);
  return {
    reducedMotion,
    webgl2: typeof window.WebGL2RenderingContext !== 'undefined',
    saveData: window.navigator?.connection?.saveData === true,
    hardFailure: calibration?.tier === SCENE_TIERS.STATIC,
    desktop,
    mobile: window.matchMedia?.(mobileQuery).matches ?? window.innerWidth <= 900,
    viewportTallEnough: window.innerHeight >= rootTextSize() * 40,
    calibration,
  };
}

function reviewTierOverride() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;
  const requested = new URLSearchParams(window.location.search).get('scene-tier');
  return Object.values(SCENE_TIERS).includes(requested) ? requested : null;
}

export function getSceneTier() {
  const override = reviewTierOverride();
  if (override) return override;
  return selectInitialSceneTier(browserPolicyInput());
}

export function getEnhancedCandidate() {
  if (typeof window === 'undefined') return false;
  const override = reviewTierOverride();
  if (override) return override === SCENE_TIERS.MOBILE_ENHANCED;
  const calibration = readTierCalibration(browserStorage());
  return isEnhancedCandidate({
    logicalCores: window.navigator?.hardwareConcurrency,
    deviceMemory: window.navigator?.deviceMemory,
    calibration,
  });
}

/** Kept for existing callers while IcebergHero migrates to getSceneTier. */
export function desktopSceneAllowed() {
  return getSceneTier() === SCENE_TIERS.DESKTOP_FULL;
}

export function subscribeScenePolicy(callback) {
  if (typeof window === 'undefined') return () => {};
  const media = [desktopQuery, mobileQuery, reducedMotionQuery]
    .map(query => window.matchMedia?.(query))
    .filter(Boolean);
  media.forEach(item => item.addEventListener?.('change', callback));
  window.addEventListener('resize', callback);
  window.addEventListener('orientationchange', callback);
  document?.addEventListener?.('visibilitychange', callback);
  const connection = window.navigator?.connection;
  connection?.addEventListener?.('change', callback);
  let frame;
  const Observer = window.ResizeObserver ?? globalThis.ResizeObserver;
  const observer = Observer && typeof document !== 'undefined' ? new Observer(() => {
    window.cancelAnimationFrame?.(frame);
    frame = window.requestAnimationFrame?.(callback);
  }) : null;
  if (observer && document?.documentElement) observer.observe(document.documentElement);
  return () => {
    media.forEach(item => item.removeEventListener?.('change', callback));
    window.removeEventListener('resize', callback);
    window.removeEventListener('orientationchange', callback);
    document?.removeEventListener?.('visibilitychange', callback);
    connection?.removeEventListener?.('change', callback);
    observer?.disconnect();
    window.cancelAnimationFrame?.(frame);
  };
}
