import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import app from '../src/app.js';
import { User } from '../src/models/User.js';

// This file exercises the real login flow (not the authCookieFor shortcut
// other test files use), so it needs JWT_SECRET set for jwt.sign() to work.
process.env.JWT_SECRET = 'test-jwt-secret';

before(connectTestDb);
after(closeTestDb);
beforeEach(clearTestDb);

const EMAIL = 'admin@example.com';
const PASSWORD = 'correct-horse-battery-staple';

async function seedRealAdmin() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  await User.create({ email: EMAIL, passwordHash, role: 'admin' });
}

function findCookie(setCookieHeader, name) {
  const cookie = setCookieHeader.find((c) => c.startsWith(`${name}=`));
  assert.ok(cookie, `expected a ${name} cookie in the response`);
  return cookie;
}

// 7.2: production topology is same-site (api.<domain> alongside <domain>,
// or a proxied /api/*) — see BACKEND_FINAL_PLAN.md §0.3.3. The auth cookie
// must be SameSite=Lax in both environments, not the cross-site
// SameSite=None the code previously used in production.
describe('auth cookie attributes (7.2 — same-site topology)', () => {
  test('SameSite=Lax and HttpOnly regardless of environment', async () => {
    await seedRealAdmin();
    const res = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD });

    assert.equal(res.status, 200);
    const cookie = findCookie(res.headers['set-cookie'], 'token');
    assert.ok(cookie.includes('SameSite=Lax'), `expected SameSite=Lax, got: ${cookie}`);
    assert.ok(cookie.includes('HttpOnly'), `expected HttpOnly, got: ${cookie}`);
  });

  test('production still uses SameSite=Lax (not the old cross-site None) and adds Secure', async () => {
    await seedRealAdmin();
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const res = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD });
      const cookie = findCookie(res.headers['set-cookie'], 'token');
      assert.ok(cookie.includes('Secure'), `expected Secure, got: ${cookie}`);
      assert.ok(cookie.includes('SameSite=Lax'), `expected SameSite=Lax even in production, got: ${cookie}`);
      assert.equal(cookie.includes('SameSite=None'), false, `must not use cross-site SameSite=None, got: ${cookie}`);
    } finally {
      process.env.NODE_ENV = original;
    }
  });

  test('Secure is not set in development, so the cookie still works over local http', async () => {
    await seedRealAdmin();
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      const res = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD });
      const cookie = findCookie(res.headers['set-cookie'], 'token');
      assert.equal(cookie.includes('Secure'), false, `did not expect Secure, got: ${cookie}`);
    } finally {
      process.env.NODE_ENV = original;
    }
  });
});
