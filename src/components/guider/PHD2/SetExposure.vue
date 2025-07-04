<template>
  <div class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg">
    <label for="binning" class="text-sm sm:text-xs mr-3 mb-1 text-gray-200">
      {{ $t('components.guider.phd2.Exposuretime') }}
    </label>
    <select
      v-model="exposureTime"
      class="ml-auto text-black px-3 h-8 w-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-700"
      @change="setExposureTime"
    >
      <option v-for="option in exposureOptions" :key="option" :value="option">
        {{ option }} s
      </option>
    </select>
  </div>
</template>

<script setup>
import apiService from '@/services/apiService';
import { onMounted, ref } from 'vue';

const exposureTime = ref();
const exposureOptions = [
  0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 15,
];

async function setExposureTime() {
  const msValue = exposureTime.value * 1000;
  await apiService.setPHD2Exposure(msValue);
}

onMounted(async () => {
  const response = await apiService.getPhd2Exposure();
  exposureTime.value = response.Response.Exposure / 1000;
  console.log(response.Response.Exposure);
});
</script>
