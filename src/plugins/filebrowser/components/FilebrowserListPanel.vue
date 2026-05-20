<template>
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
      v-else-if="!directories.length && !files.length"
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
          @click="$emit('open-directory', dir)"
        >
          <svg class="h-4 w-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
          </svg>
          <span class="truncate text-sm text-gray-100">{{ dir.name }}</span>
        </button>

        <div class="ml-auto flex w-full sm:w-auto justify-end items-center gap-2">
          <button
            class="h-8 w-8 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors flex items-center justify-center"
            :title="$t('common.edit')"
            @click="$emit('rename-entry', dir, 'directory')"
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
            :title="$t('common.delete')"
            @click="$emit('delete-directory', dir)"
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
        v-for="file in files"
        :key="file.path"
        class="group flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 sm:px-4 py-2 hover:bg-gray-800/60"
        :class="selectedPath === file.path ? 'bg-cyan-900/15' : ''"
      >
        <button
          class="flex w-full sm:w-auto min-w-0 sm:flex-1 items-center gap-3 text-left"
          @click="$emit('select-file', file)"
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
          <span class="hidden sm:inline text-xs text-gray-500">{{ formatSize(file.size) }}</span>
          <span class="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 uppercase">
            {{ getFileExtension(file.name) || 'file' }}
          </span>
          <button
            class="h-8 w-8 rounded-md border border-cyan-700 text-cyan-300 hover:bg-cyan-900/20 transition-colors flex items-center justify-center"
            :title="$t('plugins.filebrowser.openFolder')"
            @click="$emit('open-file', file)"
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
            @click="$emit('rename-entry', file, 'file')"
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
            :title="$t('common.delete')"
            @click="$emit('delete-file', file)"
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
</template>

<script setup>
defineProps({
  isLoading: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  directories: { type: Array, default: () => [] },
  files: { type: Array, default: () => [] },
  selectedPath: { type: String, default: '' },
  formatSize: { type: Function, required: true },
  getFileExtension: { type: Function, required: true },
});

defineEmits([
  'open-directory',
  'select-file',
  'open-file',
  'rename-entry',
  'delete-directory',
  'delete-file',
]);
</script>
