<template>
  <div v-if="store.isPINS" class="flex items-center justify-between w-full">
    <span class="text-sm font-medium text-gray-300">
      {{ $t('components.guider.phd2.restoreCalibration') }}
    </span>
    <toggleButton
      @click="toggleRestoreCalibration"
      :status-value="guiderStore.phd2RestoreCalibration"
      :disabled="guiderStore.phd2RestoreCalibrationLoading"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGuiderStore } from '@/store/guiderStore';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { apiStore } from '@/store/store';

const store = apiStore();
const guiderStore = useGuiderStore();

onMounted(async () => {
  await guiderStore.fetchPHD2RestoreCalibration();
});

const toggleRestoreCalibration = async () => {
  const previousValue = guiderStore.phd2RestoreCalibration;
  const newValue = !previousValue;
  try {
    guiderStore.phd2RestoreCalibration = newValue;
    await guiderStore.setPHD2RestoreCalibration(newValue);
  } catch (error) {
    console.error('Error changing PHD2 restore calibration:', error);
    guiderStore.phd2RestoreCalibration = previousValue;
  }
};
</script>
