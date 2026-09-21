import { clamp } from './camera-path.mjs';

export function scrollProgress(scrollY, top, height, viewportHeight) {
  const range = height - viewportHeight;
  return range > 0 ? clamp((scrollY - top) / range) : 0;
}

export function observeJourney(element, onChange, environment = window) {
  const measure = () => {
    const rect = element.getBoundingClientRect();
    onChange(scrollProgress(environment.scrollY, rect.top + environment.scrollY, rect.height, environment.innerHeight));
  };
  environment.addEventListener('scroll', measure, { passive: true });
  environment.addEventListener('resize', measure);
  environment.addEventListener('pageshow', measure);
  const observer = new environment.ResizeObserver(measure);
  observer.observe(element);
  observer.observe(element.ownerDocument.body);
  measure();
  return () => {
    environment.removeEventListener('scroll', measure);
    environment.removeEventListener('resize', measure);
    environment.removeEventListener('pageshow', measure);
    observer.disconnect();
  };
}
