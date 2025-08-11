<template>
  <button @click="closeShutter" class="default-button-cyan w-full" :class="statusClass">
    {{ $t('components.dome.control.close') }}
  </button>
</template>

<script setup>
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';

const { t } = useI18n();
const statusClass = ref('');

async function closeShutter() {
  try {
    const response = await apiService.domeAction('close');
    statusClass.value = 'glow-green';
    console.log(t('components.dome.control.close'));
  } catch (error) {
    console.log(t('components.dome.control.errors.close'));
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
