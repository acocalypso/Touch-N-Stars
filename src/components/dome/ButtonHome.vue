<template>
  <button @click="homeDome" class="default-button-cyan">
    {{ $t('components.dome.control.home') }}
  </button>
</template>

<script setup>
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';
import { handleApiError } from '@/utils/utils';

const { t } = useI18n();

async function homeDome() {
  try {
    const response = await apiService.domeAction('home');
    if (
      handleApiError(response, {
        title: t('components.dome.control.errors.home'),
      })
    )
      return;
    console.log(t('components.dome.control.home'));
  } catch (error) {
    console.log(t('components.dome.control.errors.home'));
  }
}
</script>
