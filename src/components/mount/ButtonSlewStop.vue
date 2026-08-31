<template>
  <!-- Width is left to the caller: full width when stacked, compact next to labelled buttons -->
  <button @click="stopSlew" class="tns-btn-danger shrink-0">
    <StopCircleIcon class="w-8 h-8" />
  </button>
</template>

<script setup>
import { useFramingStore } from '@/store/framingStore';
import { StopCircleIcon } from '@heroicons/vue/24/outline';

const framingStore = useFramingStore();

// Deliberately not behind a confirmation: this is the emergency stop for a
// moving mount and has to take effect on the first tap.
function stopSlew() {
  framingStore.slewStop();
}
</script>

<style scoped></style>
