<template>
  <div v-if="focuserStore.focuserSettings?.BeepOnStartup !== undefined" class="w-full">
    <div class="flex items-center justify-between border border-gray-500 p-1 md:p-2 rounded-lg">
      <label for="BeepOnStartup" class="text-xs md:text-sm text-gray-200 font-medium">
        {{ $t('components.focuser.settings.BeepOnStartup') }}
      </label>
      <toggleButton
        @click="toggleMode"
        :status-value="focuserStore.focuserSettings.BeepOnStartup"
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
  const newValue = !focuserStore.focuserSettings.BeepOnStartup;
  try {
    await apiService.focusAction(`set-setting?settingName=BeepOnStartup&newValue=${newValue}`);
  } catch (error) {
    console.log('[pinsSetBeepOnStartup] Error:', error);
  }
}
</script>
