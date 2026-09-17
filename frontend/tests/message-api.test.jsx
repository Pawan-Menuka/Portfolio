import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });
it('sends the contact payload through the actual API adapter with cookies and JSON', async () => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:5000/api/v1/');
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, message: 'Message received. Thank you!' }), { status: 201 }));
  vi.stubGlobal('fetch', fetcher);
  const { sendMessage } = await import('../src/lib/api.js');
  const body = { name: 'Test', email: 'test@example.com', body: 'Mocked test only', website: '' };
  const controller = new AbortController();
  await expect(sendMessage(body, { signal: controller.signal })).resolves.toMatchObject({ success: true });
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe('http://localhost:5000/api/v1/messages');
  expect(options.method).toBe('POST');
  expect(options.credentials).toBe('include');
  expect(options.headers.get('Content-Type')).toBe('application/json');
  expect(options.signal).toBe(controller.signal);
  expect(JSON.parse(options.body)).toEqual(body);
});
