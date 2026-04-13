<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-top p-4"
      @click.self="cancel"
    >
      <div
        class="bg-[#1a1f2e] border border-[#2e3650] rounded-[10px] w-full max-w-[520px] h-[90vh] flex flex-col overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-4 py-3.5 border-b border-[#2e3650] shrink-0"
        >
          <span class="text-sm font-semibold text-slate-200 tracking-wide">{{
            title || $t('components.fileBrowser.title')
          }}</span>
          <button
            class="text-slate-500 text-sm px-2 py-1 rounded hover:text-slate-200 hover:bg-[#2e3650] transition-colors cursor-pointer bg-transparent border-none"
            @click="cancel"
          >
            ✕
          </button>
        </div>

        <!-- Breadcrumb + Up-Button -->
        <div
          class="flex items-center gap-1 px-3 py-2 border-b border-[#2e3650] bg-[#151a27] shrink-0 min-h-9 overflow-x-auto"
        >
          <button
            class="flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:text-slate-200 hover:bg-[#2e3650] transition-colors cursor-pointer bg-transparent border-none shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="!canGoUp"
            @click="goUp"
            :title="$t('components.fileBrowser.goUp')"
          >
            <svg
              class="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div class="flex items-center flex-wrap gap-0.5 min-w-0">
            <button
              v-for="(crumb, i) in breadcrumbs"
              :key="crumb.path"
              class="flex items-center bg-transparent border-none text-[0.78rem] cursor-pointer px-1 py-0.5 rounded transition-colors whitespace-nowrap"
              :class="
                i === breadcrumbs.length - 1
                  ? 'text-slate-200 cursor-default pointer-events-none'
                  : 'text-slate-500 hover:text-slate-300'
              "
              @click="navigateTo(crumb.path)"
            >
              <span v-if="i > 0" class="text-[#2e3650] mr-0.5 pointer-events-none">›</span>
              {{ crumb.label }}
            </button>
          </div>
        </div>

        <!-- Directory + File List -->
        <div class="flex-1 overflow-y-auto min-h-[160px]">
          <div
            v-if="listLoading"
            class="flex items-center justify-center gap-2 min-h-[140px] text-slate-500 text-sm"
          >
            <span
              class="w-4 h-4 border-2 border-[#2e3650] border-t-cyan-700 rounded-full animate-spin shrink-0"
            ></span>
            <span>{{ $t('components.fileBrowser.loading') }}</span>
          </div>
          <div
            v-else-if="listError"
            class="flex items-center justify-center min-h-[140px] text-red-400 text-sm px-4 text-center"
          >
            {{ listError }}
          </div>
          <div
            v-else-if="directories.length === 0 && filteredFiles.length === 0"
            class="flex items-center justify-center min-h-[140px] text-slate-600 text-sm italic"
          >
            {{ $t('components.fileBrowser.empty') }}
          </div>
          <ul v-else class="list-none m-0 py-1.5">
            <!-- Directories -->
            <li
              v-for="dir in directories"
              :key="dir.path"
              class="flex items-center gap-2 px-3 py-2 cursor-pointer border-l-2 transition-all group"
              :class="
                selectedPath === dir.path
                  ? 'bg-cyan-900/10 border-l-cyan-700'
                  : 'border-l-transparent hover:bg-[#1e2639]'
              "
              @click="selectDirectory(dir)"
              @dblclick="navigateTo(dir.path)"
            >
              <!-- Folder icon -->
              <svg class="w-4 h-4 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
                />
              </svg>
              <span class="flex-1 text-[0.85rem] text-slate-200 truncate">{{ dir.name }}</span>
              <span
                v-if="selectedPath !== dir.path"
                class="text-[0.7rem] text-slate-600 shrink-0 group-hover:hidden"
              >
                {{ $t('components.fileBrowser.dblClickHint') }}
              </span>
              <!-- Delete button -->
              <button
                class="items-center justify-center w-6 h-6 rounded text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors cursor-pointer bg-transparent border-none shrink-0"
                :class="selectedPath === dir.path ? 'flex' : 'hidden group-hover:flex'"
                @click.stop="deleteDirectory(dir)"
                :title="$t('components.fileBrowser.deleteDir')"
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
            </li>

            <!-- Divider between dirs and files -->
            <li
              v-if="directories.length > 0 && filteredFiles.length > 0"
              class="mx-3 my-1 border-t border-[#2e3650]"
            />

            <!-- Files -->
            <li
              v-for="file in filteredFiles"
              :key="file.path"
              class="flex items-center gap-2 px-3 py-2 border-l-2 transition-all group cursor-pointer hover:bg-[#1e2639]"
              :class="
                selectedPath === file.path
                  ? 'bg-cyan-900/10 border-l-cyan-700'
                  : 'border-l-transparent'
              "
              @click="selectFile(file)"
            >
              <!-- File icon -->
              <svg
                class="w-4 h-4 shrink-0 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span class="flex-1 text-[0.85rem] text-slate-200 truncate">{{ file.name }}</span>
              <span class="text-[0.7rem] text-slate-500 shrink-0">{{ formatSize(file.size) }}</span>
              <span
                v-if="selectedPath !== file.path"
                class="text-[0.7rem] text-slate-600 shrink-0 ml-2 group-hover:hidden"
                >{{ formatDate(file.lastModified) }}
              </span>
              <!-- Delete button -->
              <button
                class="items-center justify-center w-6 h-6 rounded text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors cursor-pointer bg-transparent border-none shrink-0"
                :class="selectedPath === file.path ? 'flex' : 'hidden group-hover:flex'"
                @click.stop="deleteFile(file)"
                :title="$t('components.fileBrowser.deleteFile')"
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
            </li>
          </ul>
        </div>

        <!-- New Folder -->
        <div class="flex items-center gap-2 px-4 py-2 border-t border-[#2e3650] shrink-0">
          <input
            v-if="creatingFolder"
            ref="folderInput"
            v-model="newFolderName"
            class="flex-1 bg-[#0f1420] border border-[#2e3650] focus:border-cyan-700 rounded-md text-slate-200 text-xs px-2.5 py-1.5 outline-none transition-colors"
            :placeholder="$t('components.fileBrowser.folderPlaceholder')"
            @keydown.enter="confirmNewFolder"
            @keydown.escape="cancelNewFolder"
          />
          <button
            v-if="!creatingFolder"
            class="px-3 py-1.5 rounded-md border border-[#2e3650] bg-transparent text-slate-400 text-xs cursor-pointer hover:bg-[#2e3650] hover:text-slate-200 transition-all"
            @click="startNewFolder"
          >
            {{ $t('components.fileBrowser.newFolder') }}
          </button>
          <template v-else>
            <button
              class="default-button-cyan"
              :disabled="!newFolderName.trim()"
              @click="confirmNewFolder"
            >
              {{ $t('components.fileBrowser.create') }}
            </button>
            <button class="default-button-gray" @click="cancelNewFolder">
              {{ $t('common.cancel') }}
            </button>
          </template>
        </div>

        <!-- Selected Path Preview -->
        <div
          class="flex items-center gap-2 px-4 py-2 bg-[#0f1420] border-t border-[#2e3650] shrink-0 min-h-9"
        >
          <span class="text-xs text-slate-600 whitespace-nowrap shrink-0">{{
            $t('components.fileBrowser.selectedPath')
          }}</span>
          <div class="flex-1 overflow-x-auto scrollbar-thin">
            <span class="text-[0.78rem] text-slate-400 font-mono whitespace-nowrap">{{
              selectedPath || '—'
            }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 px-4 py-3 border-t border-[#2e3650] shrink-0">
          <button class="default-button-gray" @click="cancel">
            {{ $t('common.cancel') }}
          </button>
          <button class="default-button-cyan" :disabled="!selectedPath" @click="confirm">
            {{ $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import apiService from '@/services/apiService';
import { useToastStore } from '@/store/toastStore';

const { t } = useI18n();
const toastStore = useToastStore();

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  initialPath: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  mode: {
    type: String,
    default: 'directory', // 'directory' | 'file'
  },
  fileExtensions: {
    type: Array,
    default: () => [], // empty = show all files
  },
});

const emit = defineEmits(['update:modelValue', 'select']);

// State
const isOpen = computed(() => props.modelValue);

const currentPath = ref('');
const parentPath = ref('');
const selectedPath = ref('');

const directories = ref([]);
const files = ref([]);
const listLoading = ref(false);
const listError = ref('');

const filteredFiles = computed(() => {
  if (!props.fileExtensions.length) return files.value;
  return files.value.filter((f) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    return props.fileExtensions.includes(ext);
  });
});

const creatingFolder = ref(false);
const newFolderName = ref('');
const folderInput = ref(null);

// Helpers
function extractParentDir(path) {
  const isWindows = path.includes('\\');
  const sep = isWindows ? '\\' : '/';
  const normalized = path.replace(/[/\\]+$/, '');
  const lastSep = normalized.lastIndexOf(sep);
  if (lastSep <= 0) return isWindows ? normalized : '/';
  return normalized.substring(0, lastSep);
}

// Navigation
const canGoUp = computed(() => !!parentPath.value && parentPath.value !== currentPath.value);

// Breadcrumbs — supports both Windows (\) and Unix (/) paths
const breadcrumbs = computed(() => {
  const path = currentPath.value;
  if (!path) return [];

  const isWindows = path.includes('\\');
  const sep = isWindows ? '\\' : '/';
  const parts = path.split(sep).filter(Boolean);

  return parts.map((label, i) => {
    let builtPath = parts.slice(0, i + 1).join(sep);
    // Windows drive roots: "C:" → "C:\"
    if (i === 0 && isWindows) builtPath += sep;
    return { label, path: builtPath };
  });
});

// Watchers
watch(isOpen, async (val) => {
  if (val) {
    listError.value = '';
    creatingFolder.value = false;
    newFolderName.value = '';
    selectedPath.value = '';

    if (props.initialPath) {
      // Try navigating directly — works if it's a directory
      await navigateTo(props.initialPath);
      // If it failed (path is a file), navigate to parent and pre-select the file
      if (listError.value) {
        const parentDir = extractParentDir(props.initialPath);
        await navigateTo(parentDir);
        if (!listError.value) {
          selectedPath.value = props.initialPath;
        }
      }
    } else {
      await navigateTo('');
    }
  }
});

// API
async function navigateTo(path) {
  listError.value = '';
  listLoading.value = true;
  directories.value = [];
  files.value = [];

  try {
    const result = await apiService.browseFilesystem(path);
    if (!result?.success) {
      throw new Error(result?.error || t('components.fileBrowser.loadError'));
    }
    currentPath.value = result.currentPath || path;
    parentPath.value = result.parentPath || '';
    directories.value = Array.isArray(result.directories) ? result.directories : [];
    files.value = Array.isArray(result.files) ? result.files : [];

    // In directory mode: auto-select current directory
    if (props.mode === 'directory') {
      selectedPath.value = currentPath.value;
    }
  } catch (e) {
    listError.value = e?.message || t('components.fileBrowser.loadError');
    directories.value = [];
    files.value = [];
  } finally {
    listLoading.value = false;
  }
}

function goUp() {
  if (canGoUp.value) {
    navigateTo(parentPath.value);
  }
}

function selectDirectory(dir) {
  selectedPath.value = dir.path;
}

function selectFile(file) {
  selectedPath.value = file.path;
}

// New Folder
function startNewFolder() {
  creatingFolder.value = true;
  newFolderName.value = '';
  nextTick(() => folderInput.value?.focus());
}

async function confirmNewFolder() {
  const name = newFolderName.value.trim();
  if (!name || !currentPath.value) return;

  const isWindows = currentPath.value.includes('\\');
  const sep = isWindows ? '\\' : '/';
  const newPath = currentPath.value.replace(/[/\\]+$/, '') + sep + name;

  listError.value = '';
  try {
    await apiService.createFilesystemDirectory(newPath);
    await navigateTo(currentPath.value);
    selectedPath.value = newPath;
  } catch (e) {
    listError.value = e?.message || t('components.fileBrowser.createError');
  } finally {
    creatingFolder.value = false;
    newFolderName.value = '';
  }
}

function cancelNewFolder() {
  creatingFolder.value = false;
  newFolderName.value = '';
}

// Delete Directory
async function deleteDirectory(dir) {
  const confirmed = await toastStore.showConfirmation(
    t('components.fileBrowser.deleteDirTitle'),
    t('components.fileBrowser.deleteDirMessage', { name: dir.name }),
    t('common.delete'),
    t('common.cancel')
  );
  if (!confirmed) return;

  listError.value = '';
  try {
    await apiService.deleteFilesystemDirectory(dir.path);
    if (selectedPath.value === dir.path) selectedPath.value = currentPath.value;
    await navigateTo(currentPath.value);
  } catch (e) {
    listError.value = e?.message || t('components.fileBrowser.deleteError');
  }
}

// Delete File
async function deleteFile(file) {
  const confirmed = await toastStore.showConfirmation(
    t('components.fileBrowser.deleteFileTitle'),
    t('components.fileBrowser.deleteFileMessage', { name: file.name }),
    t('common.delete'),
    t('common.cancel')
  );
  if (!confirmed) return;

  listError.value = '';
  try {
    await apiService.deleteFilesystemFile(file.path);
    if (selectedPath.value === file.path) selectedPath.value = currentPath.value;
    await navigateTo(currentPath.value);
  } catch (e) {
    listError.value = e?.message || t('components.fileBrowser.deleteError');
  }
}

// Formatting
function formatSize(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
}

// Dialog Actions
function confirm() {
  emit('select', selectedPath.value);
  emit('update:modelValue', false);
}

function cancel() {
  emit('update:modelValue', false);
}
</script>
