import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const srcRoot = fileURLToPath(new URL('../../../', import.meta.url));

const allowedRuntimeReferences = new Map([
  ['components/celestiaAtlas/CelestiaAtlasSettings.vue', /listStellariumLandscapes/],
  ['integrations/celestiaAtlas/catalogLayers.js', /stellariumSupplement|Stellarium DSO supplement/],
  ['plugins/landscaper-creator/index.js', /StellariumLandscapeCreator/],
  [
    'plugins/landscaper-creator/plugin.json',
    /Stellarium landscape ZIP|Stellarium Landscape Creator/,
  ],
  ['plugins/landscaper-creator/views/StellariumLandscapeCreator.vue', /createStellariumLandscape/],
  [
    'services/__tests__/apiServiceSurface.snapshot.json',
    /createStellariumLandscape|listStellariumLandscapes/,
  ],
  [
    'services/api/profile.js',
    /createStellariumLandscape|listStellariumLandscapes|api\/stellarium\/landscape/,
  ],
  ['store/utils/celestiaAtlasSettingsMigration.js', /stellarium-data|\.stellarium/],
  ['views/CelestiaAtlasView.vue', /stellariumSupplement|stellarium-supplement-data/],
]);

async function collectRuntimeFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') continue;
      files.push(...(await collectRuntimeFiles(absolutePath)));
      continue;
    }

    if (/\.(?:js|json|vue)$/.test(entry.name)) files.push(absolutePath);
  }

  return files;
}

function collectStringValues(value, prefix = '', output = []) {
  if (typeof value === 'string') {
    output.push({ key: prefix, value });
    return output;
  }

  if (!value || typeof value !== 'object') return output;
  for (const [key, child] of Object.entries(value)) {
    collectStringValues(child, prefix ? `${prefix}.${key}` : key, output);
  }
  return output;
}

test('runtime Stellarium references are limited to documented compatibility boundaries', async () => {
  const files = await collectRuntimeFiles(srcRoot);
  const unexpected = [];

  for (const absolutePath of files) {
    const relativePath = path.relative(srcRoot, absolutePath).replaceAll('\\', '/');
    if (relativePath.startsWith('locales/')) continue;

    const source = await readFile(absolutePath, 'utf8');
    const lines = source.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      if (!/stellarium/i.test(line)) continue;
      const allowedPattern = allowedRuntimeReferences.get(relativePath);
      if (!allowedPattern?.test(line)) {
        unexpected.push(`${relativePath}:${index + 1}: ${line.trim()}`);
      }
    }
  }

  assert.deepEqual(unexpected, []);
});

test('localized Stellarium wording only describes schema or landscape-format compatibility', async () => {
  const localeDirectory = path.join(srcRoot, 'locales');
  const localeFiles = (await readdir(localeDirectory)).filter((name) => name.endsWith('.json'));
  const unexpected = [];

  for (const localeFile of localeFiles) {
    const locale = JSON.parse(await readFile(path.join(localeDirectory, localeFile), 'utf8'));
    for (const entry of collectStringValues(locale)) {
      if (!/stellarium/i.test(entry.value)) continue;
      if (entry.key.endsWith('.StellariumObject')) continue;
      if (entry.key.startsWith('plugins.landscaperCreator.')) continue;
      unexpected.push(`${localeFile}:${entry.key}: ${entry.value}`);
    }
  }

  assert.deepEqual(unexpected, []);
});

test('startup refreshes persisted plugin metadata so legacy labels cannot survive upgrades', async () => {
  const main = await readFile(path.join(srcRoot, 'main.js'), 'utf8');
  assert.match(main, /pluginStore\.loadAndRegisterPlugins\(true\)/);
});
