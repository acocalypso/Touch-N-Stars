<template>
  <div class="p-4 flex flex-col gap-4 bg-gray-900/40">
    <h3 class="text-sm font-semibold text-gray-200">
      {{ $t('plugins.filebrowser.details') }}
    </h3>

    <div v-if="selectedEntry" class="rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm">
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
          <span class="ml-2 text-gray-300">{{ formatDateTime(selectedEntry.lastModified) }}</span>
        </div>
        <div v-if="selectedEntryType === 'file'">
          <span class="text-gray-500">{{ $t('plugins.filebrowser.isImage') }}:</span>
          <span class="ml-2" :class="isSelectedEntryImage ? 'text-green-400' : 'text-gray-300'">
            {{ isSelectedEntryImage ? $t('general.yes') : $t('general.no') }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="rounded-lg border border-dashed border-gray-700 p-4 text-sm text-gray-500">
      {{ $t('plugins.filebrowser.selectEntryHint') }}
    </div>

    <div v-if="selectedEntry" class="rounded-lg border border-gray-700 bg-gray-800/30 p-3">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-if="selectedEntryType === 'file'"
          class="h-9 px-3 rounded-md border border-cyan-700 text-cyan-300 hover:bg-cyan-900/20 transition-colors text-xs"
          @click="$emit('open-file', selectedEntry)"
        >
          {{ $t('plugins.filebrowser.openFolder') }}
        </button>
        <button
          class="h-9 px-3 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors text-xs"
          @click="$emit('rename-entry', selectedEntry, selectedEntryType)"
        >
          {{ $t('common.edit') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  selectedEntry: { type: Object, default: null },
  selectedEntryType: { type: String, default: null },
  selectedEntryTypeLabel: { type: String, default: '—' },
  isSelectedEntryImage: { type: Boolean, default: false },
  formatSize: { type: Function, required: true },
  formatDateTime: { type: Function, required: true },
});

defineEmits(['open-file', 'rename-entry']);
</script>
