import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

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

  assert.match(
    view,
    /<stellariumSettings[\s\S]*renderer-managed[\s\S]*:catalog-object-types="catalogFacets\.objectTypes"[\s\S]*:catalogue-groups="catalogFacets\.catalogueGroups"/
  );
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

test('persists the default-on photographic survey without making offline Atlas use depend on it', async () => {
  const [view, settings, settingsStore] = await Promise.all([
    readFile(new URL('../../../views/CelestiaAtlasView.vue', import.meta.url), 'utf8'),
    readFile(
      new URL('../../../components/stellarium/stellariumSettings.vue', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../../../store/settingsStore.js', import.meta.url), 'utf8'),
  ]);

  assert.match(settingsStore, /skySurveyVisible: true/);
  assert.match(view, /skySurvey: settingsStore\.stellarium\.skySurveyVisible !== false/);
  assert.match(view, /settingsStore\.stellarium\.skySurveyVisible/);
  assert.match(settings, /sky_survey_visible/);
  assert.match(settings, /sky_survey_hint/);
  assert.match(settings, /settingsStore\.stellarium\.skySurveyVisible !== false/);
  assert.match(view, /:deep\(\.celestia-atlas-survey-credit\)/);
  assert.match(view, /top: calc\(4\.5rem \+ env\(safe-area-inset-top, 0px\)\)/);
  assert.match(view, /bottom: auto !important/);
  assert.match(view, /max-width:[^;]+!important/);

  const localeDirectory = new URL('../../../locales/', import.meta.url);
  const localeFiles = (await readdir(localeDirectory)).filter((name) => name.endsWith('.json'));
  assert.ok(localeFiles.length > 1);
  for (const localeFile of localeFiles) {
    const locale = JSON.parse(await readFile(new URL(localeFile, localeDirectory), 'utf8'));
    const messages = locale.components.stellarium.settings;
    assert.ok(messages.sky_survey_visible?.trim(), `${localeFile} is missing the survey label`);
    assert.ok(messages.sky_survey_hint?.trim(), `${localeFile} is missing the survey hint`);
  }

  const english = JSON.parse(await readFile(new URL('en.json', localeDirectory), 'utf8'));
  const hint = english.components.stellarium.settings.sky_survey_hint;
  assert.match(hint, /on demand/i);
  assert.match(hint, /recently viewed/i);
  assert.match(hint, /cached offline/i);
  assert.match(hint, /unseen fields/i);
  assert.match(hint, /local atlas/i);
  assert.match(hint, /offline/i);
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
  assert.match(
    view,
    /Promise\.all\(\[[\s\S]*viewer-catalog-data[\s\S]*abell-pn-data[\s\S]*stellarium-supplement-data[\s\S]*bright-sky-data[\s\S]*hyg-star-data/
  );
  assert.match(view, /buildEmbeddedAtlasCatalog/);
  assert.match(view, /const \{ catalog, stars, constellations \}/);
  assert.doesNotMatch(view, /object\.ra \* 15/);
  assert.match(view, /if \(disposed\) return;[\s\S]*createCelestiaAtlasViewer/);
  assert.match(view, /onBeforeUnmount\(\(\) => \{[\s\S]*disposed = true[\s\S]*viewer\?\.destroy/);

  const supplementGroup = vite.indexOf("name: 'celestia-catalog-supplement'");
  const starCatalogGroup = vite.indexOf("name: 'celestia-star-catalog'");
  const catalogGroup = vite.indexOf("name: 'celestia-catalog'");
  const engineGroup = vite.indexOf("name: 'celestia-engine'");
  const catchAllVendor = vite.indexOf("name: 'vendor'");
  assert.ok(supplementGroup > 0 && supplementGroup < catalogGroup);
  assert.ok(starCatalogGroup > supplementGroup && starCatalogGroup < catalogGroup);
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

test('persists touch-sized Atlas type and catalogue filters without limiting offline search', async () => {
  const [view, settingsView, filterView, facetView, settingsStore] = await Promise.all([
    readFile(new URL('../../../views/CelestiaAtlasView.vue', import.meta.url), 'utf8'),
    readFile(
      new URL('../../../components/stellarium/stellariumSettings.vue', import.meta.url),
      'utf8'
    ),
    readFile(
      new URL('../../../components/stellarium/AtlasCatalogFilters.vue', import.meta.url),
      'utf8'
    ),
    readFile(
      new URL('../../../components/stellarium/AtlasFacetGroup.vue', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../../../store/settingsStore.js', import.meta.url), 'utf8'),
  ]);

  assert.match(settingsStore, /deepSkyObjectTypes: null/);
  assert.match(settingsStore, /deepSkyCatalogueGroups: null/);
  assert.match(settingsStore, /persist: true/);
  assert.doesNotMatch(settingsStore, /settings-store/);
  assert.match(view, /catalogFacets\.value = buildAtlasCatalogFacets\(catalog\)/);
  assert.match(view, /synchronizeCatalogFilterSettings\(\)/);
  assert.match(view, /deepSkyObjectTypes: normalizeAtlasFacetSelection/);
  assert.match(view, /deepSkyCatalogueGroups: normalizeAtlasFacetSelection/);
  assert.match(view, /settingsStore\.stellarium\.deepSkyObjectTypes/);
  assert.match(view, /settingsStore\.stellarium\.deepSkyCatalogueGroups/);
  assert.match(view, /searchResults\.value = viewer\?\.search\(searchQuery\.value\) \?\? \[\]/);
  assert.match(settingsView, /<AtlasCatalogFilters[\s\S]*v-if="rendererManaged"/);
  assert.match(settingsView, /:disabled="!settingsStore\.stellarium\.dsosVisible"/);
  assert.match(filterView, /toggleAtlasFacetSelection/);
  assert.match(filterView, /settingsStore\.stellarium\[setting\] = value/);
  assert.match(facetView, /<details/);
  assert.match(facetView, /type="checkbox"/);
  assert.match(facetView, /:id="`atlas-\$\{kind\}-\$\{facet\.key\}`"/);
  assert.match(facetView, /:name="`atlas-\$\{kind\}`"/);
  assert.match(facetView, /data-filter-action="all"/);
  assert.match(facetView, /data-filter-action="none"/);
  assert.match(facetView, /:data-facet-key="facet\.key"/);
  assert.ok((facetView.match(/min-h-11/g) ?? []).length >= 4);

  const localeDirectory = new URL('../../../locales/', import.meta.url);
  const localeFiles = (await readdir(localeDirectory)).filter((name) => name.endsWith('.json'));
  const requiredKeys = [
    'catalog_filters',
    'catalog_filter_hint',
    'catalog_filter_types',
    'catalog_filter_sources',
    'catalog_filter_selected',
    'catalog_filter_all',
    'catalog_filter_none',
  ];
  for (const localeFile of localeFiles) {
    const locale = JSON.parse(await readFile(new URL(localeFile, localeDirectory), 'utf8'));
    const messages = locale.components.stellarium.settings;
    for (const key of requiredKeys) {
      assert.ok(messages[key]?.trim(), `${localeFile} is missing ${key}`);
    }
    assert.deepEqual(
      [...messages.catalog_filter_selected.matchAll(/\{([^}]+)\}/g)]
        .map((match) => match[1])
        .sort(),
      ['selected', 'total'],
      `${localeFile} has mismatched catalogue-filter placeholders`
    );
  }

  const english = JSON.parse(await readFile(new URL('en.json', localeDirectory), 'utf8'));
  assert.match(english.components.stellarium.settings.catalog_filter_hint, /offline search/i);
  assert.match(
    english.components.stellarium.settings.catalog_filter_hint,
    /every catalogue object/i
  );
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

test('reuses the complete selected-target workflow at the Atlas J2000 command boundary', async () => {
  const [view, selectedObject, selectionModel, favorites] = await Promise.all([
    readFile(new URL('../../../views/CelestiaAtlasView.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../../components/stellarium/SelectedObject.vue', import.meta.url), 'utf8'),
    readFile(new URL('../selectionModel.js', import.meta.url), 'utf8'),
    readFile(new URL('../../../components/favTargets/SaveFavTargets.vue', import.meta.url), 'utf8'),
  ]);

  assert.match(view, /<SelectedSkyObject/);
  assert.match(view, /const selectedObjectCommand = computed/);
  assert.match(view, /atlasSelectionToCommandModel\(selectedTarget\.value\)/);
  assert.match(view, /:command-target="selectedObjectCommand\.commandTarget"/);
  assert.match(view, /dismissible/);
  assert.match(view, /@dismiss="hideSelectedTargetDetails"/);
  assert.doesNotMatch(view, /sendSelectionToFraming/);
  assert.doesNotMatch(view, /store\.mount\.currentTab = 'showSlew'/);
  assert.doesNotMatch(view, /router\.push\('\/mount'\)/);

  assert.match(selectionModel, /const commandTarget = atlasSelectionToFraming\(target\)/);
  assert.match(selectionModel, /raString: degreesToHMS\(commandTarget\.RA\)/);
  assert.match(selectionModel, /decString: degreesToDMS\(commandTarget\.Dec\)/);

  assert.match(selectedObject, /selectedObject: Array/);
  assert.match(selectedObject, /commandTarget:[\s\S]*default: null/);
  assert.match(selectedObject, /<fieldset[\s\S]*:disabled="!actionControlsEnabled"/);
  assert.match(selectedObject, /<SaveFavTargets/);
  assert.match(selectedObject, /@click="openFramingModal"/);
  assert.match(selectedObject, /<setSequenceTarget/);
  assert.match(selectedObject, /<ButtonSlewCenterRotate/);
  assert.match(selectedObject, /<ButtomSyncCoordinatesToMount/);
  assert.match(selectedObject, /\.\.\.\(props\.commandTarget \?\? \{\}\)/);
  assert.match(selectedObject, /router\.push\('\/framing'\)/);
  assert.match(selectedObject, /defineEmits\(\['dismiss'\]\)/);
  assert.match(selectedObject, /selected-object-content-landscape/);
  assert.match(selectedObject, /100dvh/);
  assert.match(favorites, /<Teleport to="body">/);
});
