<template>
  <div class="framing-page flex flex-col items-center">
    <div class="framing-stage-wrapper w-full flex-1 min-h-0 flex items-center justify-center">
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
      class="flex-shrink-0 flex-col w-full max-w-3xl space-y-2 mt-3 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-3"
    >
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
import { defineAsyncComponent, watch } from 'vue';
import { useFramingStore } from '@/store/framingStore';
import getImageRotation from '@/components/framing/getImageRotation.vue';
import ButtonSlewCenterRotate from '@/components/mount/ButtonSlewCenterRotate.vue';
import setSequenceTarget from '@/components/framing/setSequenceTarget.vue';
import MosaicControls from '@/components/framing/MosaicControls.vue';
import SaveFavTargets from '@/components/favTargets/SaveFavTargets.vue';

const framingStore = useFramingStore();

const FramingAssitantImg = defineAsyncComponent(
  () => import('@/components/framing/FramingAssitantImg.vue')
);

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
  /* Seite füllt den Content-Bereich zwischen Top-Navbar (Portrait ~82px) bzw.
     Side-Navbar (Landscape) und Status-Bar. So bekommt die Stage via flex-1
     die maximal mögliche Höhe, die FramingAssitantImg.vue dann quadratisch
     via ResizeObserver messen kann. */
  min-height: calc(100vh - 10rem);
}

@media (orientation: landscape) {
  .framing-page {
    min-height: calc(100vh - 5rem);
  }
}

.framing-stage-wrapper {
  min-height: 280px;
}
</style>
