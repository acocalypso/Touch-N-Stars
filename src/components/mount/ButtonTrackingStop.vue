<template>
  <button @click="setTrackingMode(4)" class="default-button-red" :class="statusClass">
    <StopCircleIcon class="w-8 h-8" />
  </button>
</template>

<script setup>
import { ref } from 'vue';
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';
import { StopCircleIcon } from '@heroicons/vue/24/outline';

const statusClass = ref('');
const { t } = useI18n();

async function setTrackingMode(mode) {
  //0=Siderial, 1=Lunar, 2=Solar, 3=King, 4=Stopped
  try {
    const response = await apiService.setTrackingMode(mode);
    if (!response.Success) return;
    statusClass.value = 'glow-green';
    console.log(t('components.mount.control.trackingMode') + ' set');
  } catch (error) {
    console.log(t('components.mount.control.errors.tracking'));
  }
  setTimeout(() => {
    statusClass.value = '';
  }, 1000);
}
</script>

<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00;
}
</style>
