import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { inspectNativeAtlasBuild } from '../../../../scripts/verify-native-atlas-build.mjs';

const requiredAssets = [
  'CelestiaAtlasView-test.js',
  'celestia-engine-test.js',
  'celestia-catalog-test.js',
  'celestia-catalog-supplement-test.js',
  'celestia-star-catalog-test.js',
];

async function createFixture() {
  const root = path.join(tmpdir(), `tns-native-atlas-${randomUUID()}`);
  await mkdir(path.join(root, 'assets'), { recursive: true });
  await writeFile(path.join(root, 'index.html'), '<main>Touch-N-Stars</main>');
  await Promise.all(
    requiredAssets.map((name) => writeFile(path.join(root, 'assets', name), 'export {};'))
  );
  return root;
}

test('accepts a compact native build with local Celestia Atlas runtime chunks', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));

  const report = await inspectNativeAtlasBuild(root);
  assert.deepEqual(report.errors, []);
});

test('rejects bundled survey data, legacy runtime assets and public survey URLs', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'celestia-atlas-data'), { recursive: true });
  await mkdir(path.join(root, 'stellarium-js'), { recursive: true });
  await writeFile(path.join(root, 'celestia-atlas-data', 'tile.webp'), 'tile');
  await writeFile(path.join(root, 'stellarium-js', 'engine.js'), 'legacy');
  await writeFile(
    path.join(root, 'assets', 'CelestiaAtlasView-test.js'),
    'fetch("https://alasky.u-strasbg.fr/DSS2/")'
  );

  const report = await inspectNativeAtlasBuild(root);
  assert.ok(report.errors.some((error) => error.includes('celestia-atlas-data')));
  assert.ok(report.errors.some((error) => error.includes('stellarium-js')));
  assert.ok(report.errors.some((error) => error.includes('online survey URL')));
});

test('rejects native web payloads that exceed the configured package budget', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));

  const report = await inspectNativeAtlasBuild(root, { budgetBytes: 1 });
  assert.ok(report.errors.some((error) => error.includes('above the')));
});
