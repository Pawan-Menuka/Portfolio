import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { freshApp } from './helpers/freshApp.js';

// 7.1: FRONTEND_URL (single exact origin) is replaced by FRONTEND_ORIGINS
// (comma-separated allowlist) plus an optional, explicitly-opted-in
// PREVIEW_ORIGIN_REGEX for platforms with rotating preview URLs. A rejected
// origin is blocked server-side (cors() calls next(err), verified against
// the real cors package before writing these assertions) — not merely
// missing response headers left for the browser to enforce.
describe('CORS allowlist', () => {
  test('allows an origin present in FRONTEND_ORIGINS', async () => {
    const app = await freshApp({ FRONTEND_ORIGINS: 'http://localhost:5173,https://pawan.dev' });
    const res = await request(app).get('/health').set('Origin', 'https://pawan.dev');
    assert.equal(res.status, 200);
    assert.equal(res.headers['access-control-allow-origin'], 'https://pawan.dev');
  });

  test('rejects an origin not present in FRONTEND_ORIGINS', async () => {
    const app = await freshApp({ FRONTEND_ORIGINS: 'http://localhost:5173' });
    const res = await request(app).get('/health').set('Origin', 'https://evil.example.com');
    assert.equal(res.status, 500);
    assert.equal(res.headers['access-control-allow-origin'], undefined);
  });

  test('allows a request with no Origin header at all (curl, uptime monitors, server-to-server)', async () => {
    const app = await freshApp({ FRONTEND_ORIGINS: 'http://localhost:5173' });
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
  });

  test('PREVIEW_ORIGIN_REGEX is off by default — a plausible preview origin is still rejected', async () => {
    const app = await freshApp({ FRONTEND_ORIGINS: 'http://localhost:5173' });
    const res = await request(app).get('/health').set('Origin', 'https://portfolio-abc123-myteam.vercel.app');
    assert.equal(res.status, 500);
  });

  test('PREVIEW_ORIGIN_REGEX, when explicitly set, allows a matching origin', async () => {
    const app = await freshApp({
      FRONTEND_ORIGINS: 'http://localhost:5173',
      PREVIEW_ORIGIN_REGEX: '^https:\\/\\/portfolio-[a-z0-9]+-myteam\\.vercel\\.app$',
    });
    const res = await request(app).get('/health').set('Origin', 'https://portfolio-abc123-myteam.vercel.app');
    assert.equal(res.status, 200);
    assert.equal(res.headers['access-control-allow-origin'], 'https://portfolio-abc123-myteam.vercel.app');
  });

  test('an anchored PREVIEW_ORIGIN_REGEX does not match a lookalike origin smuggling the pattern as a suffix', async () => {
    const app = await freshApp({
      FRONTEND_ORIGINS: 'http://localhost:5173',
      PREVIEW_ORIGIN_REGEX: '^https:\\/\\/portfolio-[a-z0-9]+-myteam\\.vercel\\.app$',
    });
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://portfolio-abc123-myteam.vercel.app.attacker.com');
    assert.equal(res.status, 500);
  });

  test('allowedHeaders includes X-Requested-With, needed for the CSRF mechanism (7.3)', async () => {
    const app = await freshApp({ FRONTEND_ORIGINS: 'http://localhost:5173' });
    const res = await request(app)
      .options('/api/v1/profile')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'PATCH')
      .set('Access-Control-Request-Headers', 'X-Requested-With');
    assert.equal(res.status, 204);
    assert.match(res.headers['access-control-allow-headers'], /X-Requested-With/i);
  });
});
