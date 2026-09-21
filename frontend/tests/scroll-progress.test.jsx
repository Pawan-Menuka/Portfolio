import { expect, it, vi } from 'vitest';
import { scrollProgress, observeJourney } from '../src/features/iceberg/scroll-progress.mjs';

it('maps the sticky interval, clamps overscroll, and handles collapsed fallback', () => {
  expect(scrollProgress(100, 100, 6000, 1000)).toBe(0);
  expect(scrollProgress(2600, 100, 6000, 1000)).toBe(0.5);
  expect(scrollProgress(5100, 100, 6000, 1000)).toBe(1);
  expect(scrollProgress(-10, 100, 6000, 1000)).toBe(0);
  expect(scrollProgress(9999, 100, 6000, 1000)).toBe(1);
  expect(scrollProgress(100, 0, 700, 1000)).toBe(0);
});

it('measures restored scroll immediately, tracks changing bounds, and removes listeners', () => {
  const events = new Map(); let resize; let top = 100; let height = 6000;
  const disconnect = vi.fn(); const observe = vi.fn();
  const environment = { scrollY: 2600, innerHeight: 1000,
    addEventListener: (name, callback) => events.set(name, callback),
    removeEventListener: (name, callback) => { expect(events.get(name)).toBe(callback); events.delete(name); },
    ResizeObserver: class { constructor(callback) { resize = callback; } observe = observe; disconnect = disconnect; },
  };
  const element = { getBoundingClientRect: () => ({ top: top - environment.scrollY, height }), ownerDocument: { body: {} } };
  const change = vi.fn();
  const cleanup = observeJourney(element, change, environment);
  expect(change).toHaveBeenLastCalledWith(0.5);
  environment.scrollY = 5100; events.get('scroll')(); expect(change).toHaveBeenLastCalledWith(1);
  environment.scrollY = 100; events.get('scroll')(); expect(change).toHaveBeenLastCalledWith(0);
  top = 200; height = 11000; environment.scrollY = 5200; resize(); expect(change).toHaveBeenLastCalledWith(0.5);
  cleanup(); expect(events.size).toBe(0); expect(disconnect).toHaveBeenCalledOnce();
});
