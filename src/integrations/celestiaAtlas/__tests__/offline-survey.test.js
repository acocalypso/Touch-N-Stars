import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { PACKAGED_DSS_SKY_SURVEY_SOURCE } from '../offlineSkySurvey.js';

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
