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
        <div class="border-b border-gray-700 p-3 sm:p-4 flex flex-col gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <div
              class="flex-1 overflow-x-auto scrollbar-thin px-3 py-2 rounded-lg border border-gray-600/50 bg-gray-800/40 min-w-0"
            >
              <span
                class="text-sm font-mono whitespace-nowrap"
                :class="currentPath ? 'text-gray-200' : 'text-gray-500 italic'"
              >
                {{ currentPath || $t('components.settings.imageSavePath.placeholder') }}
              </span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              class="h-9 px-3 rounded-md border border-gray-600 bg-gray-800 text-sm text-gray-100 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="jumpToImageSavePath"
            >
              {{ $t('plugins.filebrowser.jumpToImagePath') }}
            </button>
            <button
              class="h-9 px-3 rounded-md border border-gray-600 bg-gray-800 text-sm text-gray-100 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="!canGoUp || isLoading"
              @click="goUp"
            >
              {{ $t('plugins.filebrowser.goUp') }}
            </button>
            <button
              class="h-9 px-3 rounded-md border border-gray-600 bg-gray-800 text-sm text-gray-100 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="isLoading"
              @click="refreshCurrent"
            >
              {{ $t('plugins.filebrowser.refresh') }}
            </button>
            <label class="ml-auto flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                v-model="showImagesOnly"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-500"
              />
              <span>{{ $t('plugins.filebrowser.imagesOnly') }}</span>
            </label>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="px-2 py-1 rounded bg-gray-800 text-gray-300">
              {{ $t('plugins.filebrowser.directoriesCount', { count: directories.length }) }}
            </span>
            <span class="px-2 py-1 rounded bg-gray-800 text-gray-300">
              {{ $t('plugins.filebrowser.filesCount', { count: filteredFiles.length }) }}
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <input
              v-model="newFolderName"
              class="w-full sm:w-80 rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-cyan-600"
              :placeholder="$t('plugins.filebrowser.newFolderPlaceholder')"
              @keydown.enter="createDirectory"
            />
            <button
              class="h-9 px-3 rounded-md border border-cyan-700 bg-cyan-900/40 text-sm text-cyan-100 hover:bg-cyan-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="isLoading || !newFolderName.trim()"
              @click="createDirectory"
            >
              {{ $t('plugins.filebrowser.createFolder') }}
            </button>
          </div>

          <div
            v-if="breadcrumbs.length"
            class="flex flex-wrap items-center gap-1 text-xs sm:text-sm"
          >
            <button
              v-for="(crumb, idx) in breadcrumbs"
              :key="crumb.path"
              class="rounded px-2 py-1 transition-colors"
              :class="
                idx === breadcrumbs.length - 1
                  ? 'bg-gray-700 text-gray-100 cursor-default'
                  : 'text-cyan-300 hover:bg-gray-800'
              "
              :disabled="idx === breadcrumbs.length - 1"
              @click="browse(crumb.path)"
            >
              {{ crumb.label }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] min-h-[460px]">
          <div class="border-r border-gray-700">
            <div
              v-if="isLoading"
              class="h-full min-h-[260px] flex items-center justify-center text-gray-400"
            >
              {{ $t('plugins.filebrowser.loading') }}
            </div>

            <div
              v-else-if="errorMessage"
              class="h-full min-h-[260px] flex items-center justify-center px-4 text-center text-red-400"
            >
              {{ errorMessage }}
            </div>

            <div
              v-else-if="!directories.length && !filteredFiles.length"
              class="h-full min-h-[260px] flex items-center justify-center text-gray-500"
            >
              {{ $t('plugins.filebrowser.empty') }}
            </div>

            <ul v-else class="divide-y divide-gray-800">
              <li
                v-for="dir in directories"
                :key="dir.path"
                class="group flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 sm:px-4 py-2 hover:bg-gray-800/60"
                :class="selectedPath === dir.path ? 'bg-cyan-900/15' : ''"
              >
                <button
                  class="flex w-full sm:w-auto min-w-0 sm:flex-1 items-center gap-3 text-left"
                  @click="openDirectory(dir)"
                >
                  <svg
                    class="h-4 w-4 text-amber-400 shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
                    />
                  </svg>
                  <span class="truncate text-sm text-gray-100">{{ dir.name }}</span>
                </button>

                <div class="ml-auto flex w-full sm:w-auto justify-end items-center gap-2">
                  <button
                    class="h-8 w-8 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors flex items-center justify-center"
                    :title="$t('common.edit')"
                    @click="renameEntry(dir, 'directory')"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                  <button
                    class="h-8 w-8 rounded-md border border-red-800 text-red-300 hover:bg-red-900/30 transition-colors flex items-center justify-center"
                    @click="deleteDirectory(dir)"
                    :title="$t('common.delete')"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </li>

              <li
                v-for="file in filteredFiles"
                :key="file.path"
                class="group flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 sm:px-4 py-2 hover:bg-gray-800/60"
                :class="selectedPath === file.path ? 'bg-cyan-900/15' : ''"
              >
                <button
                  class="flex w-full sm:w-auto min-w-0 sm:flex-1 items-center gap-3 text-left"
                  @click="selectFile(file)"
                >
                  <svg
                    class="h-4 w-4 text-slate-400 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span class="truncate text-sm text-gray-100">{{ file.name }}</span>
                </button>

                <div class="ml-auto flex w-full sm:w-auto justify-end items-center gap-2">
                  <span class="hidden sm:inline text-xs text-gray-500">{{
                    formatSize(file.size)
                  }}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 uppercase">
                    {{ getFileExtension(file.name) || 'file' }}
                  </span>
                  <button
                    class="h-8 w-8 rounded-md border border-cyan-700 text-cyan-300 hover:bg-cyan-900/20 transition-colors flex items-center justify-center"
                    :title="$t('plugins.filebrowser.openFolder')"
                    @click="openFile(file)"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M15 3h6v6" />
                      <path d="M10 14 21 3" />
                      <path d="M21 14v7h-7" />
                      <path d="M3 10v11h11" />
                    </svg>
                  </button>
                  <button
                    class="h-8 w-8 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors flex items-center justify-center"
                    :title="$t('common.edit')"
                    @click="renameEntry(file, 'file')"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                  <button
                    class="h-8 w-8 rounded-md border border-red-800 text-red-300 hover:bg-red-900/30 transition-colors flex items-center justify-center"
                    @click="deleteFile(file)"
                    :title="$t('common.delete')"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <div class="p-4 flex flex-col gap-4 bg-gray-900/40">
            <h3 class="text-sm font-semibold text-gray-200">
              {{ $t('plugins.filebrowser.details') }}
            </h3>

            <div
              v-if="selectedEntry"
              class="rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm"
            >
              <p class="text-gray-300 break-all font-medium">{{ selectedEntry.name }}</p>
              <p class="text-xs text-gray-500 mt-1 break-all">{{ selectedEntry.path }}</p>

              <div class="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-400">
                <div>
                  <span class="text-gray-500">{{ $t('plugins.filebrowser.type') }}:</span>
                  <span class="ml-2 text-gray-300">{{ selectedEntryTypeLabel }}</span>
                </div>
                <div v-if="selectedEntryType === 'file'">
                  <span class="text-gray-500">{{ $t('plugins.filebrowser.size') }}:</span>
                  <span class="ml-2 text-gray-300">{{ formatSize(selectedEntry.size) }}</span>
                </div>
                <div v-if="selectedEntryType === 'file'">
                  <span class="text-gray-500">{{ $t('plugins.filebrowser.modified') }}:</span>
                  <span class="ml-2 text-gray-300">{{
                    formatDateTime(selectedEntry.lastModified)
                  }}</span>
                </div>
                <div v-if="selectedEntryType === 'file'">
                  <span class="text-gray-500">{{ $t('plugins.filebrowser.isImage') }}:</span>
                  <span
                    class="ml-2"
                    :class="isSelectedEntryImage ? 'text-green-400' : 'text-gray-300'"
                  >
                    {{ isSelectedEntryImage ? $t('general.yes') : $t('general.no') }}
                  </span>
                </div>
              </div>
            </div>

            <div
              v-else
              class="rounded-lg border border-dashed border-gray-700 p-4 text-sm text-gray-500"
            >
              {{ $t('plugins.filebrowser.selectEntryHint') }}
            </div>

            <div v-if="selectedEntry" class="rounded-lg border border-gray-700 bg-gray-800/30 p-3">
              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-if="selectedEntryType === 'file'"
                  class="h-9 px-3 rounded-md border border-cyan-700 text-cyan-300 hover:bg-cyan-900/20 transition-colors text-xs"
                  @click="openFile(selectedEntry)"
                >
                  {{ $t('plugins.filebrowser.openFolder') }}
                </button>
                <button
                  class="h-9 px-3 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors text-xs"
                  @click="renameEntry(selectedEntry, selectedEntryType)"
                >
                  {{ $t('common.edit') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="previewVisible"
        class="fixed inset-0 z-top bg-black/75 backdrop-blur-sm p-4 flex items-center justify-center"
        @click.self="closePreview"
      >
        <div
          class="w-full max-w-5xl max-h-[92vh] bg-[#1a1f2e] border border-[#2e3650] rounded-lg overflow-hidden shadow-xl"
        >
          <div class="flex items-center justify-between px-4 py-3 border-b border-[#2e3650]">
            <p class="text-sm font-semibold text-slate-200 truncate pr-4">{{ previewFileName }}</p>
            <button
              class="text-slate-500 text-sm px-2 py-1 rounded hover:text-slate-200 hover:bg-[#2e3650] transition-colors"
              @click="closePreview"
            >
              ✕
            </button>
          </div>
          <div class="p-3 bg-[#0f1420] max-h-[calc(92vh-56px)] overflow-auto">
            <img
              :src="previewUrl"
              :alt="previewFileName"
              class="mx-auto max-w-full max-h-[calc(92vh-92px)] object-contain"
              @error="handlePreviewError"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';

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

const PREVIEWABLE_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tif', 'tiff'];

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
const previewVisible = ref(false);
const previewUrl = ref('');
const previewFileName = ref('');

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

function closePreview() {
  previewVisible.value = false;
  previewUrl.value = '';
  previewFileName.value = '';
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

function isPreviewableImage(fileName) {
  return PREVIEWABLE_IMAGE_EXTENSIONS.includes(getFileExtension(fileName));
}

function openFile(file) {
  if (!file?.path) {
    return;
  }

  const streamUrl = apiService.getFilesystemFileStreamUrl(file.path);

  if (isPreviewableImage(file.name)) {
    previewFileName.value = file.name || file.path;
    previewUrl.value = streamUrl;
    previewVisible.value = true;
    return;
  }

  window.open(streamUrl, '_blank', 'noopener');
}

function handlePreviewError() {
  const fallbackUrl = previewUrl.value;
  closePreview();
  if (fallbackUrl) {
    window.open(fallbackUrl, '_blank', 'noopener');
  }
}

async function renameEntry(entry, entryType) {
  if (!entry?.path || !entry?.name) {
    return;
  }

  const typeLabel =
    entryType === 'file' ? t('plugins.filebrowser.file') : t('plugins.filebrowser.directory');
  const proposedName = window.prompt(`${t('common.edit')} ${typeLabel}`, entry.name);

  if (proposedName === null) {
    return;
  }

  const nextName = proposedName.trim();
  if (!nextName || nextName === entry.name) {
    return;
  }

  const targetPath = buildSiblingPath(entry.path, nextName);

  try {
    await apiService.renameFilesystemEntry(entry.path, targetPath);
    await browse(currentPath.value);

    if (entryType === 'file') {
      const renamedFile = files.value.find((f) => f.path === targetPath);
      if (renamedFile) {
        selectFile(renamedFile);
      }
    } else {
      setSelectedDirectory(targetPath);
    }
  } catch (error) {
    errorMessage.value = error?.message || t('plugins.filebrowser.loadError');
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
