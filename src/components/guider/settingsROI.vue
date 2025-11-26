<template>
  <div class="flex flex-col w-full border border-gray-500 p-1 md:p-2 rounded-lg">
    <!-- ROI Percentage -->
    <div class="flex flex-row items-center justify-between">
      <label for="roiPercentage" class="text-xs md:text-sm text-gray-200 mr-2">
        {{ $t('components.guider.roiPercentage') }}
      </label>
      <div class="flex items-center gap-2">
        <input
          id="roiPercentage"
          v-model.number="roiPercentage"
          @change="setRoiPercentage"
          type="number"
          min="0"
          max="100"
          step="1"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-24"
          :class="statusClassRoiPercentage"
          placeholder="25"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

const store = apiStore();

const roiPercentage = ref(25);

const statusClassRoiPercentage = ref('');

const initializeSettings = () => {
  if (!store.profileInfo?.GuiderSettings) {
    console.warn('GuiderSettings not loaded');
    return;
  }

  roiPercentage.value = store.profileInfo.GuiderSettings.PHD2ROIPct ?? 25;
};

async function setRoiPercentage() {
  try {
    await apiService.profileChangeValue('GuiderSettings-PHD2ROIPct', roiPercentage.value);
    statusClassRoiPercentage.value = 'glow-green';
  } catch (error) {
    console.error('Error setting ROI percentage:', error);
    statusClassRoiPercentage.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassRoiPercentage.value = '';
    }, 2000);
  }
}

onMounted(() => {
  initializeSettings();
});
</script>
