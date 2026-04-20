<template>
  <div class="container py-4 sm:py-8 px-3 sm:px-4">
    <div class="mx-auto max-w-6xl">
      <div class="mb-4 flex flex-col gap-2">
        <h1 class="text-xl sm:text-2xl font-bold text-white">
          {{ $t('plugins.filebrowser.title') }}
        </h1>
        <p class="text-sm text-gray-400">
          {{ $t('plugins.filebrowser.subtitle') }}
        </p>
      </div>

      <div class="rounded-xl border border-gray-700 bg-gray-900/70 overflow-hidden">
        <FilebrowserTopControls
          :current-path="currentPath"
          :can-go-up="canGoUp"
          :is-loading="isLoading"
          :show-images-only="showImagesOnly"
          :directories-count="directories.length"
          :files-count="filteredFiles.length"
          :new-folder-name="newFolderName"
          :breadcrumbs="breadcrumbs"
          @update:show-images-only="showImagesOnly = $event"
          @update:new-folder-name="newFolderName = $event"
          @jump-to-image-path="jumpToImageSavePath"
          @go-up="goUp"
          @refresh="refreshCurrent"
          @create-directory="createDirectory"
          @browse="browse"
        />

        <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] min-h-[460px]">
          <FilebrowserListPanel
            :is-loading="isLoading"
            :error-message="errorMessage"
            :directories="directories"
            :files="filteredFiles"
            :selected-path="selectedPath"
            :format-size="formatSize"
            :get-file-extension="getFileExtension"
            @open-directory="openDirectory"
            @select-file="selectFile"
            @open-file="openFile"
            @rename-entry="openRenameDialog"
            @delete-directory="deleteDirectory"
            @delete-file="deleteFile"
          />

          <FilebrowserDetailsPanel
            :selected-entry="selectedEntry"
            :selected-entry-type="selectedEntryType"
            :selected-entry-type-label="selectedEntryTypeLabel"
            :is-selected-entry-image="isSelectedEntryImage"
            :format-size="formatSize"
            :format-date-time="formatDateTime"
            @open-file="openFile"
            @rename-entry="openRenameDialog"
          />
        </div>
      </div>
    </div>

    <FilebrowserPreviewModal
      :visible="previewVisible"
      :loading="previewLoading"
      :error="previewError"
      :mode="previewMode"
      :url="previewUrl"
      :file-name="previewFileName"
      :stats="fitsStats"
      :perf="fitsPerf"
      :header-entries="fitsHeaderEntries"
      :stretch-mode="fitsStretchMode"
      :stretch-strength="fitsStretchStrength"
      @close="closePreview"
      @image-error="handlePreviewError"
      @update:stretch-mode="fitsStretchMode = $event"
      @update:stretch-strength="fitsStretchStrength = $event"
      @set-canvas-ref="setFitsCanvasRef"
    />

    <FilebrowserRenameDialog
      :visible="renameDialogVisible"
      :title="renameDialogTitle"
      :error="renameDialogError"
      :input-value="renameInputValue"
      @update:input-value="renameInputValue = $event"
      @close="closeRenameDialog"
      @confirm="confirmRenameDialog"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';
import FilebrowserTopControls from '@/plugins/filebrowser/components/FilebrowserTopControls.vue';
import FilebrowserListPanel from '@/plugins/filebrowser/components/FilebrowserListPanel.vue';
import FilebrowserDetailsPanel from '@/plugins/filebrowser/components/FilebrowserDetailsPanel.vue';
import FilebrowserPreviewModal from '@/plugins/filebrowser/components/FilebrowserPreviewModal.vue';
import FilebrowserRenameDialog from '@/plugins/filebrowser/components/FilebrowserRenameDialog.vue';
import { useFitsPreview } from '@/plugins/filebrowser/composables/useFitsPreview';

const { t } = useI18n();
const store = apiStore();
const toastStore = useToastStore();

const IMAGE_FILE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'tif',
  'tiff',
  'fit',
  'fits',
  'fts',
];

const currentPath = ref('');
const parentPath = ref('');
const directories = ref([]);
const files = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const newFolderName = ref('');
const selectedPath = ref('');
const showImagesOnly = ref(true);
const selectedEntry = ref(null);
const selectedEntryType = ref(null);

const renameDialogVisible = ref(false);
const renameDialogError = ref('');
const renameInputValue = ref('');
const renameTarget = ref(null);

const {
  previewVisible,
  previewUrl,
  previewFileName,
  previewMode,
  previewLoading,
  previewError,
  fitsStretchMode,
  fitsStretchStrength,
  fitsStats,
  fitsHeaderEntries,
  fitsPerf,
  closePreview,
  openFile,
  handlePreviewError,
  setFitsCanvasRef,
} = useFitsPreview({ apiService });

const filteredFiles = computed(() => {
  if (!showImagesOnly.value) {
    return files.value;
  }

  return files.value.filter((file) => IMAGE_FILE_EXTENSIONS.includes(getFileExtension(file.name)));
});

const selectedEntryTypeLabel = computed(() => {
  if (selectedEntryType.value === 'directory') {
    return t('plugins.filebrowser.directory');
  }

  if (selectedEntryType.value === 'file') {
    return t('plugins.filebrowser.file');
  }

  return '—';
});

const isSelectedEntryImage = computed(() => {
  if (selectedEntryType.value !== 'file' || !selectedEntry.value) {
    return false;
  }

  return IMAGE_FILE_EXTENSIONS.includes(getFileExtension(selectedEntry.value.name));
});

const renameDialogTitle = computed(() => {
  if (!renameTarget.value) {
    return t('common.edit');
  }

  const typeLabel =
    renameTarget.value.entryType === 'file'
      ? t('plugins.filebrowser.file')
      : t('plugins.filebrowser.directory');

  return `${t('common.edit')} ${typeLabel}`;
});

const canGoUp = computed(() => {
  return !!parentPath.value && parentPath.value !== currentPath.value;
});

const breadcrumbs = computed(() => {
  const path = currentPath.value;
  if (!path) {
    return [];
  }

  const isWindows = path.includes('\\');
  const separator = isWindows ? '\\' : '/';
  const parts = path.split(separator).filter(Boolean);

  return parts.map((label, idx) => {
    let builtPath = parts.slice(0, idx + 1).join(separator);

    if (idx === 0 && isWindows) {
      builtPath += separator;
    }

    if (!isWindows) {
      builtPath = '/' + builtPath;
    }

    return {
      label,
      path: builtPath,
    };
  });
});

function getFileExtension(name) {
  return String(name || '')
    .split('.')
    .pop()
    ?.toLowerCase();
}

function formatSize(bytes) {
  if (bytes == null) {
    return '—';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(isoDate) {
  if (!isoDate) {
    return '—';
  }

  const date = new Date(isoDate);
  return date.toLocaleString();
}

function clearSelection() {
  selectedEntry.value = null;
  selectedEntryType.value = null;
  selectedPath.value = '';
}

function openRenameDialog(entry, entryType) {
  if (!entry?.path || !entry?.name) {
    return;
  }

  renameTarget.value = {
    path: entry.path,
    name: entry.name,
    entryType,
  };

  renameDialogError.value = '';
  renameInputValue.value = entry.name;
  renameDialogVisible.value = true;
}

function closeRenameDialog() {
  renameDialogVisible.value = false;
  renameDialogError.value = '';
  renameInputValue.value = '';
  renameTarget.value = null;
}

function setSelectedDirectory(path) {
  if (!path) {
    clearSelection();
    return;
  }

  const name = String(path).split(/[/\\]/).filter(Boolean).pop() || path;
  selectedEntry.value = { name, path };
  selectedEntryType.value = 'directory';
  selectedPath.value = path;
}

async function browse(path = '') {
  errorMessage.value = '';
  isLoading.value = true;
  closePreview();

  try {
    const response = await apiService.browseFilesystem(path || '');
    if (!response?.success) {
      throw new Error(response?.error || t('plugins.filebrowser.loadError'));
    }

    currentPath.value = response.currentPath || path || '';
    parentPath.value = response.parentPath || '';
    directories.value = Array.isArray(response.directories) ? response.directories : [];
    files.value = Array.isArray(response.files) ? response.files : [];
    setSelectedDirectory(currentPath.value);
  } catch (error) {
    errorMessage.value = error?.message || t('plugins.filebrowser.loadError');
    directories.value = [];
    files.value = [];
    clearSelection();
  } finally {
    isLoading.value = false;
  }
}

function refreshCurrent() {
  browse(currentPath.value);
}

function goUp() {
  if (!canGoUp.value) {
    return;
  }

  browse(parentPath.value);
}

function openDirectory(directory) {
  browse(directory.path);
}

function selectFile(file) {
  selectedEntry.value = file;
  selectedEntryType.value = 'file';
  selectedPath.value = file.path;
}

function buildSiblingPath(sourcePath, newName) {
  const source = String(sourcePath || '');
  const isWindows = source.includes('\\');
  const separator = isWindows ? '\\' : '/';
  const normalized = source.replace(/[/\\]+$/, '');
  const lastSeparator = normalized.lastIndexOf(separator);

  if (lastSeparator < 0) {
    return newName;
  }

  if (!isWindows && lastSeparator === 0) {
    return `${separator}${newName}`;
  }

  return `${normalized.slice(0, lastSeparator)}${separator}${newName}`;
}

async function confirmRenameDialog() {
  const target = renameTarget.value;
  if (!target?.path || !target?.name) {
    return;
  }

  const nextName = renameInputValue.value.trim();
  if (!nextName) {
    renameDialogError.value = t('plugins.filebrowser.loadError');
    return;
  }

  if (nextName === target.name) {
    closeRenameDialog();
    return;
  }

  const targetPath = buildSiblingPath(target.path, nextName);

  try {
    await apiService.renameFilesystemEntry(target.path, targetPath);
    closeRenameDialog();
    await browse(currentPath.value);

    if (target.entryType === 'file') {
      const renamedFile = files.value.find((file) => file.path === targetPath);
      if (renamedFile) {
        selectFile(renamedFile);
      }
    } else {
      setSelectedDirectory(targetPath);
    }
  } catch (error) {
    renameDialogError.value = error?.message || t('plugins.filebrowser.loadError');
  }
}

async function createDirectory() {
  const folderName = newFolderName.value.trim();
  if (!folderName || !currentPath.value) {
    return;
  }

  const isWindows = currentPath.value.includes('\\');
  const separator = isWindows ? '\\' : '/';
  const newDirectoryPath = currentPath.value.replace(/[/\\]+$/, '') + separator + folderName;

  try {
    await apiService.createFilesystemDirectory(newDirectoryPath);
    newFolderName.value = '';
    await browse(currentPath.value);
  } catch (error) {
    errorMessage.value = error?.message || t('plugins.filebrowser.createError');
  }
}

async function deleteDirectory(directory) {
  const confirmed = await toastStore.showConfirmation(
    t('plugins.filebrowser.deleteDirectoryTitle'),
    t('plugins.filebrowser.deleteDirectoryMessage', { name: directory.name }),
    t('common.delete'),
    t('common.cancel')
  );

  if (!confirmed) {
    return;
  }

  try {
    await apiService.deleteFilesystemDirectory(directory.path);
    await browse(currentPath.value);
  } catch (error) {
    errorMessage.value = error?.message || t('plugins.filebrowser.deleteError');
  }
}

async function deleteFile(file) {
  const confirmed = await toastStore.showConfirmation(
    t('plugins.filebrowser.deleteFileTitle'),
    t('plugins.filebrowser.deleteFileMessage', { name: file.name }),
    t('common.delete'),
    t('common.cancel')
  );

  if (!confirmed) {
    return;
  }

  try {
    await apiService.deleteFilesystemFile(file.path);
    await browse(currentPath.value);
  } catch (error) {
    errorMessage.value = error?.message || t('plugins.filebrowser.deleteError');
  }
}

async function jumpToImageSavePath() {
  const path = store.imageSavePath || '';
  if (!path) {
    await browse('');
    return;
  }

  await browse(path);
  if (errorMessage.value) {
    await browse('');
  }
}

onMounted(() => {
  jumpToImageSavePath();
});
</script>
