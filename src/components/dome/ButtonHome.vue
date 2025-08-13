<template>
  <button @click="homeDome" class="default-button-cyan" :class="statusClass">
    {{ $t('components.dome.control.home') }}
  </button>
</template>

<script setup>
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';

const { t } = useI18n();
const statusClass = ref('');

async function homeDome() {
  try {
    await apiService.domeAction('home');
    statusClass.value = 'glow-green';
    console.log(t('components.dome.control.home'));
  } catch (error) {
    console.log(t('components.dome.control.errors.home'));
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
