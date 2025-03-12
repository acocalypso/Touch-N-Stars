<template>
  <div v-if="devices.length">
    <ul>
      <li v-for="device in devices" :key="device.id">{{ device.name }}</li>
    </ul>
  </div>
  <p v-else>Keine Geräte gefunden.</p>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

const store = apiStore();
const devices = ref([]);

async function getDevices() {
  try {
    const response = await apiService.cameraAction('list-devices');
    devices.value = response; // Speichert die Geräte in der `ref`
  } catch (error) {
    console.error('Fehler:', error);
  }
}

onMounted(async () => {
  await getDevices();
});
</script>
