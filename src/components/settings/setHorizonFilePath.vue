<template>
  <div class="flex flex-col gap-2">
    <!-- Info Button Row -->
    <div class="flex justify-end">
      <button
        @click="showInfo = true"
        class="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors bg-transparent border-none cursor-pointer"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="8" stroke-width="3" stroke-linecap="round" />
          <line x1="12" y1="12" x2="12" y2="16" stroke-linecap="round" />
        </svg>
        {{ $t('common.help') }}
      </button>
    </div>

    <!-- Input Row -->
    <div>
      <div class="flex items-center gap-2">
        <input
          v-model="path"
          type="text"
          readonly
          :placeholder="$t('components.settings.horizonFilePath.placeholder')"
          class="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-sm text-gray-200 placeholder-gray-500"
        />

        <button
          @click="showBrowser = true"
          class="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-sm text-gray-200 transition-colors"
          :title="$t('components.settings.horizonFilePath.selectTitle')"
        >
          ...
        </button>

        <button
          @click="savePath"
          :disabled="!path || saving"
          class="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
        >
          <span v-if="saving">{{ $t('components.settings.imageSavePath.saving') }}</span>
          <span v-else>{{ $t('components.settings.imageSavePath.save') }}</span>
        </button>
      </div>

      <p v-if="isDirty" class="text-xs text-amber-400 flex items-center gap-1 pt-2">
        <svg
          class="w-3.5 h-3.5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          />
        </svg>
        {{ $t('components.settings.imageSavePath.dirtyHint') }}
      </p>
    </div>

    <!-- Status feedback -->
    <p v-if="statusMsg" class="text-xs" :class="statusOk ? 'text-green-400' : 'text-red-400'">
      {{ statusMsg }}
    </p>

    <!-- FileBrowser Dialog -->
    <FileBrowser
      v-model="showBrowser"
      :initial-path="path"
      :title="$t('components.settings.horizonFilePath.selectTitle')"
      @select="onPathSelected"
    />

    <!-- Info Modal -->
    <Modal :show="showInfo" max-width="max-w-md" @close="showInfo = false">
      <template #header>
        <h2 class="text-base font-semibold text-cyan-400">
          {{ $t('components.settings.horizonFilePath.infoTitle') }}
        </h2>
      </template>
      <template #body>
        <div class="text-sm text-gray-300 space-y-3 w-full">
          <p>{{ $t('components.settings.horizonFilePath.infoStep1') }}</p>
          <div class="bg-gray-900 rounded px-3 py-2 font-mono text-cyan-300 text-xs">
            horizon.hrz
          </div>
          <p>{{ $t('components.settings.horizonFilePath.infoStep2') }}</p>
          <p>{{ $t('components.settings.horizonFilePath.infoStep3') }}</p>
          <p class="text-amber-400 text-xs">
            {{ $t('components.settings.horizonFilePath.infoNote') }}
          </p>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';
import FileBrowser from './fileBrowser.vue';
import Modal from '@/components/helpers/Modal.vue';

const { t } = useI18n();
const store = apiStore();
const toast = useToastStore();

const path = ref('');
const showBrowser = ref(false);
const showInfo = ref(false);
const saving = ref(false);
const statusMsg = ref('');
const statusOk = ref(true);

const originalPath = ref('');
const isDirty = ref(false);

const HORIZON_FILENAME = 'horizon.hrz';

onMounted(() => {
  const stored = store.profileInfo?.AstrometrySettings?.HorizonFilePath || '';
  path.value = stored ? stored.replace(/\/horizon\.hrz$/i, '') : '';
  originalPath.value = path.value;
});

function onPathSelected(selectedPath) {
  path.value = selectedPath.replace(/\/+$/, '');
  isDirty.value = path.value !== originalPath.value;
  statusMsg.value = '';
}

async function savePath() {
  if (!path.value) return;
  saving.value = true;
  statusMsg.value = '';
  const fullPath = path.value.replace(/\/+$/, '') + '/' + HORIZON_FILENAME;
  try {
    await store.setHorizonFilePath(fullPath);
    originalPath.value = path.value;
    isDirty.value = false;
    statusOk.value = true;
    statusMsg.value = `${t('components.settings.imageSavePath.savedMsg')} ${fullPath}`;
    toast.showToast({
      type: 'success',
      title: t('components.settings.horizonFilePath.toastTitle'),
      message: fullPath,
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
