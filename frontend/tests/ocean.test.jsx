import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import { applyIceMaterials, createIceEnvironment } from '../src/features/iceberg/ice-materials.js';
import { useOceanTime } from '../src/features/iceberg/use-ocean-time.js';

const renderState = vi.hoisted(() => ({ gl: { domElement: {} }, invalidate: vi.fn() }));
vi.mock('@react-three/fiber', () => ({ useThree: () => renderState }));
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('replaces ice materials without modifying approved geometry or normals', () => {
  const scene = new Group();
  const geometry = new BoxGeometry();
  const positions = Array.from(geometry.attributes.position.array);
  const normals = Array.from(geometry.attributes.normal.array);
  const old = new MeshBasicMaterial(); const dispose = vi.spyOn(old, 'dispose');
  const mesh = new Mesh(geometry, old); mesh.name = 'ice_below'; scene.add(mesh);
  applyIceMaterials(scene, { value: 0 });
  expect(mesh.geometry).toBe(geometry);
  expect(Array.from(geometry.attributes.position.array)).toEqual(positions);
  expect(Array.from(geometry.attributes.normal.array)).toEqual(normals);
  expect(mesh.material.isMeshPhysicalMaterial).toBe(true);
  expect(dispose).toHaveBeenCalledOnce();
  mesh.material.dispose(); geometry.dispose();
});
it('generates a finite local HDR environment with no external texture request', () => {
  const texture = createIceEnvironment();
  expect(texture.image.data.every(Number.isFinite)).toBe(true);
  expect(Math.max(...texture.image.data)).toBeGreaterThan(1);
  texture.dispose();
});
it('pauses atmosphere ticks when hidden or offscreen and releases its timer and observer', () => {
  vi.useFakeTimers();
  let visible = true, intersection;
  const disconnect = vi.fn();
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => !visible);
  vi.stubGlobal('IntersectionObserver', class { constructor(callback) { intersection = callback; } observe() {} disconnect = disconnect; });
  const view = renderHook(useOceanTime);
  act(() => vi.advanceTimersByTime(1000));
  expect(view.result.current.value).toBeGreaterThan(.8);
  const beforeHidden = view.result.current.value;
  act(() => { visible = false; document.dispatchEvent(new Event('visibilitychange')); vi.advanceTimersByTime(5000); });
  expect(view.result.current.value).toBe(beforeHidden);
  act(() => { visible = true; document.dispatchEvent(new Event('visibilitychange')); vi.advanceTimersByTime(100); });
  expect(view.result.current.value - beforeHidden).toBeLessThan(.2);
  act(() => intersection([{ isIntersecting: false }]));
  expect(vi.getTimerCount()).toBe(0);
  view.unmount(); expect(disconnect).toHaveBeenCalledOnce();
});
