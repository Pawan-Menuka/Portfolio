import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import app from '../src/app.js';
import { Post } from '../src/models/Post.js';

const DRAFT_SLUG = 'half-finished-thoughts';
const PUBLISHED_SLUG = 'shipping-the-portfolio';

const draftPost = {
  title: 'Half Finished Thoughts',
  slug: DRAFT_SLUG,
  excerpt: 'Still being written.',
  content: 'Draft body that should never reach the public.',
  status: 'draft',
};

const publishedPost = {
  title: 'Shipping The Portfolio',
  slug: PUBLISHED_SLUG,
  excerpt: 'Ready to read.',
  content: 'Published body.',
  status: 'published',
};

describe('public post endpoints never expose drafts', () => {
  before(connectTestDb);
  after(closeTestDb);

  beforeEach(async () => {
    await clearTestDb();
    await Post.create([draftPost, publishedPost]);
  });

  test('GET /posts?status=draft does not return draft posts', async () => {
    const res = await request(app).get('/api/v1/posts?status=draft');

    assert.equal(res.status, 200);
    const slugs = res.body.data.map((p) => p.slug);
    assert.ok(
      !slugs.includes(DRAFT_SLUG),
      `draft post leaked through a public endpoint; got slugs: ${JSON.stringify(slugs)}`
    );
  });

  test('GET /posts returns only published posts', async () => {
    const res = await request(app).get('/api/v1/posts');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.map((p) => p.slug), [PUBLISHED_SLUG]);
  });

  test('GET /posts/:slug returns 404 for a draft post', async () => {
    const res = await request(app).get(`/api/v1/posts/${DRAFT_SLUG}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});
