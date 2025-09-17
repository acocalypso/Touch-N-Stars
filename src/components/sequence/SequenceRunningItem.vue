<template>
  <div v-if="sequenceStore.runningItems[0]" class="flex items-center gap-2">
    <div
      class="w-4 h-4 border-2 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"
    ></div>
    {{ sequenceStore.runningItems[0] }}
  </div>
  <div v-else class="text-gray-500 italic">{{ $t('components.sequence.noRunningItems') }}</div>
</template>
<script setup>
import { useSequenceStore } from '@/store/sequenceStore';
const sequenceStore = useSequenceStore();
</script>
