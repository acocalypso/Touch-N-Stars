<template>
  <div>
    <label class="block text-sm font-medium text-gray-300 mb-2">{{
      $t('components.focuser.settings.AutoFocusNumberOfFramesPerPoint') }}</label>
    <input
      @change="updateSetting"
      @blur="updateSetting"
      :class="[statusClass]"
      v-model.number="setValue"
      type="number"
      min="0"
      max="100000"
      step="1"
      class="default-input w-full py-2"
      placeholder="100"
    />
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

const store = apiStore();
const setValue = ref(0);
const statusClass = ref('');

async function updateSetting() {
  let value = String(setValue.value).replace(',', '.');
  try {
    const response = await apiService.profileChangeValue('FocuserSettings-AutoFocusNumberOfFramesPerPoint', value);
    if (!response.Success) return;
    statusClass.value = 'glow-green';
  } catch (error) {
    console.log('Error save setting');
  }
  setTimeout(() => {
    statusClass.value = '';
  }, 1000);
}

onMounted(() => {
  setValue.value = store.profileInfo.FocuserSettings.AutoFocusNumberOfFramesPerPoint;
});
</script>
