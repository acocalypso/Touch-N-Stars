<template>
  <div
    class="absolute top-2 left-40 bg-gray-900/50 backdrop-blur-md p-2 text-white flex items-center justify-center rounded-xl border border-gray-200 z-50 shadow-lg shadow-black transition-all duration-300 portrait:hidden"
  >
    <StartStopButton />
    <TargetFilterSelector :isPortrait="false" />
    <LiveStackConfiguration />
    <StackFrameCounter />
  </div>
  <div
    class="absolute top-24 left-2 right-14 bg-gray-900/50 backdrop-blur-md p-2 text-white rounded-xl border border-gray-200 z-50 shadow-lg shadow-black transition-all duration-300 landscape:hidden"
  >
    <div class="flex justify-between mb-4">
      <StartStopButton />
      <div class="flex">
        <LiveStackConfiguration />
        <StackFrameCounter />
      </div>
    </div>
    <TargetFilterSelector :isPortrait="true" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import StackFrameCounter from './FrameCounter.vue';
import LiveStackConfiguration from './LivestackConfiguration.vue';
import TargetFilterSelector from './TargetFilterSelector.vue';
import StartStopButton from './StartStopButton.vue';
import { useLivestackStore } from '../store/livestackStore.js';
import { storeToRefs } from 'pinia';
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';

const errorMessage = ref(null);

const store = useLivestackStore();
const attributes = storeToRefs(store);
const { t } = useI18n();

watch(
  () => attributes.isStacking.value,
  (newVal) => {
    if (newVal) {
      startLivestack();
    } else {
      stopLivestack();
    }
  }
);

const startLivestack = async () => {
  //isStarting.value = true;
  errorMessage.value = null;

  try {
    const result = await apiService.livestackStart();
    if (result.Success) {
      console.log('Livestack started successfully');
    } else {
      errorMessage.value = result.Error || t('plugins.livestack.errors.start_failed');
    }
  } catch (error) {
    console.error('Error starting livestack:', error);
    errorMessage.value = t('plugins.livestack.errors.start_exception', {
      message: error.message,
    });
  } finally {
    //isStarting.value = false;
  }
};

const stopLivestack = async () => {
  errorMessage.value = null;

  try {
    const result = await apiService.livestackStop();
    if (result.Success) {
      console.log('Livestack stop successfully');
    } else {
      errorMessage.value = result.Error || t('plugins.livestack.errors.stop_failed');
    }
  } catch (error) {
    console.error('Error stoping livestack:', error);
    errorMessage.value = t('plugins.livestack.errors.stop_exception', { message: error.message });
  } finally {
    //isStarting.value = false;
  }
};
</script>
