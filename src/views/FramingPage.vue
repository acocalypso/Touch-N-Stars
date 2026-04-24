<template>
  <div class="framing-page relative">
    <div class="framing-stage-wrapper absolute inset-0 flex items-center justify-center">
      <Suspense>
        <template #default>
          <FramingAssitantImg :key="framingStore.framingReloadKey" />
        </template>
        <template #fallback>
          <div class="text-gray-300 p-4">{{ $t('common.loading') }}</div>
        </template>
      </Suspense>
    </div>

    <div
      class="controls-overlay absolute bottom-2 left-1/2 -translate-x-1/2 flex-col w-[min(100%,26rem)] space-y-2 bg-gray-900/80 border border-gray-700 rounded-lg shadow-lg p-3 backdrop-blur-sm"
    >
      <!-- Target-Suche + Favoriten + Plate-Solve -->
      <div class="flex items-start gap-2">
        <div class="relative flex-1">
          <input
            v-model="searchQuery"
            type="text"
            class="default-input h-9 w-full text-sm"
            :placeholder="$t('components.framing.search.placeholder')"
            @input="fetchTargetSearch"
          />
          <ul
            v-if="Array.isArray(searchResults) && searchResults.length > 0"
            class="default-select absolute left-0 right-0 bottom-full mb-1 max-h-64 overflow-y-auto z-10"
          >
            <li
              v-for="(item, index) in searchResults"
              :key="index"
              class="p-2 text-sm hover:bg-blue-800 cursor-pointer"
              @click="selectTarget(item)"
            >
              {{ item.Name }}
              <span v-if="item['Common names']"> ({{ item['Common names'] }})</span>
              <span v-if="item['M']"> (M {{ item['M'] }})</span>
            </li>
          </ul>
        </div>
        <FavTargets :showFramning="true" :showSeqTarget="false" />
        <FitsPlateSolve
          v-if="
            appStore.isPINS ||
            appStore.checkVersionNewerOrEqual(appStore.currentTnsPluginVersion, '1.2.7.0')
          "
          :showFraming="false"
          :showSeqTarget="false"
        />
      </div>

      <MosaicControls />
      <div class="col-span-2">
        <getImageRotation />
      </div>
      <ButtonSlewCenterRotate
        class="w-full"
        :raAngle="framingStore.RAangle"
        :decAngle="framingStore.DECangle"
      />
      <div class="flex gap-2">
        <setSequenceTarget v-if="!framingStore.isMosaicMode" class="flex-1" />
        <SaveFavTargets
          v-if="framingStore.selectedItem"
          :class="{ 'flex-1': framingStore.isMosaicMode }"
          :show-label="framingStore.isMosaicMode"
          :name="framingStore.selectedItem?.Name"
          :ra="framingStore.RAangle"
          :dec="framingStore.DECangle"
          :ra-string="framingStore.RAangleString"
          :dec-string="framingStore.DECangleString"
          :rotation="framingStore.rotationAngle"
          :mosaic-cols="framingStore.isMosaicMode ? framingStore.mosaicCols : null"
          :mosaic-rows="framingStore.isMosaicMode ? framingStore.mosaicRows : null"
          :mosaic-overlap="framingStore.isMosaicMode ? framingStore.mosaicOverlap : null"
          :mosaic-preserve-alignment="
            framingStore.isMosaicMode ? framingStore.mosaicPreserveAlignment : null
          "
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent, ref, watch } from 'vue';
import { useFramingStore } from '@/store/framingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import { raDecToAltAz, degreesToHMS, degreesToDMS } from '@/utils/utils';
import getImageRotation from '@/components/framing/getImageRotation.vue';
import ButtonSlewCenterRotate from '@/components/mount/ButtonSlewCenterRotate.vue';
import setSequenceTarget from '@/components/framing/setSequenceTarget.vue';
import MosaicControls from '@/components/framing/MosaicControls.vue';
import SaveFavTargets from '@/components/favTargets/SaveFavTargets.vue';
import FavTargets from '@/components/favTargets/FavTargets.vue';
import FitsPlateSolve from '@/components/fitsPlatesolve/FitsPlateSolve.vue';

const framingStore = useFramingStore();
const settingsStore = useSettingsStore();
const appStore = apiStore();

const FramingAssitantImg = defineAsyncComponent(
  () => import('@/components/framing/FramingAssitantImg.vue')
);

const searchQuery = ref('');
const searchResults = ref([]);

async function fetchTargetSearch() {
  if (searchQuery.value.trim() === '') {
    searchResults.value = [];
    return;
  }
  try {
    const data = await apiService.searchNGC(searchQuery.value, 50);
    searchResults.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    searchResults.value = [];
  }
}

function selectTarget(item) {
  searchQuery.value = item.Name || '';
  searchResults.value = [];

  framingStore.selectedItem = item;
  framingStore.RAangle = item.RA;
  framingStore.DECangle = item.Dec;
  framingStore.RAangleString = degreesToHMS(item.RA);
  framingStore.DECangleString = degreesToDMS(item.Dec);

  const { altitude, azimuth } = raDecToAltAz(
    item.RA,
    item.Dec,
    settingsStore.coordinates.latitude,
    settingsStore.coordinates.longitude
  );
  framingStore.ALTangle = altitude;
  framingStore.AZangle = azimuth;
  framingStore.ALTangleString = altitude.toFixed(3);
  framingStore.AZangleString = azimuth.toFixed(3);

  // Bild neu laden mit neuen Koordinaten
  framingStore.framingReloadKey++;
}

watch(
  () => framingStore.fov,
  (newFov) => {
    if (newFov < 0.1) framingStore.fov = 0.1;
    if (newFov > 180) framingStore.fov = 180;
  }
);
</script>

<style scoped>
.framing-page {
  /* Fullscreen: Page bricht aus dem `container mx-auto` der App aus und
     nutzt den gesamten Viewport zwischen Top-Navbar (Portrait) bzw.
     Side-Navbar (Landscape) und Status-Bar. Das Targetbild kann so die
     volle verfügbare Fläche rechteckig ausfüllen. */
  position: fixed;
  top: 82px;
  left: 0;
  right: 0;
  bottom: calc(2.25rem + env(safe-area-inset-bottom) + 0.5rem);
  z-index: 10;
}

/* Controls-Panel über die Moveable-Handles legen — vue3-moveable rendert
   seine Drag-/Rotate-Griffe mit hohem z-index (bis ~3000). */
.controls-overlay {
  z-index: 9999;
}

@media (orientation: landscape) {
  .framing-page {
    top: 0;
    left: 8rem;
    right: 1rem;
    bottom: 4rem;
  }
}
</style>
