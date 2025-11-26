<template>
  <div class="flex flex-col w-full border border-gray-500 p-1 md:p-2 rounded-lg">
    <!-- Settle Pixel Tolerance -->
    <div class="flex flex-row items-center justify-between">
      <label for="settlePixels" class="text-xs md:text-sm text-gray-200 mr-2">
        {{ $t('components.guider.settlePixels') }}
      </label>
      <div class="flex items-center gap-2">
        <input
          id="settlePixels"
          v-model.number="settlePixels"
          @change="setSettlePixels"
          type="number"
          min="0"
          step="0.1"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-24"
          :class="statusClassSettlePixels"
          placeholder="1.5"
        />
      </div>
    </div>

    <!-- Minimum Settle Time -->
    <div class="flex flex-row items-center justify-between mt-2 md:mt-3">
      <label for="settleTime" class="text-xs md:text-sm text-gray-200 mr-2">
        {{ $t('components.guider.settleTime') }}
      </label>
      <div class="flex items-center gap-2">
        <input
          id="settleTime"
          v-model.number="settleTime"
          @change="setSettleTime"
          type="number"
          min="0"
          step="1"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-24"
          :class="statusClassSettleTime"
          placeholder="10"
        />
      </div>
    </div>

    <!-- Settle Timeout -->
    <div class="flex flex-row items-center justify-between mt-2 md:mt-3">
      <label for="settleTimeout" class="text-xs md:text-sm text-gray-200 mr-2">
        {{ $t('components.guider.settleTimeout') }}
      </label>
      <div class="flex items-center gap-2">
        <input
          id="settleTimeout"
          v-model.number="settleTimeout"
          @change="setSettleTimeout"
          type="number"
          min="0"
          step="1"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-24"
          :class="statusClassSettleTimeout"
          placeholder="30"
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

const settlePixels = ref(1.5);
const settleTime = ref(10);
const settleTimeout = ref(30);

const statusClassSettlePixels = ref('');
const statusClassSettleTime = ref('');
const statusClassSettleTimeout = ref('');

const initializeSettings = () => {
  if (!store.profileInfo?.GuiderSettings) {
    console.warn('GuiderSettings not loaded');
    return;
  }

  settlePixels.value = store.profileInfo.GuiderSettings.SettlePixels ?? 1.5;
  settleTime.value = store.profileInfo.GuiderSettings.SettleTime ?? 10;
  settleTimeout.value = store.profileInfo.GuiderSettings.SettleTimeout ?? 30;
};

async function setSettlePixels() {
  try {
    await apiService.profileChangeValue('GuiderSettings-SettlePixels', settlePixels.value);
    statusClassSettlePixels.value = 'glow-green';
  } catch (error) {
    console.error('Error setting settle pixels:', error);
    statusClassSettlePixels.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassSettlePixels.value = '';
    }, 2000);
  }
}

async function setSettleTime() {
  try {
    await apiService.profileChangeValue('GuiderSettings-SettleTime', settleTime.value);
    statusClassSettleTime.value = 'glow-green';
  } catch (error) {
    console.error('Error setting settle time:', error);
    statusClassSettleTime.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassSettleTime.value = '';
    }, 2000);
  }
}

async function setSettleTimeout() {
  try {
    await apiService.profileChangeValue('GuiderSettings-SettleTimeout', settleTimeout.value);
    statusClassSettleTimeout.value = 'glow-green';
  } catch (error) {
    console.error('Error setting settle timeout:', error);
    statusClassSettleTimeout.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassSettleTimeout.value = '';
    }, 2000);
  }
}

onMounted(() => {
  initializeSettings();
});
</script>
