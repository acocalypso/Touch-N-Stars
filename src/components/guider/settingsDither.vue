<template>
  <div class="flex flex-col w-full border border-gray-500 p-1 md:p-2 rounded-lg">
    <!-- Dither Pixels -->
    <div class="flex flex-row items-center justify-between">
      <label for="ditherPixels" class="text-xs md:text-sm text-gray-200 mr-2">
        {{ $t('components.guider.ditherPixels') }}
      </label>
      <div class="flex items-center gap-2">
        <input
          id="ditherPixels"
          v-model.number="ditherPixels"
          @change="setDitherPixels"
          type="number"
          min="0"
          step="1"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-24"
          :class="statusClassDitherPixels"
        />
      </div>
    </div>

    <div class="flex flex-row items-center justify-between">
      <label for="ditherRAOnly" class="text-xs md:text-sm text-gray-200">
        {{ $t('components.guider.ditherRAOnly') }}
      </label>
      <toggleButton
        class="pr-5 pl-5 justify-center h-7 md:h-8"
        @click="toggleDitherRAOnly"
        :status-value="ditherRAOnly"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

const store = apiStore();

const ditherPixels = ref(3.0);
const ditherRAOnly = ref(false);

const statusClassDitherPixels = ref('');

const initializeSettings = () => {
  if (!store.profileInfo?.GuiderSettings) {
    console.warn('GuiderSettings not loaded');
    return;
  }

  ditherPixels.value = store.profileInfo.GuiderSettings.DitherPixels ?? 3.0;
  ditherRAOnly.value = store.profileInfo.GuiderSettings.DitherRAOnly ?? false;
};

async function setDitherPixels() {
  try {
    await apiService.profileChangeValue('GuiderSettings-DitherPixels', ditherPixels.value);
    statusClassDitherPixels.value = 'glow-green';
  } catch (error) {
    console.error('Error setting dither pixels:', error);
    statusClassDitherPixels.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassDitherPixels.value = '';
    }, 2000);
  }
}

async function toggleDitherRAOnly() {
  ditherRAOnly.value = !ditherRAOnly.value;
  try {
    await apiService.profileChangeValue('GuiderSettings-DitherRAOnly', ditherRAOnly.value);
  } catch (error) {
    console.error('Error setting dither RA only:', error);
    ditherRAOnly.value = !ditherRAOnly.value; // Revert on error
  }
}

onMounted(() => {
  initializeSettings();
});
</script>
