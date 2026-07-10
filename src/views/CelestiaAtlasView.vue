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
let viewer = null;

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
  });
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
  if (store.showStellarium && !document.hidden) viewer.resume();
  else viewer.pause();
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
  ],
  updateFieldOfView
);
watch(() => store.showStellarium, updateVisibility);
watch(() => store.mountInfo, updateMount, { deep: true });
watch(() => horizonStore.points, updateHorizon, { deep: true });
watch(
  () => [
    settingsStore.stellarium.equatorialLinesVisible,
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
    });
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
</style>
