<template>
  <div v-if="store.isPINS" class="w-full">
    <button
      @click="execute"
      :disabled="loading"
      class="default-button-cyan w-full h-8 md:h-9 text-xs md:text-sm"
    >
      {{ $t('components.filterwheel.settings.Calibrate') }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';

const { t } = useI18n();
const store = apiStore();
const toastStore = useToastStore();
const loading = ref(false);

async function execute() {
  loading.value = true;
  try {
    const response = await apiService.filterAction('send-command?command=Calibrate');
    if (!response?.Success) {
      toastStore.showToast({
        type: 'error',
        title: t('components.filterwheel.settings.Calibrate'),
        message: response?.Error ?? t('components.filterwheel.settings.commandFailed'),
      });
    }
  } catch (error) {
    toastStore.showToast({
      type: 'error',
      title: t('components.filterwheel.settings.Calibrate'),
      message: error.message,
    });
  } finally {
    loading.value = false;
  }
}
</script>
