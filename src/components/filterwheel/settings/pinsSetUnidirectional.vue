<template>
  <div
    v-if="filterStore.filterwheelSettings?.Unidirectional !== undefined && store.isPINS"
    class="w-full"
  >
    <div class="flex items-center justify-between border border-gray-500 p-1 md:p-2 rounded-lg">
      <label for="DewHeater" class="text-xs md:text-sm text-gray-200 font-medium">
        {{ $t('components.filterwheel.Unidirectional') }}
      </label>
      <toggleButton
        @click="toggleMode"
        :status-value="filterStore.filterwheelSettings.Unidirectional"
        class="h-7 md:h-8"
      />
    </div>
  </div>
</template>
<script setup>
import apiService from '@/services/apiService';
import { useFilterStore } from '@/store/filterStore';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { apiStore } from '@/store/store';

const filterStore = useFilterStore();
const store = apiStore();

async function toggleMode() {
  if (filterStore.filterwheelSettings.Unidirectional) {
    try {
      await apiService.filterAction(`set-setting?settingName=Unidirectional&newValue=false`);
    } catch (error) {
      console.log('Error:', error);
    }
  } else {
    try {
      await apiService.filterAction(`set-setting?settingName=Unidirectional&newValue=true`);
    } catch (error) {
      console.log('Error:', error);
    }
  }
  await filterStore.readSettings();
}
</script>
