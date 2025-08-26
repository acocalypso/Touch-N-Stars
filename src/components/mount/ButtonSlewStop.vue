<template>
  <button
    @click="framingStore.slewStop"
    class="default-button-red w-16"
  >
    <StopCircleIcon class="w-8 h-8" />
  </button>
</template>

<script setup>
import { useFramingStore } from '@/store/framingStore';
import { StopCircleIcon } from '@heroicons/vue/24/outline';

const framingStore = useFramingStore();
</script>

<style scoped></style>
