<template>
  <div class="flex items-center space-x-4 border border-gray-500 rounded-xl p-1 pl-2 min-h-7">
    <div class="flex items-center space-x-3">
      <div :class="isEnabled ? enabledClass : disabledClass"></div>
      <span class="text-xs text-gray-400">{{ isEnabled ? enabledText : disabledText }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isEnabled: {
    type: Boolean,
    default: true,
  },
  enabledText: {
    type: String,
    default: 'Ein',
  },
  disabledText: {
    type: String,
    default: 'Aus',
  },
  enabledClass: {
    type: String,
    default:
      'w-3 h-3 min-w-3 bg-green-500/80 rounded-full shadow-[0_0_6px_2px_rgba(74,222,128,0.5)]',
  },
  disabledClass: {
    type: String,
    default: 'w-3 h-3 min-w-3 bg-red-500/65 rounded-full shadow-[0_0_6px_2px_rgba(255,0,0,0.5)]',
  },
});
</script>

<style scoped></style>
