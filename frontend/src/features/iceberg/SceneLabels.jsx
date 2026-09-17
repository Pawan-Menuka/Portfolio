import { Component, Suspense, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard } from '@react-three/drei/core/Billboard';
import { Text } from '@react-three/drei/core/Text';
import { configureTextBuilder } from 'troika-three-text';
import { Vector3 } from 'three';
import { journeyLabels, labelOpacity } from './journey-labels.mjs';

// All temporary copy uses glyphs in this font. Never fall back to a remote CDN.
configureTextBuilder({ defaultFontURL: '/fonts/Inter.ttf', unicodeFontsURL: '/fonts/unicode/' });
const characters = [...new Set(journeyLabels.map(label => label.title).join(''))].join('');
class LabelBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

function Label({ label, motion }) {
  const group = useRef(null), text = useRef(null);
  const point = useRef(new Vector3());
  const forward = useRef(new Vector3());
  const { gl, invalidate, size, camera: mainCamera } = useThree();
  useEffect(() => {
    mainCamera.layers.enable(1);
    const journey = gl.domElement.closest('.iceberg-journey');
    return () => journey?.removeAttribute(`data-font-${label.id}`);
  }, [gl, label.id, mainCamera]);
  useFrame(({ camera }) => {
    if (!group.current || !text.current) return;
    const opacity = labelOpacity(motion.current.current, label.t);
    group.current.visible = opacity > 0.001;
    if (!group.current.visible) return;
    // Position in the left reading column, facing the sampled camera at each depth.
    point.current.set(-0.99, 0.22, 0).unproject(camera).sub(camera.position).normalize();
    group.current.position.copy(camera.position).addScaledVector(point.current, 60);
    // Perspective depth (rather than ray length) keeps typography stable across aspects.
    forward.current.set(0, 0, -1).applyQuaternion(camera.quaternion);
    const depth = point.current.dot(forward.current) * 60;
    const pixels = Math.max(25, Math.min(42, size.width * 0.03));
    group.current.scale.setScalar(2 * depth * Math.tan(24 * Math.PI / 180) / size.height * pixels);
    text.current.fillOpacity = opacity;
    text.current.outlineOpacity = opacity;
  });
  return <Billboard ref={group} visible={false}>
    <Text ref={text} layers-mask={2} font="/fonts/Inter.ttf" characters={characters} fontSize={1} maxWidth={10.5} lineHeight={1.15} anchorX="left" anchorY="top" color="#d4f4fb" material-toneMapped={false} material-fog={false} outlineColor="#03131d" outlineWidth={0.015} onSync={() => { gl.domElement.closest('.iceberg-journey')?.setAttribute(`data-font-${label.id}`, 'ready'); invalidate(); }}>{label.title}</Text>
  </Billboard>;
}

export default function SceneLabels({ motion }) {
  return <LabelBoundary><Suspense fallback={null}>{journeyLabels.map(label => <Label key={label.id} label={label} motion={motion} />)}</Suspense></LabelBoundary>;
}
