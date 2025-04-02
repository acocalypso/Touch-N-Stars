<template>
  <button @click="closeShutter" class="default-button-cyan">
    {{ $t('components.dome.control.close') }}
  </button>
</template>

<script setup>
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';
import handleApiError from '@/utils/utils';

const { t } = useI18n();

async function closeShutter() {
  try {
    const response = await apiService.domeAction('close');
    if (handleApiError(response, {
      title: 'Close Error',
    })) return;
    console.log(t('components.dome.control.close'));
  } catch (error) {
    console.log(t('components.dome.control.errors.close'));
  }
}
</script>
