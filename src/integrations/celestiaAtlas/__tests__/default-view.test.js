import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('loads Celestia Atlas by default and keeps Stellarium behind an explicit rollback flag', async () => {
  const app = await readFile(new URL('../../../App.vue', import.meta.url), 'utf8');

  assert.match(app, /VITE_STELLARIUM_ROLLBACK === 'true'/);
  assert.match(
    app,
    /VITE_STELLARIUM_ROLLBACK === 'true'[\s\S]*StellariumView\.vue[\s\S]*CelestiaAtlasView\.vue/
  );
  assert.doesNotMatch(app, /VITE_CELESTIA_ATLAS_POC/);
});
