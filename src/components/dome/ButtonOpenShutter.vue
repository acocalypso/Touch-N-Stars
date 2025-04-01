<template>
      <button @click="openShutter" class="default-button-cyan">
        {{ $t('components.dome.control.open') }}
      </button>
  </template>
  
  <script setup>
  import apiService from '@/services/apiService';
  import { useI18n } from 'vue-i18n';
  
  const { t } = useI18n();
  
  async function openShutter() {
    try {
      await apiService.domeAction('open');
      console.log(t('components.dome.control.open'));
    } catch (error) {
      console.log(t('components.dome.control.errors.open'));
    }
  }
  

  </script>
  