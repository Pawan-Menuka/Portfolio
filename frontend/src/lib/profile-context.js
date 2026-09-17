import { createContext, useContext } from 'react';
export const DEFAULT_AVATAR_URL = '/images/pawan-menuka-avatar.webp';
export const DEFAULT_RESUME_URL = '/Pawan-Menuka-CV.pdf';
export const ProfileContext = createContext(null);
export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('useProfile requires ProfileProvider');
  return value;
}
export function safeWebUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}
