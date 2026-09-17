import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { cameraDistance, disposeModel } from '../src/features/iceberg/model-utils.js';
import IcebergHero from '../src/features/iceberg/IcebergHero.jsx';

const spies = vi.hoisted(() => ({ imported: vi.fn(), mounted: vi.fn(), unmounted: vi.fn() }));
vi.mock('../src/features/iceberg/IcebergScene.jsx', async () => {
  spies.imported();
  const { useEffect } = await import('react');
  return { default: function MockScene({ onReady, onFailure }) {
    useEffect(() => { spies.mounted(); return () => spies.unmounted(); }, []);
    return <div><button onClick={() => onReady({ meshes: ['ice_above', 'ice_below'] })}>Finish loading</button><button onClick={onFailure}>Simulate context loss</button></div>;
  } };
});
let matches;
const listeners = new Set();
beforeEach(() => {
  matches = false; listeners.clear();
  window.localStorage.clear();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('WebGL2RenderingContext', class {});
  vi.stubGlobal('matchMedia', () => ({ get matches() { return matches; }, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) }));
});
function policy(value) { act(() => { matches = value; listeners.forEach(fn => fn()); }); }
const preview = () => screen.getByRole('img');

it('does not import the desktop renderer in initial mobile/reduced-motion mode', () => {
  render(<IcebergHero />);
  expect(preview().dataset.sceneState).toBe('static');
  expect(spies.imported).not.toHaveBeenCalled();
});
it('leaves the poster visible until ready and restores it after context loss', async () => {
  matches = true; const view = render(<IcebergHero />);
  expect(preview().dataset.sceneState).toBe('loading');
  fireEvent.click(await screen.findByText('Finish loading'));
  expect(preview().dataset.sceneState).toBe('ready');
  expect(view.container.querySelector('.iceberg-poster-hidden')).not.toBeNull();
  fireEvent.click(screen.getByText('Simulate context loss'));
  expect(preview().dataset.sceneState).toBe('static');
  expect(view.container.querySelector('.iceberg-poster-hidden')).toBeNull();
});
it('unmounts desktop resources when preferences change and reloads with the poster visible', async () => {
  matches = true; render(<IcebergHero />);
  fireEvent.click(await screen.findByText('Finish loading'));
  policy(false); expect(preview().dataset.sceneState).toBe('static');
  expect(spies.unmounted).toHaveBeenCalled();
  policy(true); expect(preview().dataset.sceneState).toBe('loading');
});
it('falls back if loading times out but never times out after readiness', async () => {
  matches = true; render(<IcebergHero />);
  await screen.findByText('Finish loading');
  vi.useFakeTimers();
  try {
    fireEvent.click(screen.getByText('Finish loading'));
    await act(async () => vi.advanceTimersByTimeAsync(26000));
    expect(preview().dataset.sceneState).toBe('ready');
    policy(false); policy(true);
    await act(async () => vi.advanceTimersByTimeAsync(26000));
    expect(preview().dataset.sceneState).toBe('static');
  } finally { vi.useRealTimers(); }
});
it('uses the static poster if WebGL2 is not available', () => {
  matches = true; vi.stubGlobal('WebGL2RenderingContext', undefined);
  render(<IcebergHero />); expect(preview().dataset.sceneState).toBe('static');
});
it('keeps enlarged text in document flow and restores the scene after resizing', async () => {
  matches = true;
  document.documentElement.style.fontSize = '32px';
  try {
    render(<IcebergHero />);
    expect(preview().dataset.sceneState).toBe('static');
    document.documentElement.style.fontSize = '16px';
    fireEvent(window, new Event('resize'));
    expect(await screen.findByText('Finish loading')).toBeTruthy();
  } finally { document.documentElement.style.removeProperty('font-size'); }
});
it('fits the full model at wide and narrow canvas aspect ratios', () => {
  const size = new Vector3(56.93, 100, 47.359);
  for (const aspect of [0.4, 0.8, 1.7]) {
    const distance = cameraDistance(size, aspect);
    const availableHeight = 2 * (distance - size.z / 2) * Math.tan(42 * Math.PI / 360);
    expect(availableHeight).toBeGreaterThan(size.y);
    expect(availableHeight * aspect).toBeGreaterThan(size.x);
  }
});
it('disposes shared model resources once', () => {
  const scene = new Group(), geometry = new BoxGeometry(), material = new MeshBasicMaterial();
  const geometryDispose = vi.spyOn(geometry, 'dispose'), materialDispose = vi.spyOn(material, 'dispose');
  scene.add(new Mesh(geometry, material), new Mesh(geometry, material));
  disposeModel(scene);
  expect(geometryDispose).toHaveBeenCalledTimes(1); expect(materialDispose).toHaveBeenCalledTimes(1);
});
