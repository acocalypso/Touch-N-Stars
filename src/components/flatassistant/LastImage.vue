<template>
  <div>
    <img v-if="imagetStore.imageData" :src="imagetStore.imageData" alt="Flat Image" />
  </div>
</template>

<script setup>
import { useImagetStore } from '@/store/imageStore';

const imagetStore = useImagetStore();
</script>
