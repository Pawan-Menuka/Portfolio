import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import { backfillPublishedAt } from '../scripts/backfillPublishedAt.js';
import { Project } from '../src/models/Project.js';

before(connectTestDb);
after(closeTestDb);
beforeEach(clearTestDb);

describe('backfillPublishedAt', () => {
  test('sets publishedAt on published rows missing it, without touching rows that already have it', async () => {
    const missing = await Project.create({
      title: 'Missing',
      slug: 'missing',
      section: 'full-stack',
      summary: 'S',
      status: 'published',
    });
    // Project.create's pre('save') hook already sets publishedAt on a fresh
    // published doc — strip it via the raw collection to simulate a legacy
    // row published via PATCH before the B2 fix.
    await Project.collection.updateOne({ _id: missing._id }, { $unset: { publishedAt: '' } });

    const existingDate = new Date('2020-01-01T00:00:00.000Z');
    const already = await Project.create({
      title: 'Already Set',
      slug: 'already-set',
      section: 'full-stack',
      summary: 'S',
      status: 'published',
    });
    await Project.collection.updateOne({ _id: already._id }, { $set: { publishedAt: existingDate } });

    const result = await backfillPublishedAt();

    const missingAfter = await Project.findById(missing._id).lean();
    const alreadyAfter = await Project.findById(already._id).lean();

    assert.ok(missingAfter.publishedAt, 'publishedAt should now be set on the previously-missing row');
    assert.deepEqual(alreadyAfter.publishedAt, existingDate, 'an already-set publishedAt must not be overwritten');
    assert.equal(result.projects.modified, 1);
  });
});
