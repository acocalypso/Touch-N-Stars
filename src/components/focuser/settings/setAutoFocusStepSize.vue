<template>
  <div class="flex flex-col md:flex-row w-full md:items-center min-w-28 border border-gray-500 p-1 rounded-lg">
    <label class="text-sm sm:text-xs md:mr-3 mb-2 md:mb-1 text-gray-200">{{
      $t('components.focuser.settings.AutoFocusStepSize') }}</label>
    <input
      @change="updateSetting"
      @blur="updateSetting"
      :class="[statusClass]"
      v-model.number="setValue"
      type="number"
      min="0"
      max="100000"
      step="1"
      class="default-input h-8 w-full md:w-28 md:ml-auto py-2"
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
    const response = await apiService.profileChangeValue('FocuserSettings-AutoFocusStepSize', value);
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
  setValue.value = store.profileInfo.FocuserSettings.AutoFocusStepSize;
});
</script>
