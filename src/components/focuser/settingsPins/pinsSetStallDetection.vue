<template>
  <div v-if="focuserStore.focuserSettings?.StallDetection !== undefined" class="w-full">
    <div class="flex items-center justify-between border border-gray-500 p-1 md:p-2 rounded-lg">
      <label for="StallDetection" class="text-xs md:text-sm text-gray-200 font-medium">
        {{ $t('components.focuser.settings.StallDetection') }}
      </label>
      <toggleButton
        @click="toggleMode"
        :status-value="focuserStore.focuserSettings.StallDetection"
        class="h-7 md:h-8"
      />
    </div>
  </div>
</template>
<script setup>
import apiService from '@/services/apiService';
import { useFocuserStore } from '@/store/focuserStore';
import toggleButton from '@/components/helpers/toggleButton.vue';

const focuserStore = useFocuserStore();

async function toggleMode() {
  const newValue = !focuserStore.focuserSettings.StallDetection;
  try {
    await apiService.focusAction(`set-setting?settingName=StallDetection&newValue=${newValue}`);
  } catch (error) {
    console.log('[pinsSetStallDetection] Error:', error);
  }
}
</script>
