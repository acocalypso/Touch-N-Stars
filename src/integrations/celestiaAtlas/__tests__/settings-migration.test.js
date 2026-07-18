import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalizeCelestiaAtlasDataUrl,
  migratePersistedCelestiaAtlasSettings,
} from '@/store/utils/celestiaAtlasSettingsMigration';

test('migrates the legacy persisted Atlas key without losing user preferences', () => {
  const source = {
    language: 'de',
    stellarium: {
      azimuthalLinesVisible: true,
      skySurveyVisible: false,
      customLandscapeUrl: '/stellarium-data/landscapes/custom-site',
      customLandscapeKey: 'custom-site',
    },
  };

  const { state, migrated } = migratePersistedCelestiaAtlasSettings(source);

  assert.equal(migrated, true);
  assert.equal(state.language, 'de');
  assert.equal(state.stellarium, undefined);
  assert.equal(state.celestiaAtlas.azimuthalLinesVisible, true);
  assert.equal(state.celestiaAtlas.skySurveyVisible, false);
  assert.equal(
    state.celestiaAtlas.customLandscapeUrl,
    '/celestia-atlas-data/landscapes/custom-site'
  );
  assert.equal(state.celestiaAtlas.starMagnitudeLimit, 6.5);
});

test('current Celestia settings take precedence over a stale legacy snapshot', () => {
  const { state } = migratePersistedCelestiaAtlasSettings({
    stellarium: { skySurveyVisible: false, galaxyMagnitudeLimit: 12 },
    celestiaAtlas: { skySurveyVisible: true, galaxyMagnitudeLimit: 9 },
  });

  assert.equal(state.celestiaAtlas.skySurveyVisible, true);
  assert.equal(state.celestiaAtlas.galaxyMagnitudeLimit, 9);
  assert.equal(state.stellarium, undefined);
});

test('canonicalizes only local legacy data paths', () => {
  assert.equal(
    canonicalizeCelestiaAtlasDataUrl('stellarium-data/landscapes/gray'),
    'celestia-atlas-data/landscapes/gray'
  );
  assert.equal(
    canonicalizeCelestiaAtlasDataUrl('https://example.test/stellarium-data/landscapes/site'),
    'https://example.test/stellarium-data/landscapes/site'
  );
});
