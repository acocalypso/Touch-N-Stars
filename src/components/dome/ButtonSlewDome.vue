<template>
  <div class="flex flex-col border border-gray-500 p-1 pb-2 rounded-lg w-full">
    <label for="position" class="text-xs mb-1 text-gray-400">{{
      $t('components.dome.control.slew_label')
    }}</label>
    <div class="flex gap-2">
      <input
        id="azimuth"
        v-model="azimuth"
        type="number"
        class="text-black px-4 h-10 w-40 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-700"
        placeholder="1"
        step="1"
      />
      <button
        class="flex h-10 w-full min-w-28 rounded-md text-white font-medium transition-colors bg-cyan-800 items-center justify-center disabled:opacity-50"
        @click="slewDome"
        :disabled="store.domeInfo.Slewing"
      >
        <label> {{ $t('components.dome.control.slew') }}</label>
        <div
          v-if="store.domeInfo.Slewing"
          class="ml-2 w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        ></div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

const store = apiStore();
const azimuth = ref(0);

async function slewDome() {
  try {
    await apiService.domeAction(`slew?azimuth=${azimuth.value}`);
    console.log('Slewing stopped at azimuth:', azimuth.value);
  } catch (error) {
    console.log('Error stopping slew:', error);
  }
}

onMounted(() => {
  if (store.domeInfo.Azimuth !== undefined && !isNaN(store.domeInfo.Azimuth)) {
    azimuth.value = store.domeInfo.Azimuth.toFixed(1);
  } else {
    azimuth.value = 0; // Default value if Azimuth is not defined or invalid
  }
});
</script>
