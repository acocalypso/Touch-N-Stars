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
        :class="statusClass"
        @click="slewDome"
        :disabled="store.domeInfo.Slewing || isSlewing"
      >
        <label> {{ $t('components.dome.control.slew') }}</label>
        <div
          v-if="store.domeInfo.Slewing || isSlewing"
          class="ml-2 w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        ></div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useErrorStore } from '@/store/errorStore';

const store = apiStore();
const errorStore = useErrorStore();
const azimuth = ref(0);
const isSlewing = ref(false);
const statusClass = ref('');

async function slewDome() {
  try {
    const response = await apiService.domeAction(`slew?azimuth=${azimuth.value}`);
    console.log('Slew response:', response);
    if (response.StatusCode !== 200) {
     console.log('Error in slew response:', response);
     errorStore.isError = true;
      errorStore.errorTitle = 'Slew Error';
      errorStore.errorMessage = response.Error || 'Unknown error occurred.';
     statusClass.value = 'glow-red';
    } else {
 
    isSlewing.value = true;
    if (store.domeInfo.Azimuth.toFixed(0) === azimuth.value.toFixed(0)) {
      console.log('Slewing to the same azimuth, stopping slew.');
      isSlewing.value = false;
    } else {
      console.log('Slewing to azimuth:', azimuth.value);
    }
  }
  } catch (error) {
    isSlewing.value = false;
    console.log('Error stopping slew:', error);
  }
  setTimeout(() => {
    statusClass.value = '';
  }, 1000);
}

watch(
  () => store.domeInfo.Azimuth,
  (newValue) => {
    if (newValue.toFixed(0) === azimuth.value.toFixed(0)) {
      console.log('Slewing to the same azimuth, stopping slew.');
      isSlewing.value = false;
    }
  }
);

onMounted(() => {
  if (store.domeInfo.Azimuth !== undefined && !isNaN(store.domeInfo.Azimuth)) {
    azimuth.value = store.domeInfo.Azimuth.toFixed(1);
  } else {
    azimuth.value = 0; // Default value if Azimuth is not defined or invalid
  }
});
</script>

<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00; /* Grüner Schein */
}
.glow-red {
  box-shadow: 0 0 10px rgb(255, 0, 0); /* Roter Schein */
}
</style>
