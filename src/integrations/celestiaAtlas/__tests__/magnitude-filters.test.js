import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATLAS_MAGNITUDE_LIMIT_MAX,
  ATLAS_MAGNITUDE_LIMIT_MIN,
  normalizeAtlasMagnitudeLimit,
} from '../magnitudeFilters.js';

test('normalizes persisted Atlas magnitude limits at the public API boundary', () => {
  assert.equal(normalizeAtlasMagnitudeLimit('12.5', 30), 12.5);
  assert.equal(normalizeAtlasMagnitudeLimit(-5, 30), ATLAS_MAGNITUDE_LIMIT_MIN);
  assert.equal(normalizeAtlasMagnitudeLimit(42, 30), ATLAS_MAGNITUDE_LIMIT_MAX);
  assert.equal(normalizeAtlasMagnitudeLimit(Number.NaN, 6.5), 6.5);
  assert.equal(normalizeAtlasMagnitudeLimit(Number.POSITIVE_INFINITY, 30), 30);
});
