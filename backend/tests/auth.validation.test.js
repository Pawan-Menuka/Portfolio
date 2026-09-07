import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import app from '../src/app.js';

before(connectTestDb);
after(closeTestDb);
beforeEach(clearTestDb);

// V2: Zod v3's { required_error } was replaced by { error } in v4 and is
// silently ignored, not an error at schema-build time — so this validator's
// intended "Email is required" / "Password is required" messages never
// surfaced; every missing-field case fell back to Zod's generic
// "Invalid input: expected string, received undefined".
describe('POST /auth/login surfaces its intended validation messages', () => {
  test('missing email reports "Email is required", not a generic type error', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ password: 'whatever' });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /Email is required/);
  });

  test('missing password reports "Password is required", not a generic type error', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'user@example.com' });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /Password is required/);
  });
});
