<template>
  <div
    v-if="
      filterStore.filterwheelSettings?.HasTurboMode &&
      filterStore.filterwheelSettings?.TurboMode !== undefined
    "
    class="w-full"
  >
    <div class="flex items-center justify-between border border-gray-500 p-1 md:p-2 rounded-lg">
      <label for="TurboMode" class="text-xs md:text-sm text-gray-200 font-medium">
        {{ $t('components.filterwheel.settings.TurboMode') }}
      </label>
      <toggleButton
        @click="toggleMode"
        :status-value="filterStore.filterwheelSettings.TurboMode"
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
  const newValue = !filterStore.filterwheelSettings.TurboMode;
  try {
    await apiService.filterAction(`set-setting?settingName=TurboMode&newValue=${newValue}`);
  } catch (error) {
    console.log('[pinsSetTurboMode] Error:', error);
  }
}
</script>
