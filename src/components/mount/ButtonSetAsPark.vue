<template>
  <button v-if="store.mountInfo.CanSetPark" @click="setAsPark" :class="['default-button-cyan', statusClass]">
    {{ $t('components.mount.control.set_as_park') }}
  </button>
</template>

<script setup>
import { ref } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

const store = apiStore();

const statusClass = ref('');

async function setAsPark() {
  try {
    const response = await apiService.mountAction('set-park-position');
    console.log('setAsPark', response);
    if (!response.Success) return;

    // Button grün leuchten lassen
    statusClass.value = 'glow-green';
  } catch (error) {
    console.log('Error set as park', error);

    // Button rot leuchten lassen
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
