<template>
  <div v-if="focuserStore.focuserSettings?.Heating !== undefined" class="w-full">
    <div class="flex items-center justify-between border border-gray-500 p-1 md:p-2 rounded-lg">
      <label for="Heating" class="text-xs md:text-sm text-gray-200 font-medium">
        {{ $t('components.focuser.settings.Heating') }}
      </label>
      <toggleButton
        @click="toggleMode"
        :status-value="focuserStore.focuserSettings.Heating"
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
  const newValue = !focuserStore.focuserSettings.Heating;
  try {
    await apiService.focusAction(`set-setting?settingName=Heating&newValue=${newValue}`);
  } catch (error) {
    console.log('[pinsSetHeating] Error:', error);
  }
}
</script>
