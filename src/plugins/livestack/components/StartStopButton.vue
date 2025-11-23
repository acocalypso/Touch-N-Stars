<template>
  <div :class="['counter-wrapper', { 'counter-wrapper--active': isRunning }]">
    <button
      class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-600 text-white border border-gray-400 z-top"
      @click="toggleStacking"
    >
      <StopIcon v-if="isRunning" class="w-6 h-6 text-red-500" />
      <PlayIcon v-else-if="isStopped" class="w-6 h-6 text-green-500" />
      <ArrowPathIcon v-else class="w-6 h-6 animate-spin text-orange-500" />
    </button>
  </div>
</template>

<script setup>
import { PlayIcon, StopIcon, ArrowPathIcon } from '@heroicons/vue/24/solid';
import { useLivestackStore } from '../store/livestackStore.js';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const store = useLivestackStore();
const { status } = storeToRefs(store);

console.log('Livestack status in StartStopButton:', status.value);

const isRunning = computed(() => status.value === 'running');
const isStopped = computed(() => status.value === 'stopped');

const emit = defineEmits(['pressed']);

const toggleStacking = () => {
  emit('pressed');
};
</script>

<style scoped>
.counter-wrapper {
  position: relative;
}
.counter-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border: 4px solid;
  border-radius: 9999px;
  opacity: 0;
  border-color: rgba(89, 154, 24, 0.6);
  transform: scale(1);
  pointer-events: none;
}
.counter-wrapper--active::before {
  opacity: 1;
  border-top-color: rgba(96, 252, 11, 0.9);
  animation: counter-spin 2s linear infinite;
}
@keyframes counter-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
