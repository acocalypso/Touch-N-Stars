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

test('connects the existing display settings through the host-managed Atlas adapter', async () => {
  const [view, settings, settingsStore] = await Promise.all([
    readFile(new URL('../../../views/CelestiaAtlasView.vue', import.meta.url), 'utf8'),
    readFile(
      new URL('../../../components/stellarium/stellariumSettings.vue', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../../../store/settingsStore.js', import.meta.url), 'utf8'),
  ]);

  assert.match(view, /<stellariumSettings renderer-managed \/>/);
  assert.match(settings, /rendererManaged/);
  assert.match(
    settings,
    /if \(!props\.rendererManaged\) stellariumStore\.updateStellariumCore\(\)/
  );
  assert.match(settingsStore, /hideBelowHorizon: true/);
  assert.match(settings, /settingsStore\.stellarium\.hideBelowHorizon !== false/);
  assert.match(view, /hideBelowHorizon: settingsStore\.stellarium\.hideBelowHorizon !== false/);
  assert.match(view, /calculateCameraFieldOfView/);
  assert.match(view, /CameraSettings\?\.PixelSize/);
  assert.match(view, /TelescopeSettings\?\.FocalLength/);
  assert.match(view, /FramingAssistantSettings\?\.CameraWidth/);
  assert.match(view, /FramingAssistantSettings\?\.CameraHeight/);
  assert.doesNotMatch(view, /computeCameraFovDeg/);
});
