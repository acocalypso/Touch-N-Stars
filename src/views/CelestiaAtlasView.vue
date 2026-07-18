<template>
  <div class="celestia-atlas-container" :class="containerClasses">
    <div ref="viewerContainer" class="celestia-atlas-viewer" />
    <div v-if="ready" class="celestia-atlas-search">
      <input
        v-model="searchQuery"
        class="default-input h-10 w-full"
        type="search"
        :placeholder="t('components.framing.search.placeholder')"
        @input="runSearch"
      />
      <ul v-if="searchResults.length" class="celestia-atlas-results default-select">
        <li
          v-for="result in searchResults"
          :key="result.catalogId || result.id"
          class="p-2 cursor-pointer hover:bg-blue-700"
          @click="selectSearchResult(result)"
        >
          {{ result.name || result.id }}
        </li>
      </ul>
    </div>
    <div v-if="ready && store.mountInfo.Connected" class="celestia-atlas-mount-controls">
      <button
        class="p-2 bg-gray-700 border border-cyan-600 rounded-full"
        type="button"
        title="Center view on mount position"
        @click="focusMount"
      >
        ⌖
      </button>
      <button
        class="p-2 border border-cyan-600 rounded-full"
        :class="mountFollow ? 'bg-cyan-600' : 'bg-gray-700'"
        type="button"
        title="Toggle auto-sync view with mount"
        @click="toggleMountFollow"
      >
        ↻
      </button>
    </div>
    <StellariumFovRotation
      v-if="showFovControls"
      :get-view-center="getAtlasViewCenter"
      :active="store.showStellarium"
      default-target-name="Celestia Atlas view"
    />
    <div v-if="ready" class="celestia-atlas-controls">
      <stellariumSettings
        :catalog-object-types="catalogFacets.objectTypes"
        :catalogue-groups="catalogFacets.catalogueGroups"
      />
    </div>
    <div v-if="ready" class="celestia-atlas-clock">
      <div class="flex gap-2">
        <button
          class="bg-black/80 rounded-full px-3 py-2"
          type="button"
          :title="clockPaused ? 'Play' : 'Pause'"
          @click="toggleClock"
        >
          {{ clockPaused ? '▶' : 'Ⅱ' }}
        </button>
        <button
          class="bg-black/80 rounded-full px-3 py-2 font-mono"
          type="button"
          @click="toggleClockPanel"
        >
          {{ clockLabel }}
        </button>
      </div>
      <div v-if="clockPanelVisible" class="celestia-atlas-clock-panel">
        <label>
          {{ t('components.stellarium.datetime.date') }}
          <input v-model="clockDate" class="default-input" type="date" @change="applyClockInput" />
        </label>
        <label>
          {{ t('components.stellarium.datetime.time') }}
          <input v-model="clockTime" class="default-input" type="time" @change="applyClockInput" />
        </label>
        <label>
          {{ t('components.stellarium.datetime.speed') }}: {{ Math.pow(2, clockSpeedPower) }}×
          <input v-model.number="clockSpeedPower" type="range" min="-10" max="10" step="1" />
        </label>
        <button class="default-button-cyan" type="button" @click="resetClockToServer">
          {{ t('components.stellarium.datetime.now') }}
        </button>
      </div>
    </div>
    <SelectedSkyObject
      v-if="selectedObjectCommand"
      :selected-object="selectedObjectCommand.names"
      :selected-object-ra="selectedObjectCommand.raString"
      :selected-object-dec="selectedObjectCommand.decString"
      :selected-object-ra-deg="selectedObjectCommand.raDeg"
      :selected-object-dec-deg="selectedObjectCommand.decDeg"
      :command-target="selectedObjectCommand.commandTarget"
      dismissible
      @dismiss="hideSelectedTargetDetails"
    />
    <div v-if="errorMessage" class="celestia-atlas-error" role="alert">
      {{ errorMessage }}
    </div>
    <div v-else-if="landscapeErrorMessage" class="celestia-atlas-landscape-error" role="status">
      {{ landscapeErrorMessage }}
    </div>
    <div v-else-if="!ready" class="celestia-atlas-loading">
      {{ t('components.stellarium.loading') }}
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { calculateCameraFieldOfView, createCelestiaAtlasViewer } from '@acocalypso/celestia-atlas';
import { useI18n } from 'vue-i18n';
import { useOrientation } from '@/composables/useOrientation';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useSettingsStore } from '@/store/settingsStore';
import {
  atlasSearchResultToTarget,
  ninaMountToAtlas,
  ninaObserverToAtlas,
  toNinaJ2000Coordinates,
} from '@/integrations/celestiaAtlas/contracts';
import { atlasSelectionToCommandModel } from '@/integrations/celestiaAtlas/selectionModel';
import { buildEmbeddedAtlasCatalog } from '@/integrations/celestiaAtlas/catalogLayers';
import {
  buildAtlasCatalogFacets,
  normalizeAtlasFacetSelection,
} from '@/integrations/celestiaAtlas/catalogFilters';
import { normalizeAtlasMagnitudeLimit } from '@/integrations/celestiaAtlas/magnitudeFilters';
import { timeSync } from '@/utils/timeSync';
import { useHorizonStore } from '@/plugins/horizon-creator/store/horizonStore';
import { interpolateHorizon } from '@/plugins/horizon-creator/utils/horizon-utils';
import { isAppBackgrounded } from '@/utils/appLifecycle';
import { resolveLandscapeSource } from '@/store/utils/stellariumLandscapeSource';
import StellariumFovRotation from '@/components/stellarium/StellariumFovRotation.vue';
import stellariumSettings from '@/components/stellarium/stellariumSettings.vue';
import SelectedSkyObject from '@/components/stellarium/SelectedObject.vue';

const store = apiStore();
const framingStore = useFramingStore();
const settingsStore = useSettingsStore();
const horizonStore = useHorizonStore();
const { t } = useI18n();
const { isLandscape } = useOrientation();
const viewerContainer = ref(null);
const ready = ref(false);
const errorMessage = ref('');
const landscapeErrorMessage = ref('');
const searchQuery = ref('');
const searchResults = ref([]);
const selectedTarget = ref(null);
const catalogFacets = ref({ objectTypes: [], catalogueGroups: [] });
const mountFollow = ref(false);
const clockPaused = ref(false);
const clockLabel = ref('');
const clockPanelVisible = ref(false);
const clockDate = ref('');
const clockTime = ref('');
const clockSpeedPower = ref(0);
let viewer = null;
let viewSaveTimer = null;
let pendingViewState = null;
let clockDisplayTimer = null;
let searchTimer = null;
let disposed = false;
const VIEW_STATE_KEY = 'tns.celestia-atlas.view';
const SEARCH_DEBOUNCE_MS = 120;

const containerClasses = computed(() => ({
  'celestia-atlas-portrait': !isLandscape.value,
  'celestia-atlas-landscape': isLandscape.value,
}));
const showFovControls = computed(
  () =>
    ready.value &&
    Boolean(store.cameraInfo.Connected) &&
    Boolean(store.profileInfo?.TelescopeSettings?.FocalLength)
);
const selectedObjectCommand = computed(() => atlasSelectionToCommandModel(selectedTarget.value));

function getAtlasViewCenter() {
  const center = viewer?.getView().center;
  return center ? toNinaJ2000Coordinates(center) : null;
}

function updateObserver() {
  if (!viewer || !store.profileInfo?.AstrometrySettings) return;
  viewer.setObserver(ninaObserverToAtlas(store.profileInfo.AstrometrySettings));
}

function updateFieldOfView() {
  if (!viewer) return;
  const profile = store.profileInfo;
  const apertureMm = Number(profile?.TelescopeSettings?.Aperture);
  let fov;
  try {
    fov = calculateCameraFieldOfView({
      pixelSizeMicrons: Number(profile?.CameraSettings?.PixelSize),
      focalLengthMm: Number(profile?.TelescopeSettings?.FocalLength),
      sensorWidthPx: Number(profile?.FramingAssistantSettings?.CameraWidth),
      sensorHeightPx: Number(profile?.FramingAssistantSettings?.CameraHeight),
      ...(Number.isFinite(apertureMm) && apertureMm > 0 ? { apertureMm } : {}),
    });
  } catch {
    viewer.setFieldOfView(null);
    return;
  }
  viewer.setFieldOfView({
    widthDeg: fov.widthDeg,
    heightDeg: fov.heightDeg,
    rotationDeg: Number(framingStore.rotationAngle ?? 0),
    rotationConvention: 'clockwise-from-celestial-north',
    mosaic: framingStore.isMosaicMode
      ? {
          columns: Number(framingStore.mosaicCols),
          rows: Number(framingStore.mosaicRows),
          overlapPercent: Number(framingStore.mosaicOverlap),
        }
      : undefined,
  });
}

function toggleMountFollow() {
  mountFollow.value = !mountFollow.value;
  viewer?.setMountFollow(mountFollow.value);
}

function focusMount() {
  viewer?.focusMount();
}

function toggleClock() {
  clockPaused.value = !clockPaused.value;
  viewer?.setTimeRate(clockPaused.value ? 0 : Math.pow(2, clockSpeedPower.value));
  updateClockLabel();
}

function updateClockInputs() {
  if (!viewer) return;
  const date = new Date(viewer.getTime());
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  clockDate.value = local.toISOString().slice(0, 10);
  clockTime.value = local.toISOString().slice(11, 16);
}

function toggleClockPanel() {
  clockPanelVisible.value = !clockPanelVisible.value;
  if (clockPanelVisible.value) updateClockInputs();
}

function applyClockInput() {
  if (!viewer || !clockDate.value || !clockTime.value) return;
  const value = new Date(`${clockDate.value}T${clockTime.value}:00`);
  if (!Number.isNaN(value.getTime())) viewer.setTime(value.getTime());
  updateClockLabel();
}

async function resetClockToServer() {
  await timeSync.ensureSync();
  viewer?.setTime(timeSync.getServerTime());
  updateClockInputs();
  updateClockLabel();
}

function updateClockLabel() {
  if (!viewer) return;
  clockLabel.value = new Date(viewer.getTime()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function startClockDisplay() {
  updateClockLabel();
  if (clockDisplayTimer === null) clockDisplayTimer = setInterval(updateClockLabel, 1000);
}

function stopClockDisplay() {
  if (clockDisplayTimer !== null) clearInterval(clockDisplayTimer);
  clockDisplayTimer = null;
}

function queueViewPersistence(viewState) {
  pendingViewState = viewState;
  if (viewSaveTimer !== null) clearTimeout(viewSaveTimer);
  viewSaveTimer = setTimeout(() => {
    sessionStorage.setItem(VIEW_STATE_KEY, JSON.stringify(pendingViewState));
    viewSaveTimer = null;
  }, 200);
}

function updateMount() {
  if (!viewer) return;
  try {
    viewer.setMountPosition(ninaMountToAtlas(store.mountInfo, Date.now()));
  } catch (error) {
    viewer.setMountPosition(null);
    console.warn('[Celestia Atlas] Mount marker omitted:', error.message);
  }
}

function updateDisplayOptions() {
  if (!viewer) return;
  viewer.setDisplayOptions({
    grid: Boolean(settingsStore.stellarium.equatorialLinesVisible),
    azimuthalGrid: Boolean(settingsStore.stellarium.azimuthalLinesVisible),
    meridian: Boolean(settingsStore.stellarium.meridianLinesVisible),
    ecliptic: Boolean(settingsStore.stellarium.eclipticLinesVisible),
    atmosphere: Boolean(settingsStore.stellarium.atmosphereVisible),
    milkyWay: true,
    skySurvey: settingsStore.stellarium.skySurveyVisible !== false,
    constellations: Boolean(settingsStore.stellarium.constellationsLinesVisible),
    labels: true,
    starMagnitudeLimit: normalizeAtlasMagnitudeLimit(
      settingsStore.stellarium.starMagnitudeLimit,
      6.5
    ),
    galaxyMagnitudeLimit: normalizeAtlasMagnitudeLimit(
      settingsStore.stellarium.galaxyMagnitudeLimit,
      30
    ),
    deepSkyMagnitudeLimit: normalizeAtlasMagnitudeLimit(
      settingsStore.stellarium.deepSkyMagnitudeLimit,
      30
    ),
    deepSkyObjectTypes: normalizeAtlasFacetSelection(
      settingsStore.stellarium.deepSkyObjectTypes,
      catalogFacets.value.objectTypes
    ),
    deepSkyCatalogueGroups: normalizeAtlasFacetSelection(
      settingsStore.stellarium.deepSkyCatalogueGroups,
      catalogFacets.value.catalogueGroups
    ),
    deepSkyObjects: Boolean(settingsStore.stellarium.dsosVisible),
    horizon: Boolean(settingsStore.stellarium.landscapesVisible),
    hideBelowHorizon: settingsStore.stellarium.hideBelowHorizon !== false,
  });
}

function synchronizeCatalogFilterSettings() {
  const mappings = [
    ['deepSkyObjectTypes', catalogFacets.value.objectTypes],
    ['deepSkyCatalogueGroups', catalogFacets.value.catalogueGroups],
  ];

  for (const [setting, facets] of mappings) {
    const current = settingsStore.stellarium[setting];
    const normalized = normalizeAtlasFacetSelection(current, facets);
    if (JSON.stringify(current) !== JSON.stringify(normalized)) {
      settingsStore.stellarium[setting] = normalized;
    }
  }
}

function updateHorizon() {
  if (!viewer) return;
  if (horizonStore.points.length < 2) {
    viewer.setHorizon([]);
    return;
  }
  const points = interpolateHorizon(horizonStore.points, 2).map(({ az, alt }) => ({
    azimuthDeg: az,
    altitudeDeg: alt,
  }));
  points.push({ ...points[0], azimuthDeg: 360 });
  viewer.setHorizon(points);
}

function updateLandscape() {
  if (!viewer) return;
  landscapeErrorMessage.value = '';
  const protocol = settingsStore.backendProtocol || 'http';
  const host = settingsStore.connection.ip || window.location.hostname;
  const port = settingsStore.connection.port || window.location.port;
  const authority = port ? `${host}:${port}` : host;
  const baseUrl = `${protocol}://${authority}/stellarium-data/`;
  const config = resolveLandscapeSource(settingsStore.stellarium, baseUrl);
  void viewer.setLandscape(config.visible ? config.source : null);
}

function runSearch() {
  if (searchTimer !== null) clearTimeout(searchTimer);
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    searchTimer = null;
    return;
  }
  searchTimer = setTimeout(() => {
    searchResults.value = viewer?.search(searchQuery.value) ?? [];
    searchTimer = null;
  }, SEARCH_DEBOUNCE_MS);
}

function selectSearchResult(result) {
  if (searchTimer !== null) clearTimeout(searchTimer);
  searchTimer = null;
  searchResults.value = [];
  let target;
  try {
    target = atlasSearchResultToTarget(result);
  } catch (error) {
    console.warn('[Celestia Atlas] Ignored invalid search result:', error.message);
    return;
  }
  viewer.focusTarget(target);
  viewer.select(target);
}

function hideSelectedTargetDetails() {
  selectedTarget.value = null;
}

function updateVisibility() {
  if (!viewer) return;
  if (store.showStellarium && !document.hidden && !isAppBackgrounded.value) {
    viewer.resume();
    startClockDisplay();
  } else {
    viewer.pause();
    stopClockDisplay();
  }
}

function handleVisibilityChange() {
  updateVisibility();
}

watch(() => store.profileInfo?.AstrometrySettings, updateObserver, { deep: true });
watch(
  () => [
    store.profileInfo?.CameraSettings?.PixelSize,
    store.profileInfo?.TelescopeSettings?.FocalLength,
    store.profileInfo?.FramingAssistantSettings?.CameraWidth,
    store.profileInfo?.FramingAssistantSettings?.CameraHeight,
    framingStore.rotationAngle,
    framingStore.isMosaicMode,
    framingStore.mosaicCols,
    framingStore.mosaicRows,
    framingStore.mosaicOverlap,
  ],
  updateFieldOfView
);
watch(() => store.showStellarium, updateVisibility);
watch(isAppBackgrounded, updateVisibility);
watch(clockSpeedPower, (value) => {
  if (!clockPaused.value) viewer?.setTimeRate(Math.pow(2, Number(value)));
});
watch(() => store.mountInfo, updateMount, { deep: true });
watch(() => horizonStore.points, updateHorizon, { deep: true });
watch(
  () => [
    settingsStore.stellarium.landscapesVisible,
    settingsStore.stellarium.landscapeSourceMode,
    settingsStore.stellarium.customLandscapeUrl,
    settingsStore.stellarium.customLandscapeKey,
  ],
  updateLandscape
);
watch(
  () => [
    settingsStore.stellarium.equatorialLinesVisible,
    settingsStore.stellarium.azimuthalLinesVisible,
    settingsStore.stellarium.meridianLinesVisible,
    settingsStore.stellarium.eclipticLinesVisible,
    settingsStore.stellarium.atmosphereVisible,
    settingsStore.stellarium.constellationsLinesVisible,
    settingsStore.stellarium.dsosVisible,
    settingsStore.stellarium.starMagnitudeLimit,
    settingsStore.stellarium.galaxyMagnitudeLimit,
    settingsStore.stellarium.deepSkyMagnitudeLimit,
    settingsStore.stellarium.deepSkyObjectTypes,
    settingsStore.stellarium.deepSkyCatalogueGroups,
    settingsStore.stellarium.landscapesVisible,
    settingsStore.stellarium.hideBelowHorizon,
    settingsStore.stellarium.skySurveyVisible,
  ],
  updateDisplayOptions
);

onMounted(async () => {
  try {
    await nextTick();
    void store.fetchProfilInfos().catch(() => {});
    void timeSync
      .ensureSync()
      .then(() => {
        if (!disposed) viewer?.setTime(timeSync.getServerTime());
      })
      .catch(() => {});
    const [
      openNgcModule,
      abellPlanetaryNebulaeModule,
      stellariumSupplementModule,
      brightSkyModule,
      hygStarsModule,
    ] = await Promise.all([
      import('@acocalypso/celestia-atlas/viewer-catalog-data'),
      import('@acocalypso/celestia-atlas/abell-pn-data'),
      import('@acocalypso/celestia-atlas/stellarium-supplement-data'),
      import('@acocalypso/celestia-atlas/bright-sky-data'),
      import('@acocalypso/celestia-atlas/hyg-star-data'),
    ]);
    if (disposed) return;
    const { catalog, stars, constellations } = buildEmbeddedAtlasCatalog({
      openNgc: openNgcModule.default,
      abellPlanetaryNebulae: abellPlanetaryNebulaeModule.default,
      stellariumSupplement: stellariumSupplementModule.default,
      brightSky: brightSkyModule.default,
      hygStars: hygStarsModule.default,
    });
    catalogFacets.value = buildAtlasCatalogFacets(catalog);
    synchronizeCatalogFilterSettings();
    viewer = createCelestiaAtlasViewer({
      container: viewerContainer.value,
      observer: ninaObserverToAtlas(store.profileInfo.AstrometrySettings),
      utcMs: timeSync.getServerTime(),
      catalog,
      stars,
      constellations,
      onSelect: (target) => {
        selectedTarget.value = target;
      },
      onViewChange: queueViewPersistence,
      onError: (error) => {
        console.warn('[Celestia Atlas] Landscape unavailable:', error.message);
        landscapeErrorMessage.value = t(
          'components.stellarium.settings.landscape_list_load_failed'
        );
      },
    });
    viewer.setCoordinateMode('horizontal');
    const savedView = sessionStorage.getItem(VIEW_STATE_KEY);
    if (savedView) {
      try {
        viewer.setView(JSON.parse(savedView));
      } catch (error) {
        sessionStorage.removeItem(VIEW_STATE_KEY);
        console.warn('[Celestia Atlas] Ignored invalid saved view:', error.message);
      }
    }
    updateFieldOfView();
    updateMount();
    updateDisplayOptions();
    updateHorizon();
    updateLandscape();
    updateVisibility();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    ready.value = true;
  } catch (error) {
    if (!disposed) errorMessage.value = error instanceof Error ? error.message : String(error);
  }
});

onBeforeUnmount(() => {
  disposed = true;
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  if (viewSaveTimer !== null) clearTimeout(viewSaveTimer);
  if (searchTimer !== null) clearTimeout(searchTimer);
  if (pendingViewState) sessionStorage.setItem(VIEW_STATE_KEY, JSON.stringify(pendingViewState));
  stopClockDisplay();
  viewer?.destroy();
  viewer = null;
});
</script>

<style scoped>
.celestia-atlas-container {
  position: fixed;
  z-index: 1;
}
.celestia-atlas-viewer {
  width: 100%;
  height: 100%;
  background: #03060d;
}
:deep(.celestia-atlas-survey-credit) {
  z-index: 2 !important;
  top: calc(0.75rem + env(safe-area-inset-top, 0px)) !important;
  right: calc(0.75rem + env(safe-area-inset-right, 0px)) !important;
  bottom: auto !important;
  max-width: calc(
    100% - 1.5rem - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)
  ) !important;
  text-align: right;
  white-space: normal;
}
.celestia-atlas-landscape {
  top: 0;
  left: 8rem;
  width: calc(100vw - 8rem);
  height: calc(100dvh - 2rem - env(safe-area-inset-bottom, 0px));
}
.celestia-atlas-portrait {
  top: 5rem;
  left: 0;
  width: 100vw;
  height: calc(100dvh - 6.5rem - env(safe-area-inset-bottom, 0px));
}
.celestia-atlas-loading,
.celestia-atlas-error {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  color: white;
  background: #03060d;
}
.celestia-atlas-landscape-error {
  position: absolute;
  left: 50%;
  bottom: 4.5rem;
  transform: translateX(-50%);
  max-width: min(90%, 32rem);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: rgba(120, 53, 15, 0.9);
  color: white;
  z-index: 20;
}
.celestia-atlas-error {
  color: #fca5a5;
}
.celestia-atlas-search {
  position: absolute;
  z-index: 3;
  top: calc(1rem + env(safe-area-inset-top, 0px));
  right: calc(1rem + env(safe-area-inset-right, 0px));
  width: min(24rem, calc(100% - 2rem));
}
.celestia-atlas-results {
  max-height: 20rem;
  overflow-y: auto;
}
.celestia-atlas-controls {
  position: absolute;
  z-index: 4;
  right: calc(1rem + env(safe-area-inset-right, 0px));
  bottom: 2.5rem;
  display: flex;
  gap: 0.5rem;
  padding: 0.4rem;
  color: white;
  background: rgb(0 0 0 / 85%);
  border-radius: 9999px;
}
.celestia-atlas-mount-controls {
  position: absolute;
  z-index: 3;
  left: calc(1rem + env(safe-area-inset-left, 0px));
  bottom: 2.5rem;
  display: flex;
  gap: 0.5rem;
  color: white;
}
.celestia-atlas-clock {
  position: absolute;
  z-index: 3;
  left: 50%;
  bottom: 2.5rem;
  color: white;
  transform: translateX(-50%);
}
.celestia-atlas-clock-panel {
  position: absolute;
  bottom: 3.5rem;
  left: 50%;
  display: grid;
  gap: 0.6rem;
  width: min(22rem, calc(100vw - 2rem));
  padding: 0.8rem;
  color: white;
  background: rgb(3 7 18 / 95%);
  border: 1px solid rgb(8 145 178);
  border-radius: 0.75rem;
  transform: translateX(-50%);
}
.celestia-atlas-clock-panel label {
  display: grid;
  gap: 0.25rem;
}
</style>
