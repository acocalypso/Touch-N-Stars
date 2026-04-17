<template>
  <div class="flex items-center gap-4">
    <span class="text-gray-300 w-52 shrink-0 text-sm">{{ label }}</span>
    <input
      :type="type || 'text'"
      :value="value"
      @blur="$emit('blur', $event.target.value)"
      class="flex-1 max-w-sm bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
    />
  </div>
</template>

<script setup>
defineProps(['label', 'value', 'type']);
defineEmits(['blur']);
</script>
