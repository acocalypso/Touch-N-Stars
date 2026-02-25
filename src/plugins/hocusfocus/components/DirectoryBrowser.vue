<template>
  <div class="space-y-2">
    <label class="text-white mb-2 block">{{ label }}</label>

    <!-- Current Selection Display -->
    <div class="flex gap-2 items-end mb-2">
      <div class="flex-1">
        <input
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          type="text"
          class="w-full bg-gray-700 text-white p-2 rounded"
          :disabled="disabled"
          :placeholder="placeholder || 'Enter or browse for directory path'"
        />
      </div>
      <button
        @click="toggleBrowser"
        :disabled="disabled || isLoading"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition whitespace-nowrap"
      >
        {{ isLoading ? 'Loading...' : 'Browse...' }}
      </button>
    </div>

    <!-- Directory Browser Modal -->
    <div
      v-if="showBrowser"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="showBrowser = false"
      @keydown.esc="showBrowser = false"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">Select Directory</h3>

        <!-- Breadcrumb Navigation -->
        <div
          v-if="currentPath"
          class="mb-4 p-3 bg-gray-700 rounded text-sm text-gray-300 break-words max-h-40 overflow-y-auto"
        >
          <div class="flex flex-wrap gap-1">
            <button
              v-for="(part, idx) in getBreadcrumbs()"
              :key="idx"
              @click="navigateToPath(part.path)"
              class="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs transition whitespace-nowrap"
            >
              {{ part.label }}
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="mb-4 p-2 bg-red-900 border border-red-700 rounded text-red-200 text-sm"
        >
          {{ error }}
        </div>

        <!-- Directory List -->
        <div class="flex-1 overflow-y-auto mb-4 border border-gray-600 rounded bg-gray-900">
          <div v-if="isLoading" class="p-4 text-gray-400 text-center">Loading...</div>

          <div v-else-if="directories.length === 0" class="p-4 text-gray-400 text-center text-sm">
            No subdirectories
          </div>

          <div v-else class="space-y-1 p-2">
            <!-- Parent Directory Link -->
            <button
              v-if="parentPath"
              @click="navigateToPath(parentPath)"
              class="w-full text-left px-3 py-2 hover:bg-gray-700 rounded transition text-blue-400 text-sm font-semibold mb-2 border-b border-gray-600"
            >
              ⬆️ Go to Parent Directory
            </button>

            <!-- Directory Items -->
            <button
              v-for="dir in directories"
              :key="dir.path"
              @click="navigateToPath(dir.path)"
              class="w-full text-left px-3 py-2 hover:bg-gray-700 rounded transition text-gray-300 text-sm hover:text-white"
            >
              📁 {{ dir.name }}
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <button
            @click="selectCurrentPath"
            class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
          >
            Select
          </button>
          <button
            @click="showBrowser = false"
            class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error && !showBrowser" class="text-red-400 text-xs">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import apiService from '@/services/apiService';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: 'Directory Path',
  },
  placeholder: {
    type: String,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const showBrowser = ref(false);
const currentPath = ref(null);
const parentPath = ref(null);
const directories = ref([]);
const error = ref('');
const isLoading = ref(false);

const toggleBrowser = async () => {
  if (showBrowser.value) {
    showBrowser.value = false;
  } else {
    showBrowser.value = true;
    // Load initial directory on open
    if (!currentPath.value) {
      console.log(
        '[DirectoryBrowser] Opening browser, initializing with path:',
        props.modelValue || 'null'
      );
      await loadDirectory(props.modelValue || null);
    }
  }
};

const loadDirectory = async (path) => {
  error.value = '';
  isLoading.value = true;
  try {
    console.log('[DirectoryBrowser] Loading directory:', path);
    const response = await apiService.hocusfocus.browseDirectories(path);
    console.log('[DirectoryBrowser] Response:', response);

    if (response && response.Success) {
      currentPath.value = response.currentPath;
      parentPath.value = response.parentPath;
      directories.value = response.directories || [];
      console.log(
        '[DirectoryBrowser] Loaded successfully. Current path:',
        currentPath.value,
        'Directories:',
        directories.value.length
      );
    } else {
      const errorMsg = response?.Error || 'Failed to load directory';
      console.error('[DirectoryBrowser] Response not successful:', errorMsg);

      // If the provided path is invalid (404), retry with default path
      if (path && !response.Success && errorMsg.includes('does not exist')) {
        console.log('[DirectoryBrowser] Path does not exist, retrying with default path');
        await loadDirectory(null);
        return;
      }

      error.value = errorMsg;
    }
  } catch (err) {
    console.error('[DirectoryBrowser] Exception caught:', err);

    // If path is invalid (404), retry with default path
    if (path && err.response?.status === 404) {
      console.log('[DirectoryBrowser] Got 404, retrying with default path');
      await loadDirectory(null);
      return;
    }

    const errorMsg = err.response?.data?.Error || err.message || 'Failed to load directory';
    console.error('[DirectoryBrowser] Final error message:', errorMsg);
    error.value = errorMsg;
  } finally {
    isLoading.value = false;
  }
};

const navigateToPath = async (path) => {
  await loadDirectory(path);
};

const selectCurrentPath = () => {
  if (currentPath.value) {
    emit('update:modelValue', currentPath.value);
    showBrowser.value = false;
  }
};

const getBreadcrumbs = () => {
  if (!currentPath.value) return [];

  const parts = currentPath.value.split(/[\/\\]/);
  const breadcrumbs = [];
  let path = '';

  for (let i = 0; i < parts.length; i++) {
    if (!parts[i]) continue; // Skip empty parts

    if (i === 0 && parts[i].length === 2 && parts[i][1] === ':') {
      // Windows drive letter
      path = parts[i] + '\\';
    } else {
      path = i === 0 ? parts[i] : path + '/' + parts[i];
    }

    breadcrumbs.push({
      label: parts[i] || (i === 0 ? '/' : '...'),
      path: path,
    });
  }

  return breadcrumbs;
};

onMounted(async () => {
  // Initialize with the current model value or default
  if (props.modelValue) {
    // Don't load yet, wait for user to click Browse
  }
});

// Manage body scroll when modal is open
watch(showBrowser, (isOpen) => {
  if (isOpen) {
    // Disable background scrolling
    document.body.style.overflow = 'hidden';
  } else {
    // Re-enable background scrolling
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
/* Ensure smooth transitions for button states */
button {
  transition: background-color 0.2s ease;
}
</style>
