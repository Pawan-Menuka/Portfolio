import { useEffect, useState } from 'react';

// Each key owns its result; old requests cannot replace a newer filter/slug.
export function useResource(key, load) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 12000);
    Promise.resolve().then(() => load(key, controller.signal)).then(data => {
      if (active) setResult({ key, attempt, data, error: null });
    }).catch(error => {
      if (active) setResult({ key, attempt, data: null, error: timedOut ? new Error('This is taking longer than expected. Please try again.') : error });
    }).finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [key, load, attempt]);
  const current = result?.key === key && result.attempt === attempt ? result : null;
  return { data: current?.data, error: current?.error, loading: !current, retry: () => setAttempt(value => value + 1) };
}
