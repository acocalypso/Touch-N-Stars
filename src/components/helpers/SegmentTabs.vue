<template>
  <!-- Only this bar scrolls on narrow screens, never the page -->
  <div
    class="flex gap-1 overflow-x-auto scrollbar-hide rounded-control border border-line-strong bg-surface-2 p-1"
    role="tablist"
  >
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      role="tab"
      class="flex min-h-touch shrink-0 items-center justify-center whitespace-nowrap rounded-chip px-3 text-sm font-semibold transition-colors"
      :class="modelValue === tab.value ? 'bg-accent-action text-white' : 'text-content-muted'"
      :aria-selected="modelValue === tab.value"
      @click="emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  // [{ value, label }]
  tabs: { type: Array, required: true },
  modelValue: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);
</script>
