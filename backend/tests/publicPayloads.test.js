import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import app from '../src/app.js';
import { Skill } from '../src/models/Skill.js';
import { Certification } from '../src/models/Certification.js';

describe('public resource payloads omit internal version metadata', () => {
  before(connectTestDb);
  after(closeTestDb);

  beforeEach(async () => {
    await clearTestDb();
    await Promise.all([
      Skill.create({ name: 'Node.js', category: 'software', level: 5 }),
      Certification.create({
        name: 'Verified Course',
        issuer: 'Example Academy',
        issueDate: new Date('2026-01-01'),
      }),
    ]);
  });

  test('GET /skills omits __v', async () => {
    const res = await request(app).get('/api/v1/skills');

    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal('__v' in res.body.data[0], false);
  });

  test('GET /certifications omits __v', async () => {
    const res = await request(app).get('/api/v1/certifications');

    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal('__v' in res.body.data[0], false);
  });
});
