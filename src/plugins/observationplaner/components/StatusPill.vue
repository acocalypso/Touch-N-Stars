<template>
  <div
    class="flex items-center justify-between px-2 py-2 rounded-md border"
    :class="ok ? 'border-green-700/50 bg-green-900/20' : 'border-gray-700 bg-black/20'"
  >
    <span class="text-gray-300">{{ label }}</span>
    <span class="font-mono text-xs" :class="ok ? 'text-green-200' : 'text-gray-200'">
      {{ value }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  ok: { type: Boolean, required: true },
  value: { type: String, required: true },
});
</script>
