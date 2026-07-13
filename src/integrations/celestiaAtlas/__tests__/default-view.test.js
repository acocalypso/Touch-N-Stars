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
  assert.match(view, /rotationDeg: Number\(framingStore\.rotationAngle \?\? 0\)/);
  assert.match(view, /rotationConvention: 'clockwise-from-celestial-north'/);
  assert.doesNotMatch(view, /computeCameraFovDeg/);
  assert.match(view, /starMagnitudeLimit: normalizeAtlasMagnitudeLimit/);
  assert.match(view, /galaxyMagnitudeLimit: normalizeAtlasMagnitudeLimit/);
  assert.match(view, /deepSkyMagnitudeLimit: normalizeAtlasMagnitudeLimit/);
  const viewerCreation = view.indexOf('viewer = createCelestiaAtlasViewer({');
  const horizontalMode = view.indexOf("viewer.setCoordinateMode('horizontal')");
  const savedViewRestore = view.indexOf('const savedView = sessionStorage.getItem');
  assert.ok(
    viewerCreation >= 0 && viewerCreation < horizontalMode && horizontalMode < savedViewRestore
  );
});

test('defers Atlas resources until first open and guards late async initialization', async () => {
  const [app, view, vite] = await Promise.all([
    readFile(new URL('../../../App.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../../views/CelestiaAtlasView.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../../../vite.config.js', import.meta.url), 'utf8'),
  ]);

  assert.match(app, /v-if="settingsStore\.setupCompleted && skyAtlasMounted"/);
  assert.match(app, /const skyAtlasMounted = ref\(Boolean\(store\.showStellarium\)\)/);
  assert.match(app, /if \(visible\) skyAtlasMounted\.value = true/);
  assert.match(view, /void store\.fetchProfilInfos\(\)\.catch/);
  assert.match(view, /Promise\.all\(\[[\s\S]*viewer-catalog-data[\s\S]*bright-sky-data/);
  assert.match(view, /const catalog = catalogModule\.default\.objects/);
  assert.doesNotMatch(view, /object\.ra \* 15/);
  assert.match(view, /if \(disposed\) return;[\s\S]*createCelestiaAtlasViewer/);
  assert.match(view, /onBeforeUnmount\(\(\) => \{[\s\S]*disposed = true[\s\S]*viewer\?\.destroy/);

  const catalogGroup = vite.indexOf("name: 'celestia-catalog'");
  const engineGroup = vite.indexOf("name: 'celestia-engine'");
  const catchAllVendor = vite.indexOf("name: 'vendor'");
  assert.ok(catalogGroup > 0 && catalogGroup < catchAllVendor);
  assert.ok(engineGroup > catalogGroup && engineGroup < catchAllVendor);
});

test('persists touch-sized brightness controls for all three Atlas categories', async () => {
  const [settingsStore, settingsView, englishLocale] = await Promise.all([
    readFile(new URL('../../../store/settingsStore.js', import.meta.url), 'utf8'),
    readFile(
      new URL('../../../components/stellarium/stellariumSettings.vue', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../../../locales/en.json', import.meta.url), 'utf8'),
  ]);

  assert.match(settingsStore, /starMagnitudeLimit: 6\.5/);
  assert.match(settingsStore, /galaxyMagnitudeLimit: 30/);
  assert.match(settingsStore, /deepSkyMagnitudeLimit: 30/);
  assert.match(settingsView, /v-if="rendererManaged"[\s\S]*brightness_filters/);
  assert.match(settingsView, /v-model\.number="starMagnitudeLimit"/);
  assert.match(settingsView, /v-model\.number="galaxyMagnitudeLimit"/);
  assert.match(settingsView, /v-model\.number="deepSkyMagnitudeLimit"/);
  assert.match(settingsView, /class="w-full h-11 accent-cyan-500"/);
  const messages = JSON.parse(englishLocale).components.stellarium.settings;
  assert.equal(messages.magnitude_limit_auto, 'Auto');
  assert.match(messages.magnitude_limit_hint, /Lower values show only brighter objects/);
});

test('routes every Atlas view-center action through the J2000 command boundary', async () => {
  const [view, actions] = await Promise.all([
    readFile(new URL('../../../views/CelestiaAtlasView.vue', import.meta.url), 'utf8'),
    readFile(
      new URL('../../../components/stellarium/StellariumFovRotation.vue', import.meta.url),
      'utf8'
    ),
  ]);

  assert.match(view, /function getAtlasViewCenter\(\)[\s\S]*toNinaJ2000Coordinates\(center\)/);
  assert.match(view, /target = atlasSearchResultToTarget\(result\)/);
  assert.doesNotMatch(view, /result\.frame \|\| 'ICRS'/);
  assert.match(actions, /setCommandCoordinates\(props\.getViewCenter\(\)\)/);
  assert.match(actions, /toNinaJ2000Coordinates\(value \?\? \{\}\)/);
  assert.match(actions, /function invalidateCoordinates\(\)[\s\S]*raDeg\.value = null/);
  assert.match(actions, /<fieldset[\s\S]*:disabled="!hasValidCoordinates"/);
});
