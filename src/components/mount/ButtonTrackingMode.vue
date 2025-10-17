<template>
  <button @click="setTrackingMode(0)" class="default-button-cyan" :class="statusClass">
    {{ $t('components.mount.control.siderial') }}
  </button>
  <!-- aktuell deaktiviert da NINA nur Siderial umsetzt
      <button @click="setTrackingMode(1)"
              class="min-w-15 min-h-10 bg-cyan-900 rounded-md text-white font-medium transition-colors w-full">
        Lunar
      </button>
      <button @click="setTrackingMode(2)"
              class="min-w-15 min-h-10 bg-cyan-900 rounded-md text-white font-medium transition-colors w-full">
        Solar
      </button>
      <button @click="setTrackingMode(3)"
              class="min-w-15 min-h-10 bg-cyan-900 rounded-md text-white font-medium transition-colors w-full">
        King
      </button>
       -->
</template>

<script setup>
import { ref } from 'vue';
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';

const statusClass = ref('');
const { t } = useI18n();

async function setTrackingMode(mode) {
  //0=Siderial, 1=Lunar, 2=Solar, 3=King, 5=Stopped
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
