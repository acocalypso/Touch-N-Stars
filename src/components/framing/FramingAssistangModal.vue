<template>
  <div class="flex flex-col items-center justify-center relative">
    <!-- X Button zum Schließen (oben rechts am Modal) -->
    <button
      @click="framingStore.showFramingModal = false"
      class="sticky top-2 left-full -ml-10 z-50 w-8 h-8 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 hover:border-red-500 rounded-full text-gray-400 hover:text-red-400 transition-all duration-200 flex items-center justify-center shadow-lg"
    >
      <XMarkIcon class="w-5 h-5" />
    </button>

    <!-- Framing-Komponente ohne Key (bleibt persistent) -->
    <Suspense>
      <template #default>
        <component :is="currentComponent" />
      </template>

      <template #fallback>
        <div>Lade Komponente...</div>
      </template>
    </Suspense>

    <!-- Kontrollen bleiben immer sichtbar -->
    <div
      class="flex-col w-full space-y-2 mt-4 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
    >
      <!-- Mosaic controls -->
      <MosaicControls />
      <!-- getImageRotation Komponente -->
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
import { ref, computed, defineAsyncComponent, watch } from 'vue';
import { useFramingStore } from '@/store/framingStore';
import getImageRotation from '@/components/framing/getImageRotation.vue';
import ButtonSlewCenterRotate from '../mount/ButtonSlewCenterRotate.vue';
import setSequenceTarget from './setSequenceTarget.vue';
import MosaicControls from './MosaicControls.vue';
import SaveFavTargets from '@/components/favTargets/SaveFavTargets.vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

const framingStore = useFramingStore();
const showFraming = ref(true);

// Asynchrone Definition der Komponente über defineAsyncComponent:
const AsyncFramingTest = defineAsyncComponent(
  () => import('@/components/framing/FramingAssitantImg.vue')
);

const currentComponent = computed(() => {
  return showFraming.value ? AsyncFramingTest : null;
});

// Nur FOV-Validierung ohne Reload
watch(
  () => framingStore.fov,
  (newFov) => {
    if (newFov < 0.1) {
      framingStore.fov = 0.1;
    }
    if (newFov > 180) {
      framingStore.fov = 180;
    }
  }
);
</script>
