<template>
  <div>
    <label class="block text-sm font-medium text-gray-400 mt-1">{{
      $t('components.settings.image.quality')
    }}</label>
    <input
      v-model="settingsStore.camera.imageQuality"
      @change="updateSetting"
      @blur="updateSetting"
      :class="statusClass"
      type="number"
      min="1"
      max="100"
      class="w-full px-3 py-2 bg-gray-600 text-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
      placeholder="90"
    />
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useSettingsStore } from '@/store/settingsStore';

const settingsStore = useSettingsStore();
const statusClass = ref('');

async function updateSetting() {
  statusClass.value = 'glow-green';
  setTimeout(() => {
    statusClass.value = '';
  }, 1000);
}
</script>
<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00; /* Grüner Schein */
}
</style>
