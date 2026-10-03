import test from 'node:test';
import assert from 'node:assert/strict';

import { MAX_SAVED_ARCHIVES, archivesToEvict } from '../savedArchivesDb.js';

function archives(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `a${i}`,
    createdAt: new Date(Date.UTC(2026, 0, count - i)).toISOString(),
  }));
}

test('archivesToEvict keeps a full list untouched', () => {
  assert.deepEqual(archivesToEvict(archives(MAX_SAVED_ARCHIVES)), []);
});

test('archivesToEvict returns only the oldest entry when one over the cap', () => {
  assert.deepEqual(archivesToEvict(archives(MAX_SAVED_ARCHIVES + 1)), ['a5']);
});

test('archivesToEvict returns all entries beyond the cap, oldest last', () => {
  assert.deepEqual(archivesToEvict(archives(MAX_SAVED_ARCHIVES + 2)), ['a5', 'a6']);
});
