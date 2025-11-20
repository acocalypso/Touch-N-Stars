<template>
  <div
    class="absolute top-3 left-40 bg-gradient-to-br from-gray-800/80 to-gray-900/90 backdrop-blur-lg px-3 py-2 text-white flex items-center gap-1.5 rounded-lg border border-gray-700/50 z-50 shadow-lg shadow-black/40 transition-all duration-300 portrait:hidden"
  >
    <StartStopButton @pressed="toogleState()" />
    <TargetFilterSelector :isPortrait="false" />
    <LiveStackConfiguration />
    <StackFrameCounter />
  </div>
  <div
    class="absolute top-24 left-2 right-16 bg-gradient-to-br from-gray-800/80 to-gray-900/90 backdrop-blur-lg px-3 py-3 text-white rounded-lg border border-gray-700/50 z-50 shadow-lg shadow-black/40 transition-all duration-300 landscape:hidden"
  >
    <div class="flex justify-between items-center gap-2 mb-3">
      <StartStopButton @pressed="toogleState()" />
      <div class="flex gap-1.5">
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
  store.status = 'waiting';
  setError(null);

  try {
    const result = await apiService.livestackStart();
    if (result.Success) {
      console.log('Livestack started successfully');
    } else {
      setError(result.Error || t('plugins.livestack.errors.start_failed'));
      store.status = previousStatus;
    }
  } catch (error) {
    console.error('Error starting livestack:', error);
    setError(
      t('plugins.livestack.errors.start_exception', {
        message: error.message,
      })
    );
    store.status = previousStatus;
    return;
  }

  // Assume running after successful start until websocket updates
  store.status = 'running';
};

const stopLivestack = async () => {
  const previousStatus = store.status;
  store.status = 'Waiting';
  setError(null);

  try {
    const result = await apiService.livestackStop();
    if (result.Success) {
      console.log('Livestack stop successfully');
      store.status = 'stopped';
    } else {
      setError(result.Error || t('plugins.livestack.errors.stop_failed'));
      store.status = previousStatus;
    }
  } catch (error) {
    console.error('Error stoping livestack:', error);
    setError(t('plugins.livestack.errors.stop_exception', { message: error.message }));
    store.status = previousStatus;
  }
};
</script>
