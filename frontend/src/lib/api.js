const API_URL = import.meta.env.VITE_API_URL;

// /health and /ready live on the bare backend origin, not under /api/v1 —
// derive it from VITE_API_URL rather than string-concatenating a wrong path.
const API_ORIGIN = new URL(API_URL).origin;

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    // Auth is an httpOnly cookie, not a bearer token — every request must
    // include it so the browser attaches (and later, the browser can
    // receive) the cookie.
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.error || `Request failed: ${res.status}`);
  }

  return body;
}

export function getProfile() {
  return request('/profile');
}

// Outside /api/v1 on purpose (see API_ORIGIN above).
export async function checkReady() {
  const res = await fetch(`${API_ORIGIN}/ready`);
  const body = await res.json().catch(() => null);
  return { ok: res.ok, ...body };
}
