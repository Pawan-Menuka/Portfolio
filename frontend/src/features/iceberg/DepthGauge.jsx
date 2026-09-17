import { journeyLabels } from './journey-labels.mjs';

const CHECKPOINT_DEPTHS = Object.freeze([0, 18, 34, 50, 66, 84]);

// oxlint-disable-next-line react/only-export-components -- Shared instrument data is tested and consumed without rendering.
export const depthCheckpoints = Object.freeze(
  journeyLabels.map((label, index) => Object.freeze({
    id: label.id,
    title: label.title,
    t: label.t,
    depth: CHECKPOINT_DEPTHS[index],
  })),
);

function tierName(tier, quality) {
  if (typeof tier === 'string') return tier;
  if (typeof quality?.tier === 'string') return quality.tier;
  if (typeof quality?.id === 'string') return quality.id;
  return 'auto';
}

function gaugeMode(mode, tier, quality) {
  if (mode === 'compact' || mode === 'full') return mode;
  const configured = quality?.depthGauge?.mode ?? quality?.depthGaugeMode;
  if (configured === 'compact' || configured === 'full') return configured;
  return tier.startsWith('mobile-') ? 'compact' : 'full';
}

export default function DepthGauge({
  tier,
  quality,
  mode = 'auto',
  currentDepth,
  activeCheckpointId,
}) {
  const resolvedTier = tierName(tier, quality);
  const resolvedMode = gaugeMode(mode, resolvedTier, quality);
  const boundedDepth = Math.min(84, Math.max(0, Number(currentDepth) || 0));
  const controlledDepthStyle = currentDepth === undefined ? undefined : { '--depth-position': boundedDepth / 84 };

  return <aside
    className={`depth-gauge depth-gauge-${resolvedMode}`}
    data-gauge-mode={resolvedMode}
    data-tier={resolvedTier}
    aria-label="Journey checkpoints and depth"
  >
    <span className="depth-gauge-title">Descent</span>
    <div className="depth-gauge-track" style={controlledDepthStyle}>
      {depthCheckpoints.map(point => <a
        key={point.id}
        href={`#journey-${point.id}`}
        className="depth-gauge-tick"
        data-checkpoint={point.id}
        data-depth={point.depth}
        style={{ '--tick-position': `${point.t * 100}%` }}
        aria-label={`Go to ${point.title}, ${point.depth} metres`}
        aria-current={point.id === activeCheckpointId ? 'step' : undefined}
      ><span className="checkpoint-name">{point.title}</span></a>)}
      <span className="depth-gauge-marker">
        <span className="depth-gauge-dot" aria-hidden="true" />
        <output className="depth-gauge-value" aria-live="off">{Math.round(boundedDepth)} m</output>
      </span>
    </div>
  </aside>;
}
