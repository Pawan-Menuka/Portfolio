import { afterEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { notifyOwnerOfMessage } from '../src/services/notification.service.js';

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };

const SAMPLE_MESSAGE = { name: 'Jane', email: 'jane@example.com', subject: 'Hello', body: 'Body text' };

// 7.4: notification must never turn a successfully stored message into a
// visitor-facing error, so every failure mode here (unconfigured, network
// error, non-ok response, provider hang) must resolve without throwing.
describe('notifyOwnerOfMessage', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  test('skips sending when RESEND_API_KEY is not configured', async () => {
    delete process.env.RESEND_API_KEY;
    process.env.CONTACT_NOTIFY_EMAIL = 'owner@example.com';
    let called = false;
    globalThis.fetch = async () => { called = true; return { ok: true }; };

    await notifyOwnerOfMessage(SAMPLE_MESSAGE);

    assert.equal(called, false);
  });

  test('skips sending when CONTACT_NOTIFY_EMAIL is not configured', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    delete process.env.CONTACT_NOTIFY_EMAIL;
    let called = false;
    globalThis.fetch = async () => { called = true; return { ok: true }; };

    await notifyOwnerOfMessage(SAMPLE_MESSAGE);

    assert.equal(called, false);
  });

  test('sends the message details to Resend when configured', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.CONTACT_NOTIFY_EMAIL = 'owner@example.com';
    let capturedUrl;
    let capturedOptions;
    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return { ok: true, status: 200 };
    };

    await notifyOwnerOfMessage(SAMPLE_MESSAGE);

    assert.equal(capturedUrl, 'https://api.resend.com/emails');
    assert.equal(capturedOptions.headers.Authorization, 'Bearer test-key');
    const payload = JSON.parse(capturedOptions.body);
    assert.equal(payload.to, 'owner@example.com');
    assert.match(payload.text, /Jane/);
    assert.match(payload.text, /Body text/);
  });

  test('does not throw when fetch rejects (network error)', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.CONTACT_NOTIFY_EMAIL = 'owner@example.com';
    globalThis.fetch = async () => { throw new Error('network down'); };

    await assert.doesNotReject(() => notifyOwnerOfMessage(SAMPLE_MESSAGE));
  });

  test('does not throw when the response is not ok', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.CONTACT_NOTIFY_EMAIL = 'owner@example.com';
    globalThis.fetch = async () => ({ ok: false, status: 500, text: async () => 'server error' });

    await assert.doesNotReject(() => notifyOwnerOfMessage(SAMPLE_MESSAGE));
  });

  test('resolves promptly (does not hang) when the provider never responds', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.CONTACT_NOTIFY_EMAIL = 'owner@example.com';
    globalThis.fetch = () => new Promise(() => {}); // never settles

    const start = Date.now();
    await assert.doesNotReject(() => notifyOwnerOfMessage(SAMPLE_MESSAGE, { timeoutMs: 50 }));
    assert.ok(Date.now() - start < 1000, 'should resolve shortly after the timeout, not hang indefinitely');
  });
});
