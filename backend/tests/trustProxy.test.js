import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { freshApp } from './helpers/freshApp.js';

// B4: without this, express-rate-limit behind a platform reverse proxy
// (Render/Railway/etc.) either mis-keys every visitor to the proxy's own
// address or throws its X-Forwarded-For validation error.
describe('trust proxy', () => {
  test('is enabled in production, so rate limiting keys on the real client IP behind a proxy', async () => {
    const app = await freshApp({ NODE_ENV: 'production' });
    assert.equal(app.get('trust proxy'), 1);
  });

  test('is left off in development, so local requests key on the real socket address', async () => {
    const app = await freshApp({ NODE_ENV: 'development' });
    assert.equal(app.get('trust proxy'), false);
  });
});
