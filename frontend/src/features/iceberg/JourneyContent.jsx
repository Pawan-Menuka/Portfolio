import { Link } from 'react-router-dom';
import { journeyLabels } from './journey-labels.mjs';

function tierName(tier, quality) {
  if (typeof tier === 'string') return tier;
  if (typeof quality?.tier === 'string') return quality.tier;
  if (typeof quality?.id === 'string') return quality.id;
  return 'static';
}

/**
 * Applies the accessible state for a camera-managed checkpoint label.
 * Passing null hides every label while transitions cross the gap between stops.
 */
// oxlint-disable-next-line react/only-export-components -- ScrollCamera consumes this DOM accessibility controller.
export function activateJourneyLabel(container, activeLabelId) {
  if (!container) return;
  for (const card of container.querySelectorAll('[data-label-id]')) {
    const active = card.dataset.labelId === activeLabelId;
    card.dataset.labelState = active ? 'active' : 'inactive';
    if (active) {
      card.inert = false;
      card.removeAttribute('inert');
      card.removeAttribute('aria-hidden');
    } else {
      card.inert = true;
      card.setAttribute('aria-hidden', 'true');
    }
  }
}

/** Restores the complete, normally-flowing fallback content. */
// oxlint-disable-next-line react/only-export-components -- Scene fallback consumes this reset helper.
export function resetJourneyLabels(container) {
  if (!container) return;
  for (const card of container.querySelectorAll('[data-label-id]')) {
    card.inert = false;
    card.removeAttribute('inert');
    card.removeAttribute('aria-hidden');
    card.dataset.labelState = 'static';
    card.style.removeProperty('--label-opacity');
  }
}

export default function JourneyContent({ tier, quality, activeLabelId }) {
  const resolvedTier = tierName(tier, quality);
  const cameraManaged = activeLabelId !== undefined;

  return <div className="journey-content" data-tier={resolvedTier} data-label-management={cameraManaged ? 'controlled' : 'camera'}>
    {journeyLabels.map((label, index) => {
      const active = cameraManaged && activeLabelId === label.id;
      const hiddenProps = cameraManaged && !active ? { inert: true, 'aria-hidden': 'true' } : {};
      return <section
        key={label.id}
        className="journey-card"
        id={`journey-${label.id}`}
        data-label-id={label.id}
        data-label-state={cameraManaged ? (active ? 'active' : 'inactive') : 'static'}
        data-mobile-side={index % 2 === 0 ? 'right' : 'left'}
        style={{ '--stop': label.t }}
        aria-labelledby={`heading-${label.id}`}
        {...hiddenProps}
      >
        <div className="journey-card-copy">
          <span className="facet-pin" aria-hidden="true" />
          <div className="journey-card-panel">
            <span className="ice-inscription-index" aria-hidden="true">{String(index + 1).padStart(2, '0')} <span /> {index === 0 ? 'ABOVE THE LINE' : 'BENEATH THE SURFACE'}</span>
            <span className="marker-depth" aria-hidden="true">{[0, 18, 34, 50, 66, 84][index]} M</span>
            <h2 id={`heading-${label.id}`}>{label.title}</h2>
            <p>{label.description}</p>
            <Link className="text-link" to={label.href}>{label.id === 'contact' ? 'Get in touch →' : 'View projects →'}</Link>
            {label.id === 'contact' && <a className="text-link surface-link" href="#journey-intro">Back to the surface ↑</a>}
          </div>
        </div>
      </section>;
    })}
  </div>;
}
