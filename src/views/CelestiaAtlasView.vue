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
    <section v-if="selectedTarget" class="celestia-atlas-selection">
      <strong>{{ t('components.stellarium.selected_object.title') }}</strong>
      <span>{{ selectedTarget.name }}</span>
      <span
        >{{ t('components.stellarium.selected_object.ra') }}:
        {{ selectedTarget.coordinates.raDeg.toFixed(5) }}°</span
      >
      <span
        >{{ t('components.stellarium.selected_object.dec') }}:
        {{ selectedTarget.coordinates.decDeg.toFixed(5) }}°</span
      >
      <button class="default-button-cyan" type="button" @click="sendSelectionToFraming">
        {{ t('components.stellarium.selected_object.button_framing') }}
      </button>
    </section>
    <div v-if="errorMessage" class="celestia-atlas-error" role="alert">
      {{ errorMessage }}
    </div>
    <div v-else-if="!ready" class="celestia-atlas-loading">
      {{ t('components.stellarium.loading') }}
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createCelestiaAtlasViewer } from '@acocalypso/celestia-atlas';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useOrientation } from '@/composables/useOrientation';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { computeCameraFovDeg } from '@/utils/fovGeometry';
import {
  atlasSelectionToFraming,
  ninaMountToAtlas,
  ninaObserverToAtlas,
} from '@/integrations/celestiaAtlas/contracts';
import { timeSync } from '@/utils/timeSync';
import { degreesToDMS, degreesToHMS } from '@/utils/utils';
import { useHorizonStore } from '@/plugins/horizon-creator/store/horizonStore';
import { interpolateHorizon } from '@/plugins/horizon-creator/utils/horizon-utils';
import { isAppBackgrounded } from '@/utils/appLifecycle';

const store = apiStore();
const framingStore = useFramingStore();
const settingsStore = useSettingsStore();
const horizonStore = useHorizonStore();
const { t } = useI18n();
const router = useRouter();
const { isLandscape } = useOrientation();
const viewerContainer = ref(null);
const ready = ref(false);
const errorMessage = ref('');
const searchQuery = ref('');
const searchResults = ref([]);
const selectedTarget = ref(null);
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
const VIEW_STATE_KEY = 'tns.celestia-atlas.view';

const containerClasses = computed(() => ({
  'celestia-atlas-portrait': !isLandscape.value,
  'celestia-atlas-landscape': isLandscape.value,
}));

function updateObserver() {
  if (!viewer || !store.profileInfo?.AstrometrySettings) return;
  viewer.setObserver(ninaObserverToAtlas(store.profileInfo.AstrometrySettings));
}

function updateFieldOfView() {
  if (!viewer) return;
  const profile = store.profileInfo;
  const fov = computeCameraFovDeg({
    pixelSizeMicrons: profile?.CameraSettings?.PixelSize,
    focalLengthMm: profile?.TelescopeSettings?.FocalLength,
    sensorWidthPx: profile?.FramingAssistantSettings?.CameraWidth,
    sensorHeightPx: profile?.FramingAssistantSettings?.CameraHeight,
  });
  if (!fov.fovX || !fov.fovY) {
    viewer.setFieldOfView(null);
    return;
  }
  viewer.setFieldOfView({
    widthDeg: fov.fovX,
    heightDeg: fov.fovY,
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
    constellations: Boolean(settingsStore.stellarium.constellationsLinesVisible),
    labels: true,
    deepSkyObjects: Boolean(settingsStore.stellarium.dsosVisible),
    horizon: Boolean(settingsStore.stellarium.landscapesVisible),
  });
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

function runSearch() {
  searchResults.value = viewer?.search(searchQuery.value) ?? [];
}

function selectSearchResult(result) {
  const target = {
    id: result.id,
    name: result.name || result.id,
    aliases: result.aliases,
    objectType: result.type,
    magnitude: result.mag,
    catalogueSource: result.catalogSource,
    coordinates: { raDeg: result.raDeg, decDeg: result.decDeg, frame: result.frame || 'ICRS' },
  };
  searchResults.value = [];
  viewer.focusTarget(target);
  viewer.select(target);
}

function sendSelectionToFraming() {
  const target = atlasSelectionToFraming(selectedTarget.value);
  framingStore.RAangle = target.RA;
  framingStore.DECangle = target.Dec;
  framingStore.RAangleString = degreesToHMS(target.RA);
  framingStore.DECangleString = degreesToDMS(target.Dec);
  framingStore.selectedItem = target;
  store.mount.currentTab = 'showSlew';
  router.push('/mount');
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
    settingsStore.stellarium.equatorialLinesVisible,
    settingsStore.stellarium.azimuthalLinesVisible,
    settingsStore.stellarium.meridianLinesVisible,
    settingsStore.stellarium.eclipticLinesVisible,
    settingsStore.stellarium.atmosphereVisible,
    settingsStore.stellarium.constellationsLinesVisible,
    settingsStore.stellarium.dsosVisible,
    settingsStore.stellarium.landscapesVisible,
  ],
  updateDisplayOptions
);

onMounted(async () => {
  try {
    await store.fetchProfilInfos();
    await timeSync.ensureSync();
    await nextTick();
    const [catalogModule, brightSkyModule] = await Promise.all([
      import('@acocalypso/celestia-atlas/catalog-data'),
      import('@acocalypso/celestia-atlas/bright-sky-data'),
    ]);
    const catalog = catalogModule.default.objects.map((object) => ({
      ...object,
      // OpenNGC stores RA as decimal hours. Conversion happens exactly once at
      // this explicit adapter boundary; engine catalogue coordinates are degrees.
      raDeg: object.ra * 15,
      decDeg: object.dec,
      frame: 'ICRS',
    }));
    viewer = createCelestiaAtlasViewer({
      container: viewerContainer.value,
      observer: ninaObserverToAtlas(store.profileInfo.AstrometrySettings),
      utcMs: timeSync.getServerTime(),
      catalog,
      stars: brightSkyModule.default.stars,
      constellations: brightSkyModule.default.constellations,
      onSelect: (target) => {
        selectedTarget.value = target;
      },
      onViewChange: queueViewPersistence,
    });
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
    updateVisibility();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    ready.value = true;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  if (viewSaveTimer !== null) clearTimeout(viewSaveTimer);
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
  top: 0;
}
.celestia-atlas-viewer {
  width: 100%;
  height: 100%;
  background: #03060d;
}
.celestia-atlas-landscape {
  left: 8rem;
  width: calc(100vw - 8rem);
  height: calc(100dvh - 2rem - env(safe-area-inset-bottom, 0px));
}
.celestia-atlas-portrait {
  left: 0;
  width: 100vw;
  height: calc(100dvh - 1.5rem - env(safe-area-inset-bottom, 0px));
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
.celestia-atlas-error {
  color: #fca5a5;
}
.celestia-atlas-search {
  position: absolute;
  z-index: 3;
  top: 1rem;
  right: 1rem;
  width: min(24rem, calc(100% - 2rem));
}
.celestia-atlas-results {
  max-height: 20rem;
  overflow-y: auto;
}
.celestia-atlas-selection {
  position: absolute;
  z-index: 3;
  right: 1rem;
  bottom: 2.5rem;
  display: grid;
  gap: 0.4rem;
  width: min(22rem, calc(100% - 2rem));
  padding: 0.8rem;
  color: white;
  background: rgb(17 24 39 / 92%);
  border: 1px solid rgb(8 145 178);
  border-radius: 0.75rem;
}
.celestia-atlas-mount-controls {
  position: absolute;
  z-index: 3;
  left: 1rem;
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
