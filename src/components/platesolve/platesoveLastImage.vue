<template>
  <div v-if="store.isPINS || true">
    <button @click="platesolveLastImage" :disabled="isLoading">
      <span v-if="isLoading" class="spinner"></span>
      <span>Plate Solve Last Image</span>
    </button>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import apiPinsService from '@/services/apiPinsService';
import { apiStore } from '@/store/store';

const store = apiStore();
const isLoading = ref(false);

async function platesolveLastImage() {
  try {
    isLoading.value = true;
    const response = await apiPinsService.solveLastImage();
    console.log('Plate solve response:', response.data);
    // Handle the response as needed
  } catch (error) {
    console.error('Error during plate solving:', error);
    // Handle the error as needed
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  margin-right: 0.5em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
