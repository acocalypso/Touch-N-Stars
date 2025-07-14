<template>
  <div>
    <label class="block text-sm font-medium text-gray-300 mb-2">{{
      $t('components.settings.image.quality')
    }}</label>
    <input
      v-model="settingsStore.camera.imageQuality"
      @change="updateSetting"
      @blur="updateSetting"
      :class="[statusClass]"
      type="number"
      min="1"
      max="100"
      class="default-input w-full py-2"
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
  box-shadow: 0 0 10px #10b981; /* Emerald green glow to match the focus ring */
}
</style>