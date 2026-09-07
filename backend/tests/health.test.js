import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { closeTestDb, connectTestDb, getTestDbUri } from './helpers/db.js';
import app from '../src/app.js';

before(connectTestDb);
after(closeTestDb);

// A 200 while the DB is down is useless to a platform health check — it
// acts on the status code, not the body. /health is pure liveness (process
// is up); /ready is the one platforms should point at.
describe('/health is pure liveness — always 200 while the process is alive', () => {
  test('200 regardless of database state', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
  });
});

describe('/ready reflects the actual database connection state', () => {
  test('200 when Mongo is connected', async () => {
    const res = await request(app).get('/ready');
    assert.equal(res.status, 200);
  });

  test('503 when Mongo is disconnected', async () => {
    const uri = getTestDbUri();
    await mongoose.disconnect();
    try {
      const res = await request(app).get('/ready');
      assert.equal(res.status, 503);
    } finally {
      await mongoose.connect(uri);
    }
  });
});
