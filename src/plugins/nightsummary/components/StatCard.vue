<template>
  <div class="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
    <div
      :class="[
        'text-2xl font-bold',
        color === 'cyan' ? 'text-cyan-400' : color === 'green' ? 'text-green-400' : 'text-white',
      ]"
    >
      {{ value }}
    </div>
    <div class="text-xs text-gray-400 mt-1">{{ label }}</div>
  </div>
</template>

<script setup>
defineProps(['value', 'label', 'color']);
</script>
