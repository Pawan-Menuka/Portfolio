import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import { authCookieFor, createAdminUser, createNonAdminUser } from './helpers/auth.js';
import app from '../src/app.js';
import { Project } from '../src/models/Project.js';
import { Post } from '../src/models/Post.js';

// Shared across every describe below — one DB connection for the whole file.
before(connectTestDb);
after(closeTestDb);
beforeEach(clearTestDb);

async function makeDraftProjectId() {
  const project = await Project.create({
    title: 'Guard Test Project',
    slug: `guard-test-project-${Date.now()}`,
    section: 'full-stack',
    summary: 'Used only to exercise route guards.',
    status: 'draft',
  });
  return project._id.toString();
}

async function makeDraftPostId() {
  const post = await Post.create({
    title: 'Guard Test Post',
    slug: `guard-test-post-${Date.now()}`,
    excerpt: 'Used only to exercise route guards.',
    content: 'Body text.',
    status: 'draft',
  });
  return post._id.toString();
}

describe('admin routes require auth and admin role', () => {
  const routes = [
    { name: 'GET /admin/projects', path: async () => '/api/v1/admin/projects' },
    { name: 'GET /admin/projects/:id', path: async () => `/api/v1/admin/projects/${await makeDraftProjectId()}` },
    { name: 'GET /admin/posts', path: async () => '/api/v1/admin/posts' },
    { name: 'GET /admin/posts/:id', path: async () => `/api/v1/admin/posts/${await makeDraftPostId()}` },
  ];

  for (const route of routes) {
    test(`${route.name} — 401 without a cookie`, async () => {
      const res = await request(app).get(await route.path());
      assert.equal(res.status, 401);
    });

    test(`${route.name} — 403 for a non-admin user`, async () => {
      const nonAdmin = await createNonAdminUser();
      const res = await request(app)
        .get(await route.path())
        .set('Cookie', authCookieFor(nonAdmin._id));
      assert.equal(res.status, 403);
    });

    test(`${route.name} — 200 for an admin user`, async () => {
      const admin = await createAdminUser();
      const res = await request(app)
        .get(await route.path())
        .set('Cookie', authCookieFor(admin._id));
      assert.equal(res.status, 200);
    });
  }
});

describe('admin project listing sees drafts', () => {
  test('GET /admin/projects?status=draft returns draft projects', async () => {
    const admin = await createAdminUser();
    await Project.create({
      title: 'Draft Project',
      slug: 'draft-project',
      section: 'full-stack',
      summary: 'Not published yet.',
      status: 'draft',
    });

    const res = await request(app)
      .get('/api/v1/admin/projects?status=draft')
      .set('Cookie', authCookieFor(admin._id));

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.map((p) => p.slug), ['draft-project']);
  });
});

describe('admin post listing', () => {
  test('GET /admin/posts omits content from the list', async () => {
    const admin = await createAdminUser();
    await Post.create({
      title: 'Draft Post',
      slug: 'draft-post-list',
      excerpt: 'Excerpt only.',
      content: 'This full body must not appear in the list response.',
      status: 'draft',
    });

    const res = await request(app)
      .get('/api/v1/admin/posts?status=draft')
      .set('Cookie', authCookieFor(admin._id));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].content, undefined);
  });

  test('GET /admin/posts/:id returns full content', async () => {
    const admin = await createAdminUser();
    const post = await Post.create({
      title: 'Draft Post Detail',
      slug: 'draft-post-detail',
      excerpt: 'Excerpt only.',
      content: 'This full body must appear in the detail response.',
      status: 'draft',
    });

    const res = await request(app)
      .get(`/api/v1/admin/posts/${post._id}`)
      .set('Cookie', authCookieFor(admin._id));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.content, 'This full body must appear in the detail response.');
  });
});
