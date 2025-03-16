<template>
  <button @click="mountUnpark" :class="['default-button-cyan', statusClass]">
    {{ $t('components.mount.control.unpark') }}
  </button>
</template>

<script setup>
import { ref } from 'vue';
import apiService from '@/services/apiService';

const statusClass = ref('');

async function mountUnpark() {
  try {
    const response = await apiService.mountAction('unpark');
    console.log('mountUnpark', response);

    // Button grün leuchten lassen
    statusClass.value = 'glow-green';
  } catch (error) {
    console.log('Error mountUnpark', error);

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
