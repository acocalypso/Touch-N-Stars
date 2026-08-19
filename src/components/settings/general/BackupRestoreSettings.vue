<template>
  <div
    class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
  >
    <h3 class="font-bold text-base text-cyan-400">
      {{ $t('components.settings.backupRestore.title') }}
    </h3>
    <p class="text-gray-400 text-sm">
      {{ $t('components.settings.backupRestore.description') }}
    </p>

    <div
      class="text-yellow-400 text-sm bg-yellow-900/30 border border-yellow-700 rounded px-3 py-2"
    >
      {{ $t('components.settings.backupRestore.profileWarning') }}
    </div>

    <button @click="exportBackup" :disabled="busy" class="tns-btn-secondary w-full">
      {{ $t('components.settings.backupRestore.exportButton') }}
    </button>

    <label
      class="tns-btn-secondary w-full cursor-pointer"
      :class="{ 'opacity-50 pointer-events-none': busy }"
    >
      {{ $t('components.settings.backupRestore.importButton') }}
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        class="hidden"
        @change="onFileSelected"
      />
    </label>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToastStore } from '@/store/toastStore';
import { exportSettingsBackup, importSettingsBackup } from '@/utils/settingsBackup';
import appVersion from '@/version';

const { t } = useI18n();
const toastStore = useToastStore();
const fileInput = ref(null);
const busy = ref(false);

async function exportBackup() {
  busy.value = true;
  try {
    const result = await exportSettingsBackup({ appVersion });
    toastStore.showToast({
      type: 'success',
      title: t('components.settings.backupRestore.title'),
      message: t('components.settings.backupRestore.exportSuccess', {
        count: result.keyCount,
        filename: result.filename,
      }),
    });
  } catch (error) {
    console.error('Settings backup export failed:', error);
    toastStore.showToast({
      type: 'error',
      title: t('components.settings.backupRestore.title'),
      message: t('components.settings.backupRestore.exportError'),
      autoClose: false,
    });
  } finally {
    busy.value = false;
  }
}

async function onFileSelected(event) {
  const file = event.target.files?.[0];
  // Always clear the input so re-picking the same file fires @change again.
  event.target.value = '';
  if (!file) return;

  const confirmed = await toastStore.showConfirmation(
    t('components.settings.backupRestore.confirmImportTitle'),
    t('components.settings.backupRestore.confirmImportMessage')
  );
  if (!confirmed) return;

  busy.value = true;
  try {
    const text = await file.text();
    const restored = importSettingsBackup(text);
    toastStore.showToast({
      type: 'success',
      title: t('components.settings.backupRestore.title'),
      message: t('components.settings.backupRestore.importSuccess', { count: restored }),
    });
    // The persistence plugin hydrates stores only on creation, and several
    // composables read their key once at module init - a reload is the only way
    // to make every restored value take effect. Same approach as the instance
    // switch in settingsStore._applyEndpointChange().
    setTimeout(() => window.location.reload(), 1500);
  } catch (error) {
    console.error('Settings backup import failed:', error);
    toastStore.showToast({
      type: 'error',
      title: t('components.settings.backupRestore.title'),
      message: t('components.settings.backupRestore.importError', { error: error.message }),
      autoClose: false,
    });
    busy.value = false;
  }
}
</script>
