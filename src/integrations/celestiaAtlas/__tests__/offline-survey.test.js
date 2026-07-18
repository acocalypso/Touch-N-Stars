import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import {
  PACKAGED_DSS_SKY_SURVEY_SOURCE,
  createDssSkySurveySource,
  resolveCelestiaAtlasDataBaseUrl,
} from '../offlineSkySurvey.js';

const surveyRoot = new URL('../../../../public/celestia-atlas-data/surveys/dss/', import.meta.url);

test('the configured DSS background is completely local and matches packaged orders', async () => {
  assert.equal(PACKAGED_DSS_SKY_SURVEY_SOURCE.url, '/celestia-atlas-data/surveys/dss');
  assert.equal(PACKAGED_DSS_SKY_SURVEY_SOURCE.minOrder, 3);
  assert.equal(PACKAGED_DSS_SKY_SURVEY_SOURCE.maxOrder, 4);
  assert.equal(PACKAGED_DSS_SKY_SURVEY_SOURCE.format, 'webp');

  await Promise.all([
    access(new URL('Norder3/Dir0/Npix0.webp', surveyRoot)),
    access(new URL('Norder4/Dir0/Npix0.webp', surveyRoot)),
  ]);

  const properties = await readFile(new URL('properties', surveyRoot), 'utf8');
  assert.match(properties, /^hips_order\s*=\s*4$/m);
  assert.match(properties, /^hips_service_url\s*=\s*\/celestia-atlas-data\/surveys\/dss$/m);
  assert.doesNotMatch(properties, /^hips_service_url\s*=\s*https?:\/\//m);
});

test('native apps load Atlas data from the selected NINA plugin', () => {
  const dataBaseUrl = resolveCelestiaAtlasDataBaseUrl({
    native: true,
    protocol: 'http',
    host: '192.168.1.42',
    port: 5000,
  });
  assert.equal(dataBaseUrl, 'http://192.168.1.42:5000/celestia-atlas-data');
  assert.equal(
    createDssSkySurveySource(dataBaseUrl).url,
    'http://192.168.1.42:5000/celestia-atlas-data/surveys/dss'
  );
});

test('web builds keep using the same-origin Atlas data tree', () => {
  assert.equal(
    resolveCelestiaAtlasDataBaseUrl({
      native: false,
      host: '192.168.1.42',
      port: 5000,
    }),
    '/celestia-atlas-data'
  );
});
