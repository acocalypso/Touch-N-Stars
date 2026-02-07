<template>
  <div
    v-if="store.focuserInfo.CanReverse"
    class="flex items-center justify-between border border-gray-500 p-2 rounded-lg"
  >
    <span class="text-sm font-medium text-gray-300">
      {{ $t('components.focuser.settings.Reverse') }}
    </span>
    <toggleButton @click="updateSetting" :status-value="isEnabled" />
  </div>
</template>
<script setup>
//#################################
//This is PINS only
//#################################
import { ref, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import apiPinsService from '@/services/apiPinsService';
import toggleButton from '@/components/helpers/toggleButton.vue';

const store = apiStore();
const isEnabled = ref(false);

async function updateSetting() {
  isEnabled.value = !isEnabled.value;
  try {
    const response = await apiPinsService.focuserAction(`reverse?value=${isEnabled.value}`);
    await apiService.profileChangeValue('FocuserSettings-Reverse', isEnabled.value);

    if (!response.Success) {
      // Revert on error
      isEnabled.value = !isEnabled.value;
    }
  } catch (error) {
    console.log('Error save setting');
    // Revert on error
    isEnabled.value = !isEnabled.value;
  }
}

onMounted(() => {
  isEnabled.value = store.profileInfo?.FocuserSettings?.Reverse ?? false;
});
</script>
