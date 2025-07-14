<template>
  <div>
    <label class="block text-sm font-medium text-gray-300 mb-2">{{
      $t('components.settings.image.strech_factor')
    }}</label>
    <input
      @change="updateSetting"
      @blur="updateSetting"
      :class="[statusClass]"
      v-model.number="strechFactor"
      type="number"
      min="0"
      max="1"
      step="0.1"
      class="default-input w-full py-2"
      placeholder="0.1"
    />
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import { handleApiError } from '@/utils/utils';

const store = apiStore();
const strechFactor = ref(0);
const statusClass = ref('');

async function updateSetting() {
  let value = String(strechFactor.value).replace(',', '.');
  try {
    const response = await apiService.profileChangeValue('ImageSettings-AutoStretchFactor', value);
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
  strechFactor.value = store.profileInfo.ImageSettings.AutoStretchFactor;
});
</script>
<style scoped>
.glow-green {
  box-shadow: 0 0 10px #10b981; /* Emerald green glow to match the focus ring */
}
</style>
