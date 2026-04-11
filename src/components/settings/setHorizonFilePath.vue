<template>
  <div class="flex flex-col gap-2">
    <!-- Input Row -->
    <div>
      <div class="flex items-center gap-2">
        <input
          v-model="path"
          type="text"
          :placeholder="$t('components.settings.horizonFilePath.placeholder')"
          class="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-sm text-gray-200 placeholder-gray-500"
        />

        <button
          @click="savePath"
          :disabled="!path || saving"
          class="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
        >
          <span v-if="saving">{{ $t('components.settings.imageSavePath.saving') }}</span>
          <span v-else>{{ $t('components.settings.imageSavePath.save') }}</span>
        </button>
      </div>
    </div>

    <!-- Status feedback -->
    <p v-if="statusMsg" class="text-xs" :class="statusOk ? 'text-green-400' : 'text-red-400'">
      {{ statusMsg }}
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';
import apiService from '@/services/apiService';

const { t } = useI18n();
const store = apiStore();
const toast = useToastStore();

const path = ref('');
const saving = ref(false);
const statusMsg = ref('');
const statusOk = ref(true);

onMounted(() => {
  path.value = store.profileInfo?.AstrometrySettings?.HorizonFilePath || '';
});

async function savePath() {
  if (!path.value) return;
  saving.value = true;
  statusMsg.value = '';
  try {
    await apiService.setHorizonFilePath(path.value);
    statusOk.value = true;
    statusMsg.value = `${t('components.settings.imageSavePath.savedMsg')} ${path.value}`;
    toast.showToast({
      type: 'success',
      title: t('components.settings.horizonFilePath.toastTitle'),
      message: path.value,
    });
  } catch (e) {
    statusOk.value = false;
    statusMsg.value = t('components.settings.imageSavePath.errorMsg');
    toast.showToast({
      type: 'error',
      title: t('components.settings.imageSavePath.toastErrorTitle'),
      message: t('components.settings.imageSavePath.toastErrorMsg'),
      autoClose: false,
    });
  } finally {
    saving.value = false;
  }
}
</script>
