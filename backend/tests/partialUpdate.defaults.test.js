import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import { adminHeaders, createAdminUser } from './helpers/auth.js';
import app from '../src/app.js';
import { Project } from '../src/models/Project.js';
import { Post } from '../src/models/Post.js';
import { Skill } from '../src/models/Skill.js';
import { Certification } from '../src/models/Certification.js';

before(connectTestDb);
after(closeTestDb);
beforeEach(clearTestDb);

// createXSchema.partial() alone does NOT strip a field's .default(...) — Zod
// still fills the default in for any key the client omits. So a PATCH that
// only means to change one field silently resets every other optional field
// to its create-time default. Worst case: PATCHing just `featured` on a
// published project silently sets status back to 'draft'.
describe('partial updates must not reset omitted optional fields to their create-time defaults', () => {
  test('PATCH /projects/:id preserves status/tags/featured/order when they are omitted', async () => {
    const admin = await createAdminUser();
    const project = await Project.create({
      title: 'Full Project',
      slug: 'full-project',
      section: 'full-stack',
      summary: 'Original summary',
      status: 'published',
      tags: ['react', 'node'],
      featured: true,
      order: 3,
    });

    const res = await request(app)
      .patch(`/api/v1/projects/${project._id}`)
      .set(adminHeaders(admin._id))
      .send({ summary: 'Updated summary only' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.summary, 'Updated summary only');
    assert.equal(res.body.data.status, 'published');
    assert.deepEqual(res.body.data.tags, ['react', 'node']);
    assert.equal(res.body.data.featured, true);
    assert.equal(res.body.data.order, 3);
  });

  test('PATCH /posts/:id preserves status/tags when they are omitted', async () => {
    const admin = await createAdminUser();
    const post = await Post.create({
      title: 'Full Post',
      slug: 'full-post',
      excerpt: 'Original excerpt',
      content: 'Body',
      status: 'published',
      tags: ['news', 'update'],
    });

    const res = await request(app)
      .patch(`/api/v1/posts/${post._id}`)
      .set(adminHeaders(admin._id))
      .send({ excerpt: 'Updated excerpt only' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.excerpt, 'Updated excerpt only');
    assert.equal(res.body.data.status, 'published');
    assert.deepEqual(res.body.data.tags, ['news', 'update']);
  });

  test('PATCH /skills/:id preserves icon/yearsOfExperience/description/order when omitted', async () => {
    const admin = await createAdminUser();
    const skill = await Skill.create({
      name: 'React',
      category: 'software',
      level: 4,
      icon: 'react-icon',
      yearsOfExperience: 5,
      description: 'Frontend framework',
      order: 2,
    });

    const res = await request(app)
      .patch(`/api/v1/skills/${skill._id}`)
      .set(adminHeaders(admin._id))
      .send({ level: 5 });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.level, 5);
    assert.equal(res.body.data.icon, 'react-icon');
    assert.equal(res.body.data.yearsOfExperience, 5);
    assert.equal(res.body.data.description, 'Frontend framework');
    assert.equal(res.body.data.order, 2);
  });

  test('PATCH /certifications/:id preserves category/featured/order when omitted', async () => {
    const admin = await createAdminUser();
    const cert = await Certification.create({
      name: 'AWS Cert',
      issuer: 'AWS',
      category: 'engineering',
      issueDate: new Date('2023-01-01'),
      featured: true,
      order: 1,
    });

    const res = await request(app)
      .patch(`/api/v1/certifications/${cert._id}`)
      .set(adminHeaders(admin._id))
      .send({ name: 'AWS Certification Updated' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.name, 'AWS Certification Updated');
    assert.equal(res.body.data.category, 'engineering');
    assert.equal(res.body.data.featured, true);
    assert.equal(res.body.data.order, 1);
  });
});
