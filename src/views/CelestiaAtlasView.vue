<template>
  <div class="celestia-atlas-container" :class="containerClasses">
    <div ref="viewerContainer" class="celestia-atlas-viewer" />
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
import { useOrientation } from '@/composables/useOrientation';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { computeCameraFovDeg } from '@/utils/fovGeometry';
import { ninaObserverToAtlas } from '@/integrations/celestiaAtlas/contracts';
import { timeSync } from '@/utils/timeSync';

const store = apiStore();
const framingStore = useFramingStore();
const { t } = useI18n();
const { isLandscape } = useOrientation();
const viewerContainer = ref(null);
const ready = ref(false);
const errorMessage = ref('');
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

onMounted(async () => {
  try {
    await store.fetchProfilInfos();
    await timeSync.ensureSync();
    await nextTick();
    const catalogModule = await import('@acocalypso/celestia-atlas/catalog-data');
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
    });
    updateFieldOfView();
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
</style>
