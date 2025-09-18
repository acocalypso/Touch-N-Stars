<template>
  <div class="flex items-center">
    <button
      @click="updateToggled"
      :class="[
        statusValue
          ? 'bg-emerald-600/20 border-emerald-500/60'
          : 'bg-slate-700/40 border-slate-600/40',
        'relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 ease-out border shadow-inner backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 hover:shadow-md',
      ]"
      type="button"
      :aria-pressed="statusValue?.toString() || 'false'"
    >
      <span class="sr-only">Toggle camera cooling</span>

      <!-- Subtiler Glow bei aktiv -->
      <div
        :class="[
          statusValue ? 'opacity-100' : 'opacity-0',
          'absolute inset-0 rounded-full bg-emerald-500/10 blur-sm transition-opacity duration-300',
        ]"
      ></div>

      <!-- Toggle Knopf -->
      <span
        :class="[
          statusValue
            ? 'translate-x-6 bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-400/40'
            : 'translate-x-1 bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-400/30',
          'relative inline-block h-4 w-4 transform rounded-full shadow-sm transition-all duration-300 ease-out',
        ]"
      >
        <!-- Innerer Glanz -->
        <div
          :class="[
            statusValue
              ? 'bg-gradient-to-br from-emerald-200/60 to-transparent'
              : 'bg-gradient-to-br from-white/60 to-transparent',
            'absolute inset-0 rounded-full',
          ]"
        ></div>
      </span>
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

// Props definition
const props = defineProps({
  statusValue: {
    type: Boolean,
    required: true,
  },
});

// Emits for parent communication
const emits = defineEmits(['update:statusValue']);

// Toggle the current value
function updateToggled() {
  emits('update:statusValue', !props.statusValue);
}
</script>
