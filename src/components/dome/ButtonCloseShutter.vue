<template>
  <button @click="closeShutter" class="default-button-cyan">
    {{ $t('components.dome.control.close') }}
  </button>
</template>

<script setup>
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

async function closeShutter() {
  try {
    await apiService.domeAction('close');
    console.log(t('components.dome.control.close'));
  } catch (error) {
    console.log(t('components.dome.control.errors.close'));
  }
}
</script>
