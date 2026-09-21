import { useEffect, useRef } from 'react';

/**
 * Fixed depth gauge. `mode="scroll"` tracks page scroll; `mode="bottom"`
 * pins the marker at 84 m (Contact). The page gutter that keeps content
 * clear of this rail is --pm-gutter-right in portfolio.css.
 */
export default function DepthRail({ mode = 'scroll' }) {
  const dot = useRef(null);

  useEffect(() => {
    if (mode !== 'scroll') return undefined;
    const onScroll = () => {
      const el = dot.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.top = `calc(${(p * 100).toFixed(2)}% - 4.5px)`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [mode]);

  return (
    <div className="pm-rail" aria-hidden="true">
      <div className="pm-rail__scale">
        <span>0</span>
        <span>42</span>
        <span>84 m</span>
      </div>
      <div className="pm-rail__track">
        <span className="pm-rail__tick" style={{ top: 0 }} />
        <span className="pm-rail__tick" style={{ top: '50%' }} />
        <span className="pm-rail__tick" style={{ bottom: 0 }} />
        <div
          ref={dot}
          className="pm-rail__dot"
          style={mode === 'bottom' ? { bottom: '-4.5px' } : { top: '-4.5px' }}
        />
      </div>
    </div>
  );
}
