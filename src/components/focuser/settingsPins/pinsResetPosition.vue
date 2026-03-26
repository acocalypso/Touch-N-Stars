<template>
  <div v-if="isAvailable" class="w-full">
    <button
      @click="execute"
      :disabled="loading"
      class="default-button-cyan w-full h-8 md:h-9 text-xs md:text-sm"
    >
      {{ $t('components.focuser.settings.ResetPosition') }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import apiService from '@/services/apiService';
import { useFocuserStore } from '@/store/focuserStore';
import { useToastStore } from '@/store/toastStore';

const { t } = useI18n();
const focuserStore = useFocuserStore();
const toastStore = useToastStore();
const loading = ref(false);
const isAvailable = ref(false);

onMounted(() => {
  isAvailable.value = focuserStore.focuserSettings !== undefined;
});

async function execute() {
  loading.value = true;
  try {
    const response = await apiService.focusAction('send-command?command=ResetPosition');
    if (!response?.Success) {
      toastStore.showToast({
        type: 'error',
        title: t('components.focuser.settings.ResetPosition'),
        message: response?.Error ?? t('components.focuser.settings.commandFailed'),
      });
    }
  } catch (error) {
    toastStore.showToast({
      type: 'error',
      title: t('components.focuser.settings.ResetPosition'),
      message: error.message,
    });
  } finally {
    loading.value = false;
  }
}
</script>
