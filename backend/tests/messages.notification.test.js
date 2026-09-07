import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import app from '../src/app.js';

before(connectTestDb);
after(closeTestDb);
beforeEach(clearTestDb);

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };

describe('POST /messages triggers an owner notification for real messages, not honeypot hits', () => {
  let fetchCalls;

  beforeEach(() => {
    fetchCalls = [];
    process.env.RESEND_API_KEY = 'test-key';
    process.env.CONTACT_NOTIFY_EMAIL = 'owner@example.com';
    globalThis.fetch = async (url, options) => {
      fetchCalls.push({ url, options });
      return { ok: true, status: 200 };
    };
  });

  after(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  test('a legitimate message triggers exactly one notification', async () => {
    const res = await request(app).post('/api/v1/messages').send({
      name: 'Jane',
      email: 'jane@example.com',
      subject: 'Hello',
      body: 'This is a real message body long enough to pass validation.',
    });

    assert.equal(res.status, 201);
    assert.equal(fetchCalls.length, 1);
  });

  // messageService.create returns null for a honeypot hit — the controller
  // must branch on that and skip notifying, while still reporting success
  // to the (bot) caller so it doesn't learn the honeypot was tripped.
  test('a honeypot-triggered submission sends no notification but still reports success', async () => {
    const res = await request(app).post('/api/v1/messages').send({
      name: 'Bot',
      email: 'bot@example.com',
      subject: 'Spam',
      body: 'This is a spam message body long enough to pass validation.',
      website: 'https://spam.example.com',
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(fetchCalls.length, 0);
  });
});
