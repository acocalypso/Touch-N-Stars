<template>
  <div
    class="flex items-center justify-center px-2 py-1.5 bg-gradient-to-br from-gray-700/60 to-gray-600/60 rounded-md border border-gray-700/50 z-50 transition-all duration-300 text-gray-300 shadow-md"
  >
    {{ store.currentCounter }}
  </div>
</template>

<script setup>
import { useLivestackStore } from '../store/livestackStore';

const store = useLivestackStore();
</script>
