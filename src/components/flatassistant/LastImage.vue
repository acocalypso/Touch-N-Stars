<template>
  <div>
    <img v-if="imagetStore.imageData" :src="displayImageData" alt="Flat Image" />
    <FlatHistogram v-if="store.isPINS" />
    <HistogramChart
      v-if="imagetStore.imageData && store.isPINS"
      :data="getHistogram()"
      :blackPoint="getStretchSettings().blackPoint"
      :midPoint="getStretchSettings().midPoint"
      :whitePoint="getStretchSettings().whitePoint"
      :statistics="null"
      :saveEnabled="true"
      :showReset="true"
      @levels-changed="onLevelsChanged"
      @levels-reset="onLevelsReset"
    />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useImagetStore } from '@/store/imageStore';
import { useHistogramStore } from '@/store/histogramStore';
import { apiStore } from '@/store/store';
import FlatHistogram from './FlatHistogram.vue';
import HistogramChart from '@/components/helpers/HistogramChart.vue';

const imagetStore = useImagetStore();
const histogramStore = useHistogramStore();
const store = apiStore();

const displayImageData = computed(() => {
  if (!imagetStore.imageData) return null;
  return (
    histogramStore.getStretchSettings(imagetStore.imageData).stretchedImageData ||
    imagetStore.imageData
  );
});

const getHistogram = () => {
  if (!imagetStore.imageData) return null;
  return histogramStore.getHistogram(imagetStore.imageData);
};

const getStretchSettings = () => {
  if (!imagetStore.imageData) return { blackPoint: 0, whitePoint: 255, midPoint: 127 };
  return histogramStore.getStretchSettings(imagetStore.imageData);
};

const onLevelsChanged = async ({ blackPoint, whitePoint, midPoint }) => {
  if (!imagetStore.imageData) return;
  await histogramStore.applyStretch(imagetStore.imageData, blackPoint, whitePoint, midPoint);
};

const onLevelsReset = () => {
  if (!imagetStore.imageData) return;
  histogramStore.resetStretch(imagetStore.imageData);
};

watch(
  () => imagetStore.imageData,
  (imageData) => {
    if (!imageData) return;
    histogramStore.requestHistogram(imageData).then(() => {
      if (store.isPINS && store.lastImageStats?.Histogram) {
        histogramStore.injectApiHistogram(imageData, store.lastImageStats.Histogram);
      }
    });
  },
  { immediate: true }
);

watch(
  () => store.lastImageStats,
  (newVal) => {
    if (!store.isPINS || !imagetStore.imageData || !newVal?.Histogram) return;
    histogramStore.injectApiHistogram(imagetStore.imageData, newVal.Histogram);
  }
);
</script>
