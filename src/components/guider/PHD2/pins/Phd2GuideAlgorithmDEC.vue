<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <label for="guide-algorithm-dec" class="text-sm sm:text-xs mr-3 mb-1 text-gray-200">
      {{ $t('components.guider.phd2.guideAlgorithmDEC') }}
    </label>
    <select
      id="guide-algorithm-dec"
      v-model="guiderStore.phd2GuideAlgorithmDEC"
      @change="onAlgorithmChange"
      class="default-select h-8 w-32 ml-auto"
      :disabled="guiderStore.phd2GuideAlgorithmDECLoading"
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

const algorithms = ['None', 'Hysteresis', 'Lowpass', 'Lowpass2', 'Resist Switch'];

onMounted(async () => {
  await guiderStore.fetchPHD2GuideAlgorithmDEC();
});

const onAlgorithmChange = async () => {
  const previousValue = guiderStore.phd2GuideAlgorithmDEC;
  try {
    await guiderStore.setPHD2GuideAlgorithmDEC(guiderStore.phd2GuideAlgorithmDEC);
    console.log('Guide algorithm DEC changed to:', guiderStore.phd2GuideAlgorithmDEC);
  } catch (error) {
    console.error('Error changing guide algorithm DEC:', error);
    // Bei Fehler zum vorherigen Wert zurückkehren
    guiderStore.phd2GuideAlgorithmDEC = previousValue;
  }
};
</script>
