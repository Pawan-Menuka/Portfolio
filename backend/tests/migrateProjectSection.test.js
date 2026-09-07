import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORY_TO_SECTION } from '../scripts/migrateProjectSection.js';

describe('CATEGORY_TO_SECTION mapping (used by the one-off migration script)', () => {
  test('maps every legacy category value to its correct section', () => {
    assert.deepEqual(CATEGORY_TO_SECTION, {
      software: 'full-stack',
      blockchain: 'blockchain',
      cnc: 'hardware',
    });
  });
});
