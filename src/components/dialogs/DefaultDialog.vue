<template>
  <p class="text-gray-200 whitespace-pre-wrap">{{ message }}</p>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  dialog: {
    type: Object,
    required: true,
  },
});

const message = computed(() => {
  return props.dialog?.Content?.Message || '';
});
</script>
