// Guards the apiService facade during the domain-module refactoring:
// every method that existed on the monolithic apiService must stay reachable
// through the facade with the same name. Catches both forgotten methods and
// silent overwrites from name collisions when spreading domain modules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installBrowserGlobals } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();

const { default: apiService } = await import('@/services/apiService');

const snapshot = JSON.parse(
  readFileSync(new URL('./apiServiceSurface.snapshot.json', import.meta.url), 'utf8')
);

test('apiService facade exposes exactly the snapshotted method surface', () => {
  const actual = {};
  for (const key of Object.keys(apiService).sort()) {
    const value = apiService[key];
    actual[key] = typeof value === 'function' ? 'function' : Object.keys(value).sort();
  }

  assert.deepEqual(
    actual,
    snapshot,
    'apiService surface changed. If intentional, regenerate the snapshot with:\n' +
      '  node --import ./scripts/test-loader.mjs scripts/dump-api-surface.mjs'
  );
});
