<template>
  <button
    class="btn-primary bg-gradient-to-br w-full from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
    :disabled="
      store.guiderInfo.State == 'Guiding' || store.guiderInfo.State == 'Calibrating' || isProcessing
    "
    @click="guiderStartStop('start')"
  >
    <span class="flex items-center justify-center space-x-2">
      <span class="relative flex items-center">
        <template v-if="!isProcessingStart">{{ $t('components.guider.start') }}</template>
        <template v-else>
          <span class="mr-2">{{ $t('components.guider.running') }}</span>
          <span class="absolute -right-5 flex h-3 w-3">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-200 opacity-75"
            ></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
          </span>
        </template>
      </span>
      <svg
        v-if="store.guiderInfo.State == 'Guiding'"
        class="animate-spin h-5 w-5 text-white ml-2"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </span>
  </button>
  <button
    class="btn-primary bg-gradient-to-br w-full from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
    :disabled="
      store.guiderInfo.State == 'Guiding' || store.guiderInfo.State == 'Calibrating' 
    "
    @click="guiderStartWithCal()"
  >
    <span class="flex items-center justify-center space-x-2">
      <span class="relative flex items-center">
        <template v-if="!isProcessingStartWithCal">{{
          $t('components.guider.startWithCal')
        }}</template>
        <template v-else>
          <span class="mr-2">{{ $t('components.guider.running') }}</span>
          <span class="absolute -right-5 flex h-3 w-3">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-200 opacity-75"
            ></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
          </span>
        </template>
      </span>
      <svg
        v-if="store.guiderInfo.State == 'Calibrating'"
        class="animate-spin h-5 w-5 text-white ml-2"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </span>
  </button>
  <button
    class="btn-primary bg-gradient-to-br w-full from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
    :disabled="store.guiderInfo.State !== 'Guiding' && store.guiderInfo.State !== 'Calibrating'"
    @click="guiderStartStop('stop')"
  >
    {{ $t('components.guider.stop') }}
  </button>
</template>
<script setup>
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

import { ref } from 'vue';
const store = apiStore();
const isProcessingStart = ref(false);
const isProcessingStartWithCal = ref(false);

async function guiderStartStop(befehl) {
  isProcessingStart.value = true;
  try {
    await apiService.guiderAction(befehl);
    await store.getGuiderInfo();
    await store.getGuiderChartInfo(); // Refresh chart data
    console.log('Guider Command:', befehl);
  } catch (error) {
    console.error('Fehler:', error.response?.data || error);
  } finally {
    isProcessingStart.value = false;
  }
}

async function guiderStartWithCal() {
  isProcessingStartWithCal.value = true;
  try {
    await apiService.guiderStart(true);
    await store.getGuiderInfo(); // Single refresh call
    await store.getGuiderChartInfo();
    console.log('Guider Command: Start with cal');
  } catch (error) {
    console.error('Fehler:', error.response?.data || error);
  } finally {
    isProcessingStartWithCal.value = false;
  }
}
</script>
