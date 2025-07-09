<template>
  <div class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg">
    <label for="count" class="text-sm mr-3 mb-1 text-gray-400">
      {{ $t('components.flatassistant.mean_tolerance') }}
    </label>
    <input
      id="count"
      v-model.number="meanTolerancePercentage"
      type="number"
      class="default-input ml-auto h-8 w-28"
    />
  </div>
</template>
<script setup>
import { computed, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import { useFlatassistantStore } from '@/store/flatassistantStore';

const store = apiStore();
const flatsStore = useFlatassistantStore();

// Computed Property für Prozentwerte
const meanTolerancePercentage = computed({
  get: () => Math.round(flatsStore.meanTolerance * 100), // Umwandlung in Prozent
  set: (value) => {
    flatsStore.meanTolerance = value / 100; // Rückumwandlung in Dezimalzahl
  },
});

onMounted(() => {
  flatsStore.meanTolerance = store.profileInfo.FlatWizardSettings.HistogramTolerance;
});
</script>
