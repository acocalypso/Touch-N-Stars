<template>
  <div class="flex items-center">
    <span class="text-sm font-medium text-gray-300 mr-2">
      {{ $t('components.mount.settings.reverse_secondary_axis') }}
    </span>
    <toggleButton @click="updateSetting" :status-value="isEnabled" />
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import toggleButton from '@/components/helpers/toggleButton.vue';

const store = apiStore();
const isEnabled = ref(false);

async function updateSetting() {
  isEnabled.value = !isEnabled.value;
  try {
    const response = await apiService.profileChangeValue(
      'TelescopeSettings-SecondaryReversed',
      isEnabled.value
    );
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
  isEnabled.value = store.profileInfo.TelescopeSettings.SecondaryReversed;
});
</script>
