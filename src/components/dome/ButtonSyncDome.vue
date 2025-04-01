<template>
  <button @click="syncTelescope" class="default-button-cyan">
    {{ $t('components.dome.control.sync') }}
  </button>
</template>

<script setup>
import apiService from '@/services/apiService';

async function syncTelescope() {
  try {
    await apiService.domeAction('sync');
    console.log('telescope synced');
  } catch (error) {
    console.log('telescope sync error');
  }
}
</script>
