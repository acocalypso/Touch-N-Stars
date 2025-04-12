<template>
  <div class="flex flex-col border border-gray-500 p-1 pb-2 rounded-lg w-full">
    <label for="position" class="text-xs mb-1 text-gray-400">{{
      $t('components.dome.control.slew_label')
    }}</label>
    <div class="flex gap-2">
      <input
        id="azimuth"
        v-model.number="azimuth"
        type="number"
        class="text-black px-4 h-10 w-40 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-700"
        placeholder="1"
        step="1"
      />
      <button
        class="flex h-10 w-full min-w-28 rounded-md text-white font-medium transition-colors bg-cyan-900 items-center justify-center disabled:opacity-50"
        @click="slewDome"
        :disabled="store.domeInfo.Slewing || isSlewing"
      >
        <label> {{ $t('components.dome.control.slew') }}</label>
        <div
          v-if="store.domeInfo.Slewing || isSlewing"
          class="ml-2 w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        ></div>
      </button>
      <button
        @click="stopSlew"
        class="bg-red-900 rounded-md flex items-center justify-center w-16 mr-1"
        :class="statusClass"
      >
        <StopCircleIcon class="w-8 h-8" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { handleApiError } from '@/utils/utils';
import { useI18n } from 'vue-i18n';
import { StopCircleIcon } from '@heroicons/vue/24/outline';

const { t } = useI18n();
const store = apiStore();
const azimuth = ref(0);
const isSlewing = ref(false);
const statusClass = ref('');

async function slewDome() {
  isSlewing.value = true;
  try {
    await apiService.domeAction(`slew?waitToFinish=true&azimuth=${azimuth.value}`);
    isSlewing.value = false;
    statusClass.value = 'glow-green';
    if (store.domeInfo.Azimuth.toFixed(0) === azimuth.value.toFixed(0)) {
      console.log('Slewing to the same azimuth, stopping slew.');
      isSlewing.value = false;
    } else {
      console.log('Slewing to azimuth:', azimuth.value);
    }
  } catch (error) {
    isSlewing.value = false;
    console.error('Error stopping slew:', error);
  }
  setTimeout(() => {
    statusClass.value = '';
  }, 1000);
}

async function stopSlew() {
  try {
    const response = await apiService.domeAction('stop');
    if (handleApiError(response, { title: t('components.dome.control.errors.stop_slew') })) return;
    isSlewing.value = false;
    statusClass.value = 'glow-green';
    console.log('Stopping slew:', response);
  } catch (error) {
    console.log(t('components.dome.control.errors.stop_slew'));
  }
  setTimeout(() => {
    statusClass.value = '';
  }, 1000);
}

onMounted(() => {
  if (store.domeInfo.Azimuth !== undefined && !isNaN(store.domeInfo.Azimuth)) {
    azimuth.value = store.domeInfo.Azimuth.toFixed(1);
  } else {
    azimuth.value = 0; // Default value if Azimuth is not defined or invalid
  }
});
</script>

<style scoped></style>
<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00; /* Grüner Schein */
}
</style>
