<template>
  <NumberInputPicker
    v-model="histogramMeanPercentage"
    :label="$t('components.flatassistant.histogram_mean_target')"
    labelKey="components.flatassistant.histogram_mean_target"
    :min="0"
    :max="100"
    :step="1"
    :decimalPlaces="0"
    inputId="histogram-mean-target"
  />
</template>
<script setup>
import { computed, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import { useFlatassistantStore } from '@/store/flatassistantStore';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const store = apiStore();
const flatsStore = useFlatassistantStore();

const histogramMeanPercentage = computed({
  get: () => Math.round(flatsStore.histogramMean * 100),
  set: (value) => {
    flatsStore.histogramMean = value / 100;
  },
});

onMounted(() => {
  flatsStore.histogramMean = store.profileInfo?.FlatWizardSettings?.HistogramMeanTarget ?? 0;
});
</script>
