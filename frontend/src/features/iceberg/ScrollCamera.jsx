import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { advanceProgress, sampleCamera } from './camera-path.mjs';
import { sampleMobileCamera } from './mobile-camera-path.mjs';
import { observeJourney } from './scroll-progress.mjs';
import { journeyLabels, labelOpacity } from './journey-labels.mjs';
import { activateJourneyLabel, resetJourneyLabels } from './JourneyContent.jsx';

export default function ScrollCamera({ motion, tier = 'desktop-full' }) {
  const { camera, gl, invalidate, size } = useThree();
  const mobile = tier === 'mobile-light' || tier === 'mobile-enhanced';
  useEffect(() => {
    const journey = gl.domElement.closest('.iceberg-journey');
    if (!journey) return;
    const stop = observeJourney(journey, requested => {
      motion.current.requested = requested;
      journey.style.setProperty('--requested-progress', String(requested));
      if (motion.current.initial) { motion.current.current = requested; motion.current.initial = false; }
      if (!document.hidden) invalidate();
    });
    const resume = () => { if (!document.hidden) invalidate(); };
    document.addEventListener('visibilitychange', resume);
    return () => {
      stop(); document.removeEventListener('visibilitychange', resume);
      resetJourneyLabels(journey);
      const intro = journey.querySelector('.hero-copy');
      if (intro) intro.inert = false;
    };
  }, [gl, invalidate, motion]);
  useEffect(() => {
    invalidate();
    return () => camera.clearViewOffset();
  }, [camera, size.width, size.height, tier, invalidate]);
  useFrame((_, delta) => {
    if (document.hidden) return;
    const state = motion.current;
    // oxlint-disable-next-line react/immutability -- Shared R3F animation ref, intentionally updated outside React rendering.
    state.current = advanceProgress(state.current, state.requested, delta);
    const settled = Math.abs(state.current - state.requested) < 0.0001;
    if (settled) state.current = state.requested;
    // Ease the opening composition into the center by the first content stop.
    // Use the same damped progress as the orbit so reverse scrolling retraces it.
    const entrance = Math.max(0, Math.min(1, state.current / 0.14));
    const centered = entrance ** 3 * (entrance * (entrance * 6 - 15) + 10);
    const offsetX = -size.width * (mobile ? 0.035 : 0.25) * (1 - centered);
    if (!camera.view?.enabled || camera.view.offsetX !== offsetX || camera.view.fullWidth !== size.width || camera.view.fullHeight !== size.height) {
      camera.setViewOffset(size.width, size.height, offsetX, 0, size.width, size.height);
    }
      const sample = mobile ? sampleMobileCamera(state.current, { aspect: size.width / Math.max(1, size.height) }) : sampleCamera(state.current);
      if (camera.fov !== sample.fov) {
        // oxlint-disable-next-line react/immutability -- R3F cameras are imperative Three.js objects.
        camera.fov = sample.fov;
        camera.updateProjectionMatrix();
      }
      camera.position.fromArray(sample.position);
      camera.lookAt(...sample.target);
      const journey = gl.domElement.closest('.iceberg-journey');
      if (journey) {
        const depth = Math.min(88, Math.max(0, -sample.position[1]));
        journey.dataset.progress = state.current.toFixed(4);
        journey.dataset.section = sample.section;
        journey.dataset.settled = String(settled);
        journey.style.setProperty('--depth-position', String(state.current));
        for (const tick of journey.querySelectorAll('[data-checkpoint]')) {
          if (tick.dataset.checkpoint === sample.section) tick.setAttribute('aria-current', 'step');
          else tick.removeAttribute('aria-current');
        }
        const depthValue = journey.querySelector('.depth-gauge-value');
        if (depthValue) depthValue.textContent = `${Math.round(depth)} m`;
      const introOpacity = Math.max(0, 1 - state.current / 0.07);
      journey.style.setProperty('--intro-opacity', String(introOpacity));
      const intro = journey.querySelector('.hero-copy');
      if (intro) intro.inert = introOpacity < 0.01;
      let activeLabelId = null;
      for (const label of journeyLabels) {
        const card = journey.querySelector(`[data-label-id="${label.id}"]`);
        if (card) {
          const opacity = labelOpacity(state.current, label.t);
          card.style.setProperty('--label-opacity', String(opacity));
          if (opacity >= .01) activeLabelId = label.id;
        }
      }
      activateJourneyLabel(journey, activeLabelId);
    }
    if (!settled) invalidate();
  }, -2);
  return null;
}
