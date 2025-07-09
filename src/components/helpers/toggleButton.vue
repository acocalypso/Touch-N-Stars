<template>
  <div class="flex items-center">
    <button
      @click="updateToggled"
      :class="[
        statusValue ? 'bg-emerald-400/70' : 'bg-gray-700/60',
        'relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 border border-white/10 shadow-inner backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-500/40'
      ]"
      type="button"
      :aria-pressed="statusValue.toString()"
    >
      <span class="sr-only">Toggle camera cooling</span>
      <span
        :class="[
          statusValue ? 'translate-x-7' : 'translate-x-1',
          'inline-block h-5 w-5 transform bg-white rounded-full shadow-md transition-transform duration-300'
        ]"
      ></span>
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

// Props definition
const props = defineProps({
  statusValue: {
    type: Boolean,
    required: true
  }
})

// Emits for parent communication
const emits = defineEmits(['update:statusValue'])

// Toggle the current value
function updateToggled() {
  emits('update:statusValue', !props.statusValue)
}
</script>
