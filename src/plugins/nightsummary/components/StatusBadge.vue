<template>
  <span :class="['text-sm font-medium', ok ? 'text-green-400' : 'text-red-400']">
    {{ ok ? '✓' : '✗' }} {{ message }}
  </span>
</template>

<script setup>
defineProps(['ok', 'message']);
</script>
