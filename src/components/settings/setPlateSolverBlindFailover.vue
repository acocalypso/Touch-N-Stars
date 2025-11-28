<template>
  <div class="flex items-center justify-between border border-gray-500 p-1 rounded-lg">
    <span class="text-sm font-medium text-gray-300">
      {{ $t('components.settings.plate_solver.BlindFailoverEnabled') }}
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
      'PlateSolveSettings-BlindFailoverEnabled',
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
  isEnabled.value = store.profileInfo.PlateSolveSettings.BlindFailoverEnabled;
});
</script>
