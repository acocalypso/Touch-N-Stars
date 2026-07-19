<template>
  <button
    v-if="store.mountInfo.CanFindHome"
    @click="mountHome"
    :class="['tns-btn-secondary', statusClass]"
  >
    {{ $t('components.mount.control.home') }}
  </button>
</template>

<script setup>
import { ref } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

import { useHaptics } from '@/composables/useHaptics';

const { tapLight } = useHaptics();
const store = apiStore();
const statusClass = ref('');

async function mountHome() {
  tapLight();
  try {
    const response = await apiService.mountAction('home');
    console.log('mountHome', response);
    if (!response.Success) return;

    statusClass.value = 'glow-green';
  } catch (error) {
    console.log('Error mountHome', error);
    statusClass.value = 'glow-red';
  }

  // Nach 1 Sekunde den Effekt entfernen
  setTimeout(() => {
    statusClass.value = '';
  }, 1000);
}
</script>

<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00; /* Grüner Schein */
}
.glow-red {
  box-shadow: 0 0 10px rgb(255, 0, 0); /* Roter Schein */
}
</style>
