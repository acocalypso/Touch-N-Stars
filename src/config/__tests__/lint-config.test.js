import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('lints maintained sources without traversing generated build caches', async () => {
  const [packageSource, eslintConfig] = await Promise.all([
    readFile(new URL('../../../package.json', import.meta.url), 'utf8'),
    readFile(new URL('../../../eslint.config.js', import.meta.url), 'utf8'),
  ]);
  const packageJson = JSON.parse(packageSource);

  assert.match(packageJson.scripts.lint, /^eslint src vite\.config\.js eslint\.config\.js /);
  assert.match(packageJson.scripts.lint, /--cache-location \.cache\/eslint\/\.eslintcache/);
  assert.doesNotMatch(packageJson.scripts.lint, /eslint \./);
  assert.match(eslintConfig, /'\*\*\/\.cache\/\*\*'/);
  assert.doesNotMatch(eslintConfig, /eslint-plugin-prettier|prettier\/prettier/);
  assert.equal(packageJson.devDependencies['eslint-plugin-prettier'], undefined);
});
