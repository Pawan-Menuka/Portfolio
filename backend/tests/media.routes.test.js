import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import { adminHeaders, authCookieFor, createAdminUser, createNonAdminUser } from './helpers/auth.js';
import app from '../src/app.js';
import cloudinary from '../src/config/cloudinary.js';

before(connectTestDb);
after(closeTestDb);
beforeEach(clearTestDb);

// item 10: a path param (:publicId) is fragile for Cloudinary IDs, which
// contain slashes. The query-string form sidesteps that entirely — Express's
// query parser already decodes it, no manual decodeURIComponent needed.
describe('DELETE /media (query-param form)', () => {
  let destroyCalls;
  const originalDestroy = cloudinary.uploader.destroy;

  beforeEach(() => {
    destroyCalls = [];
    cloudinary.uploader.destroy = async (publicId, options) => {
      destroyCalls.push({ publicId, resourceType: options.resource_type });
      return { result: 'ok' };
    };
  });

  after(() => {
    cloudinary.uploader.destroy = originalDestroy;
  });

  test('401 without a cookie', async () => {
    const res = await request(app).delete('/api/v1/media?publicId=portfolio/general/x');
    assert.equal(res.status, 401);
  });

  test('403 for a non-admin user', async () => {
    const nonAdmin = await createNonAdminUser();
    const res = await request(app)
      .delete('/api/v1/media?publicId=portfolio/general/x')
      .set('Cookie', authCookieFor(nonAdmin._id));
    assert.equal(res.status, 403);
  });

  test('400 when publicId is missing', async () => {
    const admin = await createAdminUser();
    const res = await request(app)
      .delete('/api/v1/media')
      .set(adminHeaders(admin._id));
    assert.equal(res.status, 400);
  });

  test('200 for an admin user, deleting the exact publicId given — including one with slashes', async () => {
    const admin = await createAdminUser();
    const publicId = 'portfolio/models/nested/asset-with-slashes';

    const res = await request(app)
      .delete(`/api/v1/media?publicId=${encodeURIComponent(publicId)}`)
      .set(adminHeaders(admin._id));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(destroyCalls[0].publicId, publicId);
  });
});
