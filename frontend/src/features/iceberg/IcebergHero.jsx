import { Component, lazy, Suspense, useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getEnhancedCandidate, getSceneTier, SCENE_TIERS, subscribeScenePolicy } from './scene-policy.js';
import { getSceneQuality } from './scene-quality.js';
import { usePerformanceTier } from './use-performance-tier.js';

const Scene = lazy(() => import('./IcebergScene.jsx'));
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function ScenePreview({ onFailure, onReady, onFrame, ready, tier, enhancedCandidate }) {
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(onFailure, 25000);
    return () => clearTimeout(timer);
  }, [onFailure, ready]);
  return <SceneBoundary onFailure={onFailure}><Suspense fallback={null}><Scene tier={tier} enhancedCandidate={enhancedCandidate} onFrame={onFrame} onReady={onReady} onFailure={onFailure} /></Suspense></SceneBoundary>;
}

export default function IcebergHero({ onTierChange }) {
  const initialTier = useSyncExternalStore(subscribeScenePolicy, getSceneTier, () => SCENE_TIERS.STATIC);
  return <PreviewSession key={initialTier} initialTier={initialTier} enhancedCandidate={getEnhancedCandidate()} onTierChange={onTierChange} />;
}

function PreviewSession({ initialTier, enhancedCandidate, onTierChange }) {
  const [failed, setFailed] = useState(false);
  const [report, setReport] = useState(null);
  const { tier: adaptiveTier, recordFrame, reportFailure } = usePerformanceTier({ initialTier, enhancedCandidate, active: !failed });
  const onFailure = useCallback(() => { setFailed(true); reportFailure(); }, [reportFailure]);
  const onReady = useCallback(value => setReport(value), []);
  const tier = failed ? SCENE_TIERS.STATIC : adaptiveTier;
  useEffect(() => { onTierChange?.(tier); }, [onTierChange, tier]);
  useEffect(() => {
    if (!import.meta.env.DEV || !new URLSearchParams(window.location.search).has('scene-tier')) return;
    const previousTitle = document.title;
    const label = tier.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
    document.title = `${label} · Iceberg Preview`;
    return () => { document.title = previousTitle; };
  }, [tier]);
  const quality = getSceneQuality(tier);
  const enabled = quality.canvas && !failed;
  const ready = enabled && report !== null;
  return <div className="iceberg-preview" role="img" aria-label="Faceted iceberg: white above the waterline, with a much larger blue body beneath" data-scene-tier={tier} data-scene-state={ready ? 'ready' : enabled ? 'loading' : 'static'} data-scene-report={ready ? JSON.stringify({ ...report, tier }) : undefined}>
    <img className={`hero-image iceberg-poster${ready ? ' iceberg-poster-hidden' : ''}`} src="/images/iceberg-b.webp" width="1100" height="1375" alt="" fetchPriority="high" />
    {enabled && !ready && <span className="scene-loading" aria-hidden="true">Preparing the descent…</span>}
    {enabled && <ScenePreview onFailure={onFailure} onReady={onReady} onFrame={recordFrame} ready={ready} tier={tier} enhancedCandidate={enhancedCandidate} />}
  </div>;
}
