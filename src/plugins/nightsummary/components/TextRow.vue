<template>
  <div class="flex flex-col sm:flex-row sm:items-center gap-2">
    <span class="text-gray-300 sm:w-52 sm:shrink-0 text-sm">{{ label }}</span>
    <input
      :type="type || 'text'"
      :value="value"
      @blur="$emit('blur', $event.target.value)"
      class="default-input w-full sm:flex-1 sm:max-w-sm"
    />
  </div>
</template>

<script setup>
defineProps(['label', 'value', 'type']);
defineEmits(['blur']);
</script>
