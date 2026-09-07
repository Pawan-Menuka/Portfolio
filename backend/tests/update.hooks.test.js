import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import { adminHeaders, createAdminUser } from './helpers/auth.js';
import app from '../src/app.js';
import { Project } from '../src/models/Project.js';
import { Post } from '../src/models/Post.js';

before(connectTestDb);
after(closeTestDb);
beforeEach(clearTestDb);

// B2: publishedAt/readingTime live in pre('save') document hooks, which
// findByIdAndUpdate never fires (it's query middleware only). Publishing a
// draft via PATCH used to leave publishedAt undefined.
describe('document hooks fire on PATCH, not just on create', () => {
  test('PATCH /projects/:id sets publishedAt when publishing a draft', async () => {
    const admin = await createAdminUser();
    const project = await Project.create({
      title: 'Draft To Publish',
      slug: 'draft-to-publish',
      section: 'full-stack',
      summary: 'S',
      status: 'draft',
    });
    assert.equal(project.publishedAt, undefined);

    const res = await request(app)
      .patch(`/api/v1/projects/${project._id}`)
      .set(adminHeaders(admin._id))
      .send({ status: 'published' });

    assert.equal(res.status, 200);
    assert.ok(res.body.data.publishedAt, 'publishedAt should be set after publishing via PATCH');
  });

  test('PATCH /posts/:id sets publishedAt when publishing a draft', async () => {
    const admin = await createAdminUser();
    const post = await Post.create({
      title: 'Draft Post To Publish',
      slug: 'draft-post-to-publish',
      excerpt: 'E',
      content: 'C',
      status: 'draft',
    });
    assert.equal(post.publishedAt, undefined);

    const res = await request(app)
      .patch(`/api/v1/posts/${post._id}`)
      .set(adminHeaders(admin._id))
      .send({ status: 'published' });

    assert.equal(res.status, 200);
    assert.ok(res.body.data.publishedAt, 'publishedAt should be set after publishing via PATCH');
  });

  test('PATCH /posts/:id recomputes readingTime when content changes', async () => {
    const admin = await createAdminUser();
    const post = await Post.create({
      title: 'Reading Time Test',
      slug: 'reading-time-test',
      excerpt: 'E',
      content: Array(50).fill('word').join(' '), // 50 words -> ceil(50/200) = 1
      status: 'draft',
    });
    assert.equal(post.readingTime, 1);

    const res = await request(app)
      .patch(`/api/v1/posts/${post._id}`)
      .set(adminHeaders(admin._id))
      .send({ content: Array(1000).fill('word').join(' ') }); // 1000 words -> ceil(1000/200) = 5

    assert.equal(res.status, 200);
    assert.equal(res.body.data.readingTime, 5);
  });
});
