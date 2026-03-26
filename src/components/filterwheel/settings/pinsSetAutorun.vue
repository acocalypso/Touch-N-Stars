<template>
  <div v-if="filterStore.filterwheelSettings?.Autorun !== undefined" class="w-full">
    <div class="flex items-center justify-between border border-gray-500 p-1 md:p-2 rounded-lg">
      <label for="Autorun" class="text-xs md:text-sm text-gray-200 font-medium">
        {{ $t('components.filterwheel.settings.Autorun') }}
      </label>
      <toggleButton
        @click="toggleMode"
        :status-value="filterStore.filterwheelSettings.Autorun"
        class="h-7 md:h-8"
      />
    </div>
  </div>
</template>

<script setup>
import apiService from '@/services/apiService';
import { useFilterStore } from '@/store/filterStore';
import toggleButton from '@/components/helpers/toggleButton.vue';

const filterStore = useFilterStore();

async function toggleMode() {
  const newValue = !filterStore.filterwheelSettings.Autorun;
  try {
    await apiService.filterAction(`set-setting?settingName=Autorun&newValue=${newValue}`);
  } catch (error) {
    console.log('[pinsSetAutorun] Error:', error);
  }
}
</script>
