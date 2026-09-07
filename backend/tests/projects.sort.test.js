import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import app from '../src/app.js';
import { Project } from '../src/models/Project.js';

before(connectTestDb);
after(closeTestDb);
beforeEach(clearTestDb);

// Public project sort must be featured-first, then order ascending, then
// publishedAt descending as a tiebreaker — not just order/publishedAt, which
// interleaves featured and non-featured projects.
describe('GET /projects sorts featured first, then order, then publishedAt', () => {
  test('featured projects all sort before non-featured, each tier ordered by `order` then newest first', async () => {
    const day = (n) => new Date(`2024-01-0${n}T00:00:00.000Z`);

    await Project.create([
      { title: 'A', slug: 'a', section: 'full-stack', summary: 'S', status: 'published', featured: false, order: 2, publishedAt: day(1) },
      { title: 'B', slug: 'b', section: 'full-stack', summary: 'S', status: 'published', featured: true, order: 5, publishedAt: day(2) },
      { title: 'C', slug: 'c', section: 'full-stack', summary: 'S', status: 'published', featured: true, order: 1, publishedAt: day(3) },
      { title: 'D', slug: 'd', section: 'full-stack', summary: 'S', status: 'published', featured: false, order: 1, publishedAt: day(4) },
    ]);

    const res = await request(app).get('/api/v1/projects');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.map((p) => p.slug), ['c', 'b', 'd', 'a']);
  });
});
