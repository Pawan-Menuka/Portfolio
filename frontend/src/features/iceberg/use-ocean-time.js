import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';

export function useOceanTime(framesPerSecond = 24) {
  const time = useMemo(() => ({ value: 0 }), []);
  const { gl, invalidate } = useThree();
  useEffect(() => {
    const targetFps = framesPerSecond == null ? 24 : framesPerSecond;
    let timer, inView = true, previous = performance.now();
    const update = () => {
      const now = performance.now();
      time.value += Math.min((now - previous) / 1000, .08);
      previous = now;
      invalidate();
    };
    const sync = () => {
      clearInterval(timer);
      previous = performance.now();
      if (!document.hidden && inView && targetFps > 0) { update(); timer = setInterval(update, 1000 / targetFps); }
    };
    const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); });
    observer.observe(gl.domElement);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => { clearInterval(timer); observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, [framesPerSecond, gl, invalidate, time]);
  return time;
}
