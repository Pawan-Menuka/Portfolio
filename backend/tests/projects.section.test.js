import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import app from '../src/app.js';
import { Project } from '../src/models/Project.js';

before(connectTestDb);
after(closeTestDb);
beforeEach(clearTestDb);

describe('GET /projects filters by section', () => {
  test('returns only published projects in the requested section', async () => {
    await Project.create([
      { title: 'Systems A', slug: 'systems-a', section: 'systems', summary: 'S', status: 'published' },
      { title: 'Creative B', slug: 'creative-b', section: 'creative', summary: 'S', status: 'published' },
      { title: 'Systems Draft', slug: 'systems-draft', section: 'systems', summary: 'S', status: 'draft' },
    ]);

    const res = await request(app).get('/api/v1/projects?section=systems');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.map((p) => p.slug), ['systems-a']);
  });
});
