import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../src/lib/api-client.js';
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

test('invalid configuration rejects on request, not at app initialization', async () => {
  const client = createApiClient(undefined);
  await assert.rejects(client.request('/profile'), /not configured/);
});
test('normalizes URL, preserves headers and signal, enforces cookie credentials', async () => {
  const controller = new AbortController();
  const client = createApiClient('http://localhost:5000/api/v1///', async (url, options) => {
    assert.equal(url, 'http://localhost:5000/api/v1/profile');
    assert.equal(options.credentials, 'include');
    assert.equal(options.signal, controller.signal);
    assert.equal(options.headers.get('Accept'), 'application/json');
    assert.equal(options.headers.get('X-Requested-With'), 'portfolio-admin');
    assert.equal(options.headers.get('Content-Type'), null);
    return json({success: true, data: {name: 'Pawan'}});
  });
  await client.request('/profile', {signal: controller.signal, headers: {'X-Requested-With': 'portfolio-admin'}, credentials: 'omit'});
});
test('rejects HTML success and malformed success envelopes', async () => {
  for (const response of [new Response('<html>error</html>'), json({data: {}})]) {
    await assert.rejects(createApiClient('http://localhost/api', async () => response).request('/profile'), /unexpected response/);
  }
});
test('preserves API status and validation message', async () => {
  const client = createApiClient('http://localhost/api', async () => json({success: false, error: 'Invalid request'}, 400));
  await assert.rejects(client.request('/profile'), error => error.status === 400 && error.message === 'Invalid request');
});
test('handles non-JSON server failures and network failures', async () => {
  await assert.rejects(createApiClient('http://localhost/api', async () => new Response('bad gateway', {status:502})).request('/profile'), /502/);
  await assert.rejects(createApiClient('http://localhost/api', async () => {throw new TypeError('fetch failed');}).request('/profile'), /Unable to reach/);
});
test('cancellation propagates instead of becoming a network message', async () => {
  const controller = new AbortController(); controller.abort();
  const client = createApiClient('http://localhost/api', async () => {throw controller.signal.reason;});
  await assert.rejects(client.request('/profile', {signal:controller.signal}), error => error.name === 'AbortError');
});
test('readiness uses bare origin and accepts its non-envelope response', async () => {
  const client = createApiClient('http://localhost:5000/api/v1', async url => {
    assert.equal(url, 'http://localhost:5000/ready'); return json({status:'ready'});
  });
  assert.deepEqual(await client.ready(), {status:'ready'});
});
