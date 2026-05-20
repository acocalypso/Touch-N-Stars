<template>
  <div
    class="border border-gray-700 rounded-lg bg-gray-800 shadow-xl p-6 relative overflow-hidden flex flex-row items-center justify-between"
  >
    <div class="absolute top-0 right-20 p-4 opacity-10 pointer-events-none">
      <svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    </div>
    <div class="relative z-10">
      <h3 class="text-xl font-bold text-white mb-1">{{ $t('plugins.pins.phd2Title') }}</h3>
      <p class="text-gray-400 text-sm">
        {{ running ? $t('plugins.pins.phd2Running') : $t('plugins.pins.phd2Stopped') }}
      </p>
    </div>
    <div class="relative z-10">
      <toggleButton
        :status-value="enabled"
        @update:status-value="$emit('toggle', $event)"
        :disabled="disabled"
      />
    </div>
  </div>
</template>

<script setup>
import toggleButton from '@/components/helpers/toggleButton.vue';

defineProps({
  enabled: {
    type: Boolean,
    required: true,
  },
  running: {
    type: Boolean,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['toggle']);
</script>
