<template>
  <div class="flex flex-col w-full border border-gray-500 p-1 rounded-lg">
    <label class="text-sm sm:text-xs mb-2 text-gray-200">{{
      $t('components.focuser.settings.AutoFocusFitFunction') }}</label>
    <select
      v-model="selectedValue"
      @change="updateSetting"
      :class="[statusClass]"
      class="default-select w-full py-2"
    >
      <option value="">{{ $t('common.select') }}</option>
      <option value="TRENDLINES">{{ $t('components.focuser.settings.TRENDLINES') }}</option>
      <option value="PARABOLIC">{{ $t('components.focuser.settings.PARABOLIC') }}</option>
      <option value="TRENDPARABOLIC">{{ $t('components.focuser.settings.TRENDPARABOLIC') }}</option>
      <option value="HYPERBOLIC">{{ $t('components.focuser.settings.HYPERBOLIC') }}</option>
      <option value="TRENDHYPERBOLIC">{{ $t('components.focuser.settings.TRENDHYPERBOLIC') }}</option>
    </select>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

const store = apiStore();
const selectedValue = ref('');
const statusClass = ref('');

async function updateSetting() {
  try {
    const response = await apiService.profileChangeValue('FocuserSettings-AutoFocusCurveFitting', selectedValue.value);
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
  selectedValue.value = store.profileInfo.FocuserSettings.AutoFocusCurveFitting;
  console.log('Mounted AutoFocusFitFunction with value:', selectedValue.value);
});
</script>
