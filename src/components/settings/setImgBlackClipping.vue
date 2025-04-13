<template>
  <div>
    <label class="block text-sm font-medium text-gray-400 mt-1">{{
      $t('components.settings.image.black_clipping')
    }}</label>
    <input
      @change="updateSetting"
      @blur="updateSetting"
      :class="statusClass"
      v-model.number="setValue"
      type="number"
      min="-10"
      max="1"
      step="0.1"
      class="w-full px-3 py-2 bg-gray-600 text-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
      placeholder="-2.8"
    />
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import { handleApiError } from '@/utils/utils';

const store = apiStore();
const setValue = ref(0);
const statusClass = ref('');

async function updateSetting() {
  let value = String(setValue.value).replace(',', '.');

  try {
    const response = await apiService.profileChangeValue('ImageSettings-BlackClipping', value);
    if (handleApiError(response, { title: 'Error save setting' })) return;

    statusClass.value = 'glow-green';
  } catch (error) {
    console.log('Error save setting');
  }

  setTimeout(() => {
    statusClass.value = '';
  }, 1000);
}

onMounted(() => {
  setValue.value = store.profileInfo.ImageSettings.BlackClipping;
});
</script>
<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00; /* Grüner Schein */
}
</style>
