import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import { adminHeaders, authCookieFor, createAdminUser, createNonAdminUser } from './helpers/auth.js';
import app from '../src/app.js';

before(connectTestDb);
after(closeTestDb);
beforeEach(clearTestDb);

describe('GET /profile is public and never 404s', () => {
  test('on an empty database, returns a fully-shaped object, not null or 404', async () => {
    const res = await request(app).get('/api/v1/profile');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.notEqual(res.body.data, null);
    assert.equal(res.body.data.socials.github, '');
    assert.deepEqual(res.body.data.roles, []);
    assert.equal(res.body.data.avatar, null);
    assert.equal(res.body.data.availability.available, false);
  });

  test('never leaks internal singleton/_id/__v fields', async () => {
    const res = await request(app).get('/api/v1/profile');

    assert.equal('singleton' in res.body.data, false);
    assert.equal('_id' in res.body.data, false);
    assert.equal('__v' in res.body.data, false);
  });
});

describe('PATCH /profile requires an authenticated admin', () => {
  test('401 without a cookie', async () => {
    const res = await request(app).patch('/api/v1/profile').send({ name: 'X' });
    assert.equal(res.status, 401);
  });

  test('403 for a non-admin user', async () => {
    const nonAdmin = await createNonAdminUser();
    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Cookie', authCookieFor(nonAdmin._id))
      .send({ name: 'X' });
    assert.equal(res.status, 403);
  });
});

describe('PATCH /profile upserts the singleton', () => {
  test('two PATCH calls result in exactly one document', async () => {
    const admin = await createAdminUser();
    const headers = adminHeaders(admin._id);

    await request(app).patch('/api/v1/profile').set(headers).send({ name: 'First' });
    await request(app).patch('/api/v1/profile').set(headers).send({ name: 'Second' });

    const count = await mongoose.connection.collection('profiles').countDocuments();
    assert.equal(count, 1);
  });
});

describe('PATCH /profile nested-object semantics (regression for B7)', () => {
  test('patching one socials key preserves the sibling keys', async () => {
    const admin = await createAdminUser();
    const headers = adminHeaders(admin._id);

    await request(app)
      .patch('/api/v1/profile')
      .set(headers)
      .send({
        socials: {
          github: 'https://github.com/old',
          linkedin: 'https://linkedin.com/in/old',
          website: 'https://old.dev',
        },
      });

    const res = await request(app)
      .patch('/api/v1/profile')
      .set(headers)
      .send({ socials: { github: 'https://github.com/new' } });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.socials.github, 'https://github.com/new');
    assert.equal(res.body.data.socials.linkedin, 'https://linkedin.com/in/old');
    assert.equal(res.body.data.socials.website, 'https://old.dev');
  });

  test('patching roles replaces the whole array rather than merging', async () => {
    const admin = await createAdminUser();
    const headers = adminHeaders(admin._id);

    await request(app)
      .patch('/api/v1/profile')
      .set(headers)
      .send({ roles: ['Builder', 'Creator'] });

    const res = await request(app)
      .patch('/api/v1/profile')
      .set(headers)
      .send({ roles: ['Engineer'] });

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.roles, ['Engineer']);
  });
});

describe('PATCH /profile rejects resume — that field is admin-write-only via /profile/resume', () => {
  test('sending resume in the PATCH body is rejected with 400', async () => {
    const admin = await createAdminUser();
    const res = await request(app)
      .patch('/api/v1/profile')
      .set(adminHeaders(admin._id))
      .send({ resume: { url: 'https://example.com/fake.pdf', publicId: 'fake' } });

    assert.equal(res.status, 400);
  });
});
