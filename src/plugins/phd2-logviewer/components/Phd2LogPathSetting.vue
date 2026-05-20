<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2 min-w-0">
      <div
        class="flex-1 overflow-x-auto scrollbar-hide px-3 py-2 rounded-lg border border-gray-600/50 bg-gray-800/40 min-w-0"
        :class="{ 'glow-green': saveSuccess }"
      >
        <span
          class="text-sm font-mono whitespace-nowrap"
          :class="path ? 'text-gray-200' : 'text-gray-500 italic'"
          >{{ path || t('plugins.phd2logviewer.settings.placeholder') }}</span
        >
      </div>
      <button
        type="button"
        class="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-sm text-gray-200 transition-colors shrink-0"
        @click="showBrowser = true"
      >
        ...
      </button>
    </div>
    <p v-if="statusMsg" class="text-xs text-red-400">{{ statusMsg }}</p>
    <FileBrowser
      v-model="showBrowser"
      :initial-path="path"
      mode="folder"
      @select="onPathSelected"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToastStore } from '@/store/toastStore';
import apiService from '@/services/apiService';
import FileBrowser from '@/components/helpers/fileBrowser.vue';

const emit = defineEmits(['path-changed']);

const { t } = useI18n();
const toast = useToastStore();

const SETTING_KEY = 'phd2_logviewer_path';

const path = ref('');
const showBrowser = ref(false);
const saveSuccess = ref(false);
const statusMsg = ref('');

onMounted(async () => {
  try {
    const res = await apiService.getSetting(SETTING_KEY);
    path.value = res?.Response?.Value || '';
  } catch {
    // not yet saved — leave empty
  }
});

async function onPathSelected(selectedPath) {
  path.value = selectedPath;
  statusMsg.value = '';
  try {
    try {
      await apiService.createSetting({ Key: SETTING_KEY, Value: selectedPath });
    } catch (e) {
      if (e.response?.status === 409) {
        await apiService.updateSetting(SETTING_KEY, selectedPath);
      } else {
        throw e;
      }
    }
    saveSuccess.value = true;
    setTimeout(() => (saveSuccess.value = false), 2000);
    emit('path-changed', selectedPath);
  } catch {
    statusMsg.value = t('plugins.phd2logviewer.settings.saveError');
    toast.showToast({
      type: 'error',
      title: t('plugins.phd2logviewer.settings.saveError'),
      message: '',
      autoClose: false,
    });
  }
}
</script>
