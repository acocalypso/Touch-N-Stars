<template>
    <div class="flex items-center justify-center font-bold px-2 py-1.5 bg-gray-700/50 rounded-md border border-gray-400 z-50 transition">
      {{ store.currentCounter }}
    </div>
</template>

<script setup>
import { useLivestackStore } from '../store/livestackStore';

const store = useLivestackStore();
</script>