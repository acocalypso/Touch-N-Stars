<template>
    <button @click="stopShutter" class="default-button-red">
      {{ $t('components.dome.control.stop') }}
    </button>
</template>

<script setup>
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

async function stopShutter() {
  try {
    await apiService.domeAction('stop');
    console.log(t('components.dome.control.stop'));
  } catch (error) {
    console.log(t('components.dome.control.errors.stop'));
  }
}
</script>
