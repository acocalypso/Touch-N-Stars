<template>
  <button
    @click="syncTelescope"
    class="flex h-10 w-full min-w-28 rounded-md text-white font-medium transition-colors bg-cyan-800 items-center justify-center disabled:opacity-50"
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

const store = apiStore();

async function syncTelescope() {
  try {
    await apiService.domeAction('sync');
    console.log('telescope synced');
  } catch (error) {
    console.log('telescope sync error');
  }
}
</script>
