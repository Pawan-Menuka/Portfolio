import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { AgXToneMapping } from 'three';
import { disposeModel, inspectIceberg } from './model-utils.js';
import ScrollCamera from './ScrollCamera.jsx';
import IceMarkers from './IceMarkers.jsx';
import OceanEnvironment from './OceanEnvironment.jsx';
import { useOceanTime } from './use-ocean-time.js';
import { applyIceMaterials } from './ice-materials.js';
import { getSceneQuality } from './scene-quality.js';

function Model({ onReady, onFailure, time, quality }) {
  const [asset, setAsset] = useState(null);
  const { size, gl } = useThree();
  const announced = useRef(false);
  useEffect(() => {
    const abort = new AbortController();
    const decoder = new DRACOLoader().setDecoderPath({ js: '/draco/draco_wasm_wrapper.js', wasm: '/draco/draco_decoder.wasm' }).setWorkerLimit(1);
    const loader = new GLTFLoader().setDRACOLoader(decoder);
    let active = true;
    let scene = null;
    const started = performance.now();
    async function load() {
      try {
        const modelUrl = import.meta.env.DEV && new URLSearchParams(location.search).get('review') === 'model-failure'
          ? '/models/review-missing.glb' : '/models/iceberg-b.glb';
        const response = await fetch(modelUrl, { signal: abort.signal });
        if (!response.ok) throw new Error('Model unavailable');
        const data = await response.arrayBuffer();
        const gltf = await loader.parseAsync(data, '/models/');
        scene = gltf.scene;
        if (!active) { disposeModel(scene); scene = null; return; }
        const checked = inspectIceberg(scene);
        setAsset({ scene, ...checked, report: { ...checked.report, loadMs: Math.round(performance.now() - started), bytes: data.byteLength } });
      } catch {
        if (scene) { disposeModel(scene); scene = null; }
        if (active) onFailure();
      } finally { decoder.dispose(); }
    }
    load();
    return () => {
      active = false; abort.abort();
      if (scene) { disposeModel(scene); scene = null; }
      // A decode already running finishes before its worker is disposed in finally.
    };
  }, [onFailure, time]);
  useEffect(() => {
    if (asset) applyIceMaterials(asset.scene, time, quality);
  }, [asset, quality, time]);
  useEffect(() => {
    function lost(event) { event.preventDefault(); onFailure(); }
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onFailure]);
  useFrame(() => {
    if (asset && !announced.current) {
      announced.current = true;
      onReady({ ...asset.report, renderer: 'WebGL2', dpr: gl.getPixelRatio(), canvas: [size.width, size.height] });
    }
  });
  return asset ? <primitive object={asset.scene} dispose={null} /> : null;
}

function FrameReporter({ onFrame, probe, tier }) {
  const { invalidate } = useThree();
  const remaining = useRef(probe ? 120 : 0);
  const elapsedMs = useRef(0);
  useEffect(() => { remaining.current = probe ? 120 : 0; }, [probe, tier]);
  useFrame((_, delta) => {
    elapsedMs.current += delta * 1000;
    onFrame?.(elapsedMs.current);
    if (remaining.current > 0) {
      remaining.current -= 1;
      invalidate();
    }
  }, -3);
  return null;
}

export default function IcebergScene({ onReady, onFailure, onFrame, tier = 'desktop-full', enhancedCandidate = false }) {
  const quality = getSceneQuality(tier);
  return <div className="iceberg-canvas" aria-hidden="true">
    <Canvas frameloop="demand" dpr={quality.dpr} camera={{ fov: 48, near: 0.1, far: 1000, position: [0, 12, 150] }} gl={{ antialias: tier !== 'mobile-light', alpha: true, powerPreference: tier === 'desktop-full' ? 'high-performance' : 'low-power' }} onCreated={({ gl }) => { gl.toneMapping = AgXToneMapping; gl.toneMappingExposure = 1.05; }}>
      <SceneContent quality={quality} tier={tier} enhancedCandidate={enhancedCandidate} onFrame={onFrame} onReady={onReady} onFailure={onFailure} />
    </Canvas>
  </div>;
}

function SceneContent({ onReady, onFailure, onFrame, quality, tier, enhancedCandidate }) {
  const motion = useRef({ current: 0, requested: 0, initial: true });
  const [sceneReady, setSceneReady] = useState(false);
  const handleReady = useCallback(report => {
    setSceneReady(true);
    onReady(report);
  }, [onReady]);
  const time = useOceanTime(quality.ambientFps);
  return <>
    <hemisphereLight args={['#aacbdc', '#051b2b', .65]} />
    <directionalLight position={[-35, 65, 40]} color="#e7f4ff" intensity={3.2} />
    <directionalLight position={[35, 18, -45]} color="#74c5df" intensity={1.1} />
    <Model onReady={handleReady} onFailure={onFailure} time={time} quality={quality} />
    <OceanEnvironment time={time} quality={quality} />
    <ScrollCamera motion={motion} tier={tier} />
    <IceMarkers motion={motion} tier={tier} />
    <FrameReporter onFrame={onFrame} tier={tier} probe={sceneReady && enhancedCandidate && tier === 'mobile-light'} />
  </>;
}
