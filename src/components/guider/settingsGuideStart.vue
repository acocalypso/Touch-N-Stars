<template>
  <div class="flex flex-col w-full border border-gray-500 p-1 md:p-2 rounded-lg">
    <!-- Guiding Start Retry -->
    <div class="flex flex-row items-center justify-between">
      <label for="guidingStartRetry" class="text-xs md:text-sm text-gray-200">
        {{ $t('components.guider.guidingStartRetry') }}
      </label>
      <toggleButton
        class="pr-5 pl-5 justify-center h-7 md:h-8"
        @click="toggleGuidingStartRetry"
        :status-value="guidingStartRetry"
      />
    </div>

    <!-- Guiding Start Timeout -->
    <div class="flex flex-row items-center justify-between">
      <label for="guidingStartTimeout" class="text-xs md:text-sm text-gray-200 mr-2">
        {{ $t('components.guider.guidingStartTimeout') }}
      </label>
      <div class="flex items-center gap-2">
        <input
          id="guidingStartTimeout"
          v-model.number="guidingStartTimeout"
          @change="setGuidingStartTimeout"
          type="number"
          min="0"
          step="1"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-24"
          :class="statusClassGuidingStartTimeout"
          placeholder="60"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

const store = apiStore();

const guidingStartRetry = ref(false);
const guidingStartTimeout = ref(60);

const statusClassGuidingStartTimeout = ref('');

const initializeSettings = () => {
  if (!store.profileInfo?.GuiderSettings) {
    console.warn('GuiderSettings not loaded');
    return;
  }

  guidingStartRetry.value = store.profileInfo.GuiderSettings.AutoRetryStartGuiding ?? false;
  guidingStartTimeout.value =
    store.profileInfo.GuiderSettings.AutoRetryStartGuidingTimeoutSeconds ?? 60;
};

async function toggleGuidingStartRetry() {
  guidingStartRetry.value = !guidingStartRetry.value;
  try {
    await apiService.profileChangeValue(
      'GuiderSettings-AutoRetryStartGuiding',
      guidingStartRetry.value
    );
  } catch (error) {
    console.error('Error setting guiding start retry:', error);
    guidingStartRetry.value = !guidingStartRetry.value; // Revert on error
  }
}

async function setGuidingStartTimeout() {
  try {
    await apiService.profileChangeValue(
      'GuiderSettings-AutoRetryStartGuidingTimeoutSeconds',
      guidingStartTimeout.value
    );
    statusClassGuidingStartTimeout.value = 'glow-green';
  } catch (error) {
    console.error('Error setting guiding start timeout:', error);
    statusClassGuidingStartTimeout.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassGuidingStartTimeout.value = '';
    }, 2000);
  }
}

onMounted(() => {
  initializeSettings();
});
</script>
