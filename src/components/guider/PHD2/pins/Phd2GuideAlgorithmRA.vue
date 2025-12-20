<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <label for="guide-algorithm-ra" class="text-sm sm:text-xs mr-3 mb-1 text-gray-200">
      {{ $t('components.guider.phd2.guideAlgorithmRA') }}
    </label>
    <select
      id="guide-algorithm-ra"
      v-model="guiderStore.phd2GuideAlgorithmRA"
      @change="onAlgorithmChange"
      class="default-select h-8 w-32 ml-auto"
      :disabled="guiderStore.phd2GuideAlgorithmRALoading"
    >
      <option v-for="algorithm in algorithms" :key="algorithm" :value="algorithm">
        {{ algorithm }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGuiderStore } from '@/store/guiderStore';
import { apiStore } from '@/store/store';

const store = apiStore();
const guiderStore = useGuiderStore();

const algorithms = [
  'None',
  'Hysteresis',
  'Lowpass',
  'Lowpass2',
  'Resist Switch',
  'Predictive PEC',
  'ZFilter',
];

onMounted(async () => {
  await guiderStore.fetchPHD2GuideAlgorithmRA();
});

const onAlgorithmChange = async () => {
  const previousValue = guiderStore.phd2GuideAlgorithmRA;
  try {
    await guiderStore.setPHD2GuideAlgorithmRA(guiderStore.phd2GuideAlgorithmRA);
    console.log('Guide algorithm RA changed to:', guiderStore.phd2GuideAlgorithmRA);
  } catch (error) {
    console.error('Error changing guide algorithm RA:', error);
    // Bei Fehler zum vorherigen Wert zurückkehren
    guiderStore.phd2GuideAlgorithmRA = previousValue;
  }
};
</script>
