<template>
  <button
    :class="[
      'flex items-center justify-center p-1 w-10 h-10 rounded-full mr-2 bg-gray-700/50 text-white',
      store.isStacking
        ? 'bg-red-600/60 hover:bg-red-600/90 border border-red-400'
        : 'bg-green-600/60 hover:bg-green-600/90 border border-green-400',
    ]"
    @click="toggleStacking"
  >
    <StopIcon v-if="store.isStacking" class="w-6 h-6" />
    <PlayIcon v-else class="w-6 h-6" />
  </button>
</template>

<script setup>
import { PlayIcon, StopIcon } from '@heroicons/vue/24/outline';
import { useLivestackStore } from '../store/livestackStore';

const store = useLivestackStore();
const emit = defineEmits(['start', 'stop']);

const toggleStacking = () => {
  store.isStacking = !store.isStacking;
  emit(store.isStacking ? 'start' : 'stop');
};
</script>
