import { useEffect, useRef } from 'react';

/**
 * Cursor-following light pool. Skipped on touch-only devices and when the
 * visitor prefers reduced motion.
 */
export default function DiveLamp() {
  const ref = useRef(null);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || still) return undefined;

    let frame = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      el.style.setProperty('--pm-mx', x + 'px');
      el.style.setProperty('--pm-my', y + 'px');
    };
    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="pm-lamp" ref={ref} aria-hidden="true" />;
}
