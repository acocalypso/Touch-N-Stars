<template>
  <button
    v-if="store.mountInfo.CanSetTrackingEnabled"
    @click="setTrackingMode(0)"
    class="default-button-cyan"
    :class="{ 'glow-green': store.mountInfo.TrackingMode === 'Sidereal' }"
  >
    {{ $t('components.mount.control.siderial') }}
  </button>
  <button
    @click="setTrackingMode(1)"
    class="default-button-cyan"
    :class="{ 'glow-green': store.mountInfo.TrackingMode === 'Lunar' }"
  >
    Lunar
  </button>
  <button
    @click="setTrackingMode(2)"
    class="default-button-cyan"
    :class="{ 'glow-green': store.mountInfo.TrackingMode === 'Solar' }"
  >
    Solar
  </button>
  <button
    @click="setTrackingMode(3)"
    class="default-button-cyan"
    :class="{ 'glow-green': store.mountInfo.TrackingMode === 'King' }"
  >
    King
  </button>
</template>

<script setup>
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';
import { apiStore } from '@/store/store';

const store = apiStore();
const { t } = useI18n();

async function setTrackingMode(mode) {
  //0=Sidereal, 1=Lunar, 2=Solar, 3=King, 5=Stopped
  try {
    const response = await apiService.setTrackingMode(mode);
    if (!response.Success) return;
    console.log(t('components.mount.control.trackingMode') + ' set');
  } catch (error) {
    console.log(t('components.mount.control.errors.tracking'));
  }
}
</script>

<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00;
}
</style>
