import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLandscapeSource } from '../utils/stellariumLandscapeSource.js';

const BASE_URL = 'http://127.0.0.1:5000/stellarium-data/';
const BASE_URL_NO_TRAILING_SLASH = 'http://127.0.0.1:5000/stellarium-data';

test('returns hidden landscape config when landscapes are disabled', () => {
  const result = resolveLandscapeSource({ landscapesVisible: false }, BASE_URL);

  assert.equal(result.visible, false);
  assert.equal(result.source, null);
});

test('uses default landscape source when mode is default', () => {
  const result = resolveLandscapeSource(
    {
      landscapesVisible: true,
      landscapeSourceMode: 'default',
    },
    BASE_URL
  );

  assert.equal(result.visible, true);
  assert.deepEqual(result.source, {
    url: `${BASE_URL}landscapes/guereins`,
    key: 'guereins',
  });
});

test('uses neutral landscape source when mode is neutral', () => {
  const result = resolveLandscapeSource(
    {
      landscapesVisible: true,
      landscapeSourceMode: 'neutral',
    },
    BASE_URL
  );

  assert.equal(result.visible, true);
  assert.deepEqual(result.source, {
    url: `${BASE_URL}landscapes/gray`,
    key: 'gray',
  });
});

test('uses custom relative source url and custom key', () => {
  const result = resolveLandscapeSource(
    {
      landscapesVisible: true,
      landscapeSourceMode: 'custom',
      customLandscapeUrl: 'landscapes/my-custom',
      customLandscapeKey: 'my-custom-key',
    },
    BASE_URL
  );

  assert.equal(result.visible, true);
  assert.deepEqual(result.source, {
    url: `${BASE_URL}landscapes/my-custom`,
    key: 'my-custom-key',
  });
});

test('keeps absolute custom source url unchanged', () => {
  const result = resolveLandscapeSource(
    {
      landscapesVisible: true,
      landscapeSourceMode: 'custom',
      customLandscapeUrl: 'https://example.com/stellarium/custom-landscape',
      customLandscapeKey: 'custom',
    },
    BASE_URL
  );

  assert.equal(result.visible, true);
  assert.deepEqual(result.source, {
    url: 'https://example.com/stellarium/custom-landscape',
    key: 'custom',
  });
});

test('falls back to default source when custom mode has no url', () => {
  const result = resolveLandscapeSource(
    {
      landscapesVisible: true,
      landscapeSourceMode: 'custom',
      customLandscapeUrl: '   ',
      customLandscapeKey: 'custom',
    },
    BASE_URL
  );

  assert.equal(result.visible, true);
  assert.deepEqual(result.source, {
    url: `${BASE_URL}landscapes/guereins`,
    key: 'guereins',
  });
});

test('normalizes default source when base URL has no trailing slash', () => {
  const result = resolveLandscapeSource(
    {
      landscapesVisible: true,
      landscapeSourceMode: 'default',
    },
    BASE_URL_NO_TRAILING_SLASH
  );

  assert.equal(result.visible, true);
  assert.deepEqual(result.source, {
    url: `${BASE_URL}landscapes/guereins`,
    key: 'guereins',
  });
});

test('uses relative custom path when base URL is empty', () => {
  const result = resolveLandscapeSource(
    {
      landscapesVisible: true,
      landscapeSourceMode: 'custom',
      customLandscapeUrl: 'landscapes/my-custom',
      customLandscapeKey: 'my-custom-key',
    },
    ''
  );

  assert.equal(result.visible, true);
  assert.deepEqual(result.source, {
    url: 'landscapes/my-custom',
    key: 'my-custom-key',
  });
});
