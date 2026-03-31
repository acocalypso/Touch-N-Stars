<template>
  <div class="flex items-center">
    <button
      @click="updateToggled"
      :disabled="disabled"
      :class="[
        statusValue ? 'bg-cyan-600/20 border-cyan-500/60' : 'bg-slate-700/40 border-slate-600/60',
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-slate-500/70 active:scale-95',
        'relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 ease-out border shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-500/40',
      ]"
      type="button"
      :aria-pressed="statusValue?.toString() || 'false'"
    >
      <span class="sr-only">Toggle</span>

      <!-- Toggle Knopf -->
      <span
        :class="[
          statusValue
            ? 'translate-x-6 bg-gradient-to-br from-cyan-400 to-cyan-600'
            : 'translate-x-1 bg-gradient-to-br from-slate-300 to-slate-500',
          'inline-block h-4 w-4 transform rounded-full shadow-sm transition-all duration-300 ease-out',
        ]"
      />
    </button>
  </div>
</template>

<script setup>
// Props definition
const props = defineProps({
  statusValue: {
    type: Boolean,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

// Emits for parent communication
const emits = defineEmits(['update:statusValue']);

// Toggle the current value
function updateToggled() {
  if (!props.disabled) {
    emits('update:statusValue', !props.statusValue);
  }
}
</script>
