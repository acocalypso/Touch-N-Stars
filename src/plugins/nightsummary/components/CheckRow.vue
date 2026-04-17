<template>
  <div class="flex items-center gap-3" :class="{ 'opacity-40 pointer-events-none': disabled }">
    <ToggleButton :statusValue="value" @click="$emit('update', !value)" />
    <span class="text-gray-300 text-sm">{{ label }}</span>
  </div>
</template>

<script setup>
import ToggleButton from '@/components/helpers/toggleButton.vue';
defineProps(['label', 'value', 'disabled']);
defineEmits(['update']);
</script>
