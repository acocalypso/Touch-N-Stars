<template>
  <button @click="parkDome" class="default-button-cyan">
    {{ $t('components.dome.control.park') }}
  </button>
</template>

<script setup>
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';
import { handleApiError } from '@/utils/utils';

const { t } = useI18n();

async function parkDome() {
  try {
    const response = await apiService.domeAction('park');
    if (
      handleApiError(response, {
        title: t('components.dome.control.errors.park'),
      })
    )
      return;
    console.log(t('components.dome.control.park'));
  } catch (error) {
    console.log(t('components.dome.control.errors.park'));
  }
}
</script>
