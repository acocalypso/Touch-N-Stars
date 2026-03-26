<template>
  <div v-if="isAvailable" class="w-full">
    <button
      @click="execute"
      :disabled="loading"
      class="default-button-cyan w-full h-8 md:h-9 text-xs md:text-sm"
    >
      {{ $t('components.focuser.settings.ClearStall') }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiService from '@/services/apiService';
import { useFocuserStore } from '@/store/focuserStore';

const focuserStore = useFocuserStore();
const loading = ref(false);
const isAvailable = ref(false);

onMounted(() => {
  isAvailable.value = focuserStore.focuserSettings?.IsStalled !== undefined;
});

async function execute() {
  loading.value = true;
  try {
    await apiService.focusAction('send-command?command=ClearStall');
    await focuserStore.readSettings();
  } catch (error) {
    console.log('[pinsClearStall] Error:', error);
  } finally {
    loading.value = false;
  }
}
</script>
