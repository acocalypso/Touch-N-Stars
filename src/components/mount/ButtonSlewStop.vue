<template>
  <button
    @click="framingStore.slewStop"
    v-if="store.mountInfo.Slewing"
    class="bg-red-900 rounded-md flex items-center justify-center w-16"
  >
    <StopCircleIcon class="w-8 h-8" />
  </button>
</template>

<script setup>
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { StopCircleIcon } from '@heroicons/vue/24/outline';

const store = apiStore();
const framingStore = useFramingStore();
</script>

<style scoped></style>
