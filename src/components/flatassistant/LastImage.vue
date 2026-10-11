<template>
  <div>
    <img v-if="imagetStore.imageData" :src="displayImageData" alt="Flat Image" />
    <FlatHistogram v-if="store.isPINS" />
    <HistogramChart v-if="imagetStore.imageData" :imageUrl="imagetStore.imageData" />
  </div>
</template>

<script setup>
import { useImagetStore } from '@/store/imageStore';
import { apiStore } from '@/store/store';
import { useRawStretch } from '@/composables/useRawStretch';
import FlatHistogram from './FlatHistogram.vue';
import HistogramChart from '@/components/helpers/HistogramChart.vue';

const imagetStore = useImagetStore();
const store = apiStore();

// The histogram is always visible here, so the raw data loads with every new flat.
// imageStore releases the entry whenever it replaces imageData.
const { displayUrl: displayImageData } = useRawStretch(
  () => imagetStore.imageData,
  () => ({ kind: 'prepared' }),
  () => true
);
</script>
