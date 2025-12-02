<template>
  <div class="space-y-1">
    <settingsCamera class="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50" />
    <settingsCameraCooler
      v-if="store.cameraInfo.CanSetTemperature"
      class="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
    />
    <div>
      <changeFilter
        v-if="store.filterInfo.Connected"
        class="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
      />
    </div>
  </div>
</template>
<script setup>
import { apiStore } from '@/store/store';
import settingsCameraCooler from './settingsCameraCooler.vue';
import changeFilter from '../filterwheel/changeFilter.vue';
import settingsCamera from './settingsCamera.vue';

const store = apiStore();
</script>
