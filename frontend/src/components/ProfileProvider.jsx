import { useEffect, useState } from 'react';
import { getProfile } from '../lib/api.js';
import { ProfileContext } from '../lib/profile-context.js';

export default function ProfileProvider({ children }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ profile: null, status: 'loading', error: null });
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 12000);
    getProfile({ signal: controller.signal }).then(({ data }) => {
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Profile data is unavailable.');
      if (['name', 'headline', 'shortBio', 'location'].some(key => data[key] != null && typeof data[key] !== 'string')) throw new Error('Profile data returned an unexpected format.');
      if (active) setState({ profile: data, status: 'ready', error: null });
    }).catch((error) => {
      if (active) setState({ profile: null, status: 'error', error: timedOut ? 'Portfolio data took too long to load. Please try again.' : error.message });
    }).finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [attempt]);
  function retry() {
    setState({ profile: null, status: 'loading', error: null });
    setAttempt(n => n + 1);
  }
  return <ProfileContext.Provider value={{ ...state, retry }}>{children}</ProfileContext.Provider>;
}
