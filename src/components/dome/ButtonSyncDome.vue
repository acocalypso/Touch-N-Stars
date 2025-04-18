<template>
  <button
    @click="syncTelescope"
    class="default-button-cyan"
    :class="statusClass"
    :disabled="store.domeInfo.Slewing"
  >
    <label> {{ $t('components.dome.control.sync') }}</label>
    <div
      v-if="store.domeInfo.Slewing"
      class="ml-2 w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
    ></div>
  </button>
</template>

<script setup>
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { handleApiError } from '@/utils/utils';
import { ref } from 'vue';

const store = apiStore();
const statusClass = ref('');

async function syncTelescope() {
  try {
    const response = await apiService.domeAction('sync');
    console.log('syncing telescope', response);
    if (
      handleApiError(response, {
        title: t('components.dome.control.errors.sync'),
      })
    )
      return;
    statusClass.value = 'glow-green';
    console.log('telescope synced');
  } catch (error) {
    console.log('telescope sync error');
  }
  setTimeout(() => {
    statusClass.value = '';
  }, 1000);
}
</script>
<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00; /* Grüner Schein */
}
</style>
