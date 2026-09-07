import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import app from '../src/app.js';
import { Project } from '../src/models/Project.js';

const DRAFT_SLUG = 'unreleased-internal-tool';
const PUBLISHED_SLUG = 'public-case-study';

const draftProject = {
  title: 'Unreleased Internal Tool',
  slug: DRAFT_SLUG,
  section: 'full-stack',
  summary: 'Not for public eyes.',
  status: 'draft',
};

const publishedProject = {
  title: 'Public Case Study',
  slug: PUBLISHED_SLUG,
  section: 'full-stack',
  summary: 'Visible to everyone.',
  status: 'published',
};

describe('public project endpoints never expose drafts', () => {
  before(connectTestDb);
  after(closeTestDb);

  beforeEach(async () => {
    await clearTestDb();
    await Project.create([draftProject, publishedProject]);
  });

  test('GET /projects?status=draft does not return draft projects', async () => {
    const res = await request(app).get('/api/v1/projects?status=draft');

    assert.equal(res.status, 200);
    const slugs = res.body.data.map((p) => p.slug);
    assert.ok(
      !slugs.includes(DRAFT_SLUG),
      `draft project leaked through a public endpoint; got slugs: ${JSON.stringify(slugs)}`
    );
  });

  test('GET /projects returns only published projects', async () => {
    const res = await request(app).get('/api/v1/projects');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.map((p) => p.slug), [PUBLISHED_SLUG]);
  });

  test('GET /projects/:slug returns 404 for a draft project', async () => {
    const res = await request(app).get(`/api/v1/projects/${DRAFT_SLUG}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});
