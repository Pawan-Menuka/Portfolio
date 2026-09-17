import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box3, PerspectiveCamera, Raycaster, Vector2, Vector3 } from 'three';
import { sampleCamera } from './camera-path.mjs';
import { sampleMobileCamera } from './mobile-camera-path.mjs';
import { journeyLabels, labelOpacity } from './journey-labels.mjs';

export default function IceMarkers({ motion, tier = 'desktop-full' }) {
  const tracking = useRef({ id: null, anchors: new Map(), point: new Vector3(), projected: new Vector3(), ray: new Raycaster(), screen: new Vector2(-.12, .12), anchorCamera: new PerspectiveCamera(48, 1, .1, 1000) });
  useFrame(({ camera, scene, gl }) => {
    const active = journeyLabels.find(label => labelOpacity(motion.current.current, label.t) > .01);
    const state = tracking.current;
    if (!active) { state.id = null; return; }
    const fixedAnchor = active.id === 'contact' || active.id === 'creative';
    camera.updateMatrixWorld();
    // Resolve once from the canonical checkpoint pose, never from scroll position
    // or viewport aspect. The cached surface point remains fixed on the mesh.
    if (!state.anchors.has(active.id)) {
      const mobile = tier === 'mobile-light' || tier === 'mobile-enhanced';
      // Mobile uses one canonical square-aspect pose for both quality tiers.
      // The ray therefore resolves to the same model-space facet after a
      // promotion, resize, or orientation change.
      const pose = mobile ? sampleMobileCamera(active.t, { aspect: 1 }) : sampleCamera(active.t);
      const anchorCamera = state.anchorCamera;
      anchorCamera.position.fromArray(pose.position);
      anchorCamera.lookAt(...pose.target);
      anchorCamera.updateMatrixWorld();
      const meshes = ['ice_above', 'ice_below'].map(name => scene.getObjectByName(name)).filter(Boolean);
      if (meshes.length !== 2) return;
      meshes.forEach(mesh => mesh.updateWorldMatrix(true, false));
      state.ray.setFromCamera(state.screen, anchorCamera);
      if (fixedAnchor) {
        const ice = meshes.find(mesh => mesh.name === 'ice_below');
        if (ice) {
          // Geometry landmarks for the narrow lower checkpoints, independent of aspect ratio.
          const bounds = new Box3().setFromObject(ice);
          const target = bounds.getCenter(new Vector3());
          target.y = bounds.min.y + (bounds.max.y - bounds.min.y) * (active.id === 'contact' ? .11 : .21);
          if (active.id === 'creative') target.x += 2.5;
          const vertex = new Vector3();
          const anchor = new Vector3();
          let nearest = Infinity;
          const positions = ice.geometry.attributes.position;
          for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i).applyMatrix4(ice.matrixWorld);
            const score = (vertex.y - target.y) ** 2 * 8 + (vertex.x - target.x) ** 2 + (vertex.z - target.z) ** 2;
            if (score < nearest) { nearest = score; anchor.copy(vertex); }
          }
          state.point.copy(anchor);
          // Aim inside the marked broad facet instead of snapping to a distant corner.
          if (active.id === 'creative') anchor.copy(target);
          state.ray.set(anchorCamera.position, anchor.sub(anchorCamera.position).normalize());
        }
      }
      if (active.id === 'full-stack') {
        const peak = meshes.find(mesh => mesh.name === 'ice_above');
        if (peak) {
          const bounds = new Box3().setFromObject(peak);
          const target = bounds.getCenter(new Vector3());
          target.y = bounds.max.y - (bounds.max.y - bounds.min.y) * .22;
          state.ray.set(anchorCamera.position, target.sub(anchorCamera.position).normalize());
        }
      }
      const hit = state.ray.intersectObjects(meshes, false)[0];
      if (!hit && !fixedAnchor) return;
      if (hit) state.point.copy(hit.point);
      state.anchors.set(active.id, state.point.clone());
    }
    state.point.copy(state.anchors.get(active.id));
    state.id = active.id;
    state.projected.copy(state.point).project(camera);
    const card = gl.domElement.closest('.iceberg-journey')?.querySelector(`[data-label-id="${active.id}"]`);
    if (card) {
      card.style.setProperty('--marker-x', `${Math.max(30, Math.min(60, (state.projected.x + 1) * 50))}%`);
      card.style.setProperty('--marker-y', `${Math.max(active.id === 'full-stack' ? 10 : 28, Math.min(60, (1 - state.projected.y) * 50))}vh`);
      {
        const copy = card.querySelector('.journey-card-copy');
        const pin = card.querySelector('.facet-pin');
        if (copy && pin) {
          const canvasRect = gl.domElement.getBoundingClientRect();
          const copyRect = copy.getBoundingClientRect();
          const x = canvasRect.left + (state.projected.x + 1) * .5 * canvasRect.width - copyRect.left;
          const y = canvasRect.top + (1 - state.projected.y) * .5 * canvasRect.height - copyRect.top;
          pin.style.left = `${x - 4}px`;
          pin.style.top = `${y - 4}px`;
          pin.style.setProperty('--connector-length', `${Math.hypot(40 - x, 12 - y)}px`);
          pin.style.setProperty('--connector-angle', `${Math.atan2(12 - y, 40 - x)}rad`);
        }
      }
      const depth = card.querySelector('.marker-depth');
      if (depth) depth.textContent = `${Math.round(Math.max(0, -camera.position.y))} M`;
    }
  });
  return null;
}
