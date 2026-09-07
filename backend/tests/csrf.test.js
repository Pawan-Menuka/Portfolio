import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import { authCookieFor, createAdminUser } from './helpers/auth.js';
import app from '../src/app.js';

before(connectTestDb);
after(closeTestDb);
beforeEach(clearTestDb);

// 7.3: SameSite=Lax blocks a cross-site fetch/XHR from carrying the cookie,
// but a plain cross-site <form method="post"> top-level navigation is a
// residual CSRF vector some browsers still attach Lax cookies to. A form
// cannot set custom headers — only script can — so requiring one closes
// that gap: X-Requested-With is deliberately not a CORS-safelisted header,
// so a cross-origin script trying to set it triggers a preflight our CORS
// allowlist (7.1) rejects for any origin not on it.
describe('admin write requests require the CSRF header (7.3)', () => {
  test('PATCH /profile with a valid admin cookie but no CSRF header is rejected with 403', async () => {
    const admin = await createAdminUser();
    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Cookie', authCookieFor(admin._id))
      .send({ name: 'X' });

    assert.equal(res.status, 403);
  });

  test('PATCH /profile with the wrong X-Requested-With value is rejected with 403', async () => {
    const admin = await createAdminUser();
    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Cookie', authCookieFor(admin._id))
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ name: 'X' });

    assert.equal(res.status, 403);
  });

  test('PATCH /profile with a valid admin cookie and the correct CSRF header succeeds', async () => {
    const admin = await createAdminUser();
    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Cookie', authCookieFor(admin._id))
      .set('X-Requested-With', 'portfolio-admin')
      .send({ name: 'X' });

    assert.equal(res.status, 200);
  });

  test('GET /profile (a safe method) needs no CSRF header even when authenticated as admin', async () => {
    const admin = await createAdminUser();
    const res = await request(app).get('/api/v1/profile').set('Cookie', authCookieFor(admin._id));

    assert.equal(res.status, 200);
  });

  test('GET /admin/projects (a safe method, admin-guarded) needs no CSRF header', async () => {
    const admin = await createAdminUser();
    const res = await request(app).get('/api/v1/admin/projects').set('Cookie', authCookieFor(admin._id));

    assert.equal(res.status, 200);
  });
});
