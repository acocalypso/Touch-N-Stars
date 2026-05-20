<template>
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
        @click="$emit('jump-to-image-path')"
      >
        {{ $t('plugins.filebrowser.jumpToImagePath') }}
      </button>
      <button
        class="h-9 px-3 rounded-md border border-gray-600 bg-gray-800 text-sm text-gray-100 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        :disabled="!canGoUp || isLoading"
        @click="$emit('go-up')"
      >
        {{ $t('plugins.filebrowser.goUp') }}
      </button>
      <button
        class="h-9 px-3 rounded-md border border-gray-600 bg-gray-800 text-sm text-gray-100 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        :disabled="isLoading"
        @click="$emit('refresh')"
      >
        {{ $t('plugins.filebrowser.refresh') }}
      </button>
      <label class="ml-auto flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
        <input
          v-model="imagesOnlyModel"
          type="checkbox"
          class="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-500"
        />
        <span>{{ $t('plugins.filebrowser.imagesOnly') }}</span>
      </label>
    </div>

    <div class="flex flex-wrap items-center gap-2 text-xs">
      <span class="px-2 py-1 rounded bg-gray-800 text-gray-300">
        {{ $t('plugins.filebrowser.directoriesCount', { count: directoriesCount }) }}
      </span>
      <span class="px-2 py-1 rounded bg-gray-800 text-gray-300">
        {{ $t('plugins.filebrowser.filesCount', { count: filesCount }) }}
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="newFolderNameModel"
        class="w-full sm:w-80 rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-cyan-600"
        :placeholder="$t('plugins.filebrowser.newFolderPlaceholder')"
        @keydown.enter="$emit('create-directory')"
      />
      <button
        class="h-9 px-3 rounded-md border border-cyan-700 bg-cyan-900/40 text-sm text-cyan-100 hover:bg-cyan-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        :disabled="isLoading || !newFolderName.trim()"
        @click="$emit('create-directory')"
      >
        {{ $t('plugins.filebrowser.createFolder') }}
      </button>
    </div>

    <div v-if="breadcrumbs.length" class="flex flex-wrap items-center gap-1 text-xs sm:text-sm">
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
        @click="$emit('browse', crumb.path)"
      >
        {{ crumb.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentPath: { type: String, default: '' },
  canGoUp: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
  showImagesOnly: { type: Boolean, default: true },
  directoriesCount: { type: Number, default: 0 },
  filesCount: { type: Number, default: 0 },
  newFolderName: { type: String, default: '' },
  breadcrumbs: { type: Array, default: () => [] },
});

const emit = defineEmits([
  'jump-to-image-path',
  'go-up',
  'refresh',
  'create-directory',
  'browse',
  'update:showImagesOnly',
  'update:newFolderName',
]);

const imagesOnlyModel = computed({
  get: () => props.showImagesOnly,
  set: (value) => emit('update:showImagesOnly', value),
});

const newFolderNameModel = computed({
  get: () => props.newFolderName,
  set: (value) => emit('update:newFolderName', value),
});
</script>
