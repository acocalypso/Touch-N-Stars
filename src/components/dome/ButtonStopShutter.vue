<template>
  <button
    @click="stopShutter"
    class="default-button-red w-24"
    :class="statusClass"
  >
    <StopCircleIcon class="w-8 h-8" />
  </button>
</template>

<script setup>
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';
import { handleApiError } from '@/utils/utils';
import { StopCircleIcon } from '@heroicons/vue/24/outline';
import { ref } from 'vue';

const { t } = useI18n();
const statusClass = ref('');

async function stopShutter() {
  try {
    const response = await apiService.domeAction('stop');
    if (
      handleApiError(response, {
        title: t('components.dome.control.errors.stop'),
      })
    )
      return;
    statusClass.value = 'glow-green';
    console.log(t('components.dome.control.stop'));
  } catch (error) {
    console.log(t('components.dome.control.errors.stop'));
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
