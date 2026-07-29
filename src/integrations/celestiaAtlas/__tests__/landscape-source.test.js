import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLandscapeSource } from '../../../store/utils/celestiaAtlasLandscapeSource.js';

test('native plugin data base is applied to default and migrated local landscapes', () => {
  const baseUrl = 'http://192.168.1.42:5000/celestia-atlas-data';
  const defaultSource = resolveLandscapeSource({ landscapesVisible: true }, baseUrl);
  assert.equal(
    defaultSource.source.url,
    'http://192.168.1.42:5000/celestia-atlas-data/landscapes/guereins'
  );

  const customSource = resolveLandscapeSource(
    {
      landscapesVisible: true,
      landscapeSourceMode: 'custom',
      customLandscapeUrl: '/celestia-atlas-data/landscapes/custom',
    },
    baseUrl
  );
  assert.equal(
    customSource.source.url,
    'http://192.168.1.42:5000/celestia-atlas-data/landscapes/custom'
  );
});

test('external custom landscapes remain external', () => {
  const source = resolveLandscapeSource(
    {
      landscapesVisible: true,
      landscapeSourceMode: 'custom',
      customLandscapeUrl: 'https://example.test/landscape',
    },
    '/celestia-atlas-data'
  );
  assert.equal(source.source.url, 'https://example.test/landscape');
});
