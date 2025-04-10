<template></template>
<script setup>
import { onMounted, ref } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import { handleApiError } from '@/utils/utils';

const store = apiStore();
const pixelSize = ref(0);
const chipHigh = ref(0);
const chipWidth = ref(0);
const focalLength = ref(0);
const statusClassPixelSize = ref('');

function updatePixelSize() {
  statusClassPixelSize.value = 'glow-green';
}

onMounted(() => {
  pixelSize.value = store.profileInfo.CameraSettings.PixelSize || 5.0;
  focalLength.value = store.profileInfo.TelescopeSettings.FocalLength || 500;
  chipHigh.value = store.profileInfo.FramingAssistantSettings.CameraHeight || 1500;
  chipWidth.value = store.profileInfo.FramingAssistantSettings.CameraWidth || 3000;
});
</script>
<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00; /* Grüner Schein */
}
</style>
