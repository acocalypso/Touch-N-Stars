<template>
  <div
    class="absolute top-2 left-40 bg-gray-900/50 backdrop-blur-md p-2 text-white flex items-center justify-center rounded-xl border border-gray-200 z-50 shadow-lg shadow-black transition-all duration-300 portrait:hidden"
  >
    <StartStopButton @pressed="toogleState()" />
    <TargetFilterSelector :isPortrait="false" />
    <LiveStackConfiguration />
    <StackFrameCounter />
  </div>
  <div
    class="absolute top-24 left-2 right-16 bg-gray-900/50 backdrop-blur-md p-2 text-white rounded-xl border border-gray-200 z-50 shadow-lg shadow-black transition-all duration-300 landscape:hidden"
  >
    <div class="flex justify-between mb-4">
      <StartStopButton @pressed="toogleState()" />
      <div class="flex">
        <LiveStackConfiguration />
        <StackFrameCounter />
      </div>
    </div>
    <TargetFilterSelector :isPortrait="true" />
  </div>
</template>

<script setup>
import StackFrameCounter from './FrameCounter.vue';
import LiveStackConfiguration from './LivestackConfiguration.vue';
import TargetFilterSelector from './TargetFilterSelector.vue';
import StartStopButton from './StartStopButton.vue';
import { useLivestackStore } from '../store/livestackStore.js';
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';

const store = useLivestackStore();
const { t } = useI18n();
const emit = defineEmits(['error']);

const setError = (message) => emit('error', message);

const toogleState = () => {
  if (store.status === 'running') {
    stopLivestack();
  } else {
    startLivestack();
  }
};

const startLivestack = async () => {
  const previousStatus = store.status;
  store.setStatus('waiting');
  setError(null);

  try {
    const result = await apiService.livestackStart();
    if (result.Success) {
      console.log('Livestack started successfully');
    } else {
      setError(result.Error || t('plugins.livestack.errors.start_failed'));
      store.setStatus(previousStatus);
    }
  } catch (error) {
    console.error('Error starting livestack:', error);
    setError(
      t('plugins.livestack.errors.start_exception', {
        message: error.message,
      })
    );
    store.setStatus(previousStatus);
    return;
  }

  // Assume running after successful start until websocket updates
  store.setStatus('running');
};

const stopLivestack = async () => {
  const previousStatus = store.status;
  store.setStatus('waiting');
  setError(null);

  try {
    const result = await apiService.livestackStop();
    if (result.Success) {
      console.log('Livestack stop successfully');
      store.setStatus('stopped');
    } else {
      setError(result.Error || t('plugins.livestack.errors.stop_failed'));
      store.setStatus(previousStatus);
    }
  } catch (error) {
    console.error('Error stoping livestack:', error);
    setError(t('plugins.livestack.errors.stop_exception', { message: error.message }));
    store.setStatus(previousStatus);
  }
};
</script>
