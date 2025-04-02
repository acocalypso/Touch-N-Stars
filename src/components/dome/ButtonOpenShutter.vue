<template>
  <button @click="openShutter" class="default-button-cyan">
    {{ $t('components.dome.control.open') }}
  </button>
</template>

<script setup>
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';
import { handleApiError } from '@/utils/utils';

const { t } = useI18n();

async function openShutter() {
  try {
    const response = await apiService.domeAction('open');
    if (handleApiError(response, {
      title: 'Slew Error',
    })) return;
    console.log(t('components.dome.control.open'));
  } catch (error) {
    console.log(t('components.dome.control.errors.open'));
  }
}
</script>
