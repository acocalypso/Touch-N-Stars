<template>
  <!-- Titel -->
  <div class="text-left mb-2">
    <h1 class="text-xl text-center font-bold">{{ $t('components.flatassistant.title') }}</h1>
  </div>
  <div class="flex flex-col items-center justify-center max-w-md p-2 mx-auto">
    <select
      v-model="settingsStore.flats.selectedOption"
      class="p-2 w-full border border-gray-500 rounded-lg bg-gray-800 text-white"
    >
      <option value="AutoExposure">{{ $t('components.flatassistant.auto_exposure') }}</option>
      <option value="AutoBrightness">{{ $t('components.flatassistant.auto_brightness') }}</option>
      <option value="SkyFlat">{{ $t('components.flatassistant.skyflat') }}</option>
    </select>

    <component :is="selectedComponent" class="mt-4" />

    <div
      v-show="flatsStore.status.CompletedIterations > -1"
      class="flex flex-col w-full max-w-md space-y-2 mt-4 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
    >
      <div
        class="flex justify-center items-center p-2 border border-gray-500 rounded-lg bg-gray-800"
      >
        <getStatus />
      </div>
      <LastImage />
    </div>
  </div>
  <div class="p-10"></div>
</template>

<script setup>
import { computed } from 'vue';
import AutoExposure from '@/components/flatassistant/AutoExposure.vue';
import AutoBrightness from '@/components/flatassistant/AutoBrightness.vue';
import SkyFlat from '@/components/flatassistant/SkyFlat.vue';
import getStatus from '@/components/flatassistant/getStatus.vue';
import LastImage from '@/components/flatassistant/LastImage.vue';
import { useFlatassistantStore } from '@/store/flatassistantStore';
import { useSettingsStore } from '@/store/settingsStore';

const flatsStore = useFlatassistantStore();
const settingsStore = useSettingsStore();

const selectedComponent = computed(() => {
  switch (settingsStore.flats.selectedOption) {
    case 'AutoBrightness':
      return AutoBrightness;
    case 'SkyFlat':
      return SkyFlat;
    default:
      return AutoExposure;
  }
});
</script>
