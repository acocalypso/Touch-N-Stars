<template>
  <div class="border border-gray-700 rounded-lg bg-gray-800 shadow-xl p-6 relative overflow-hidden">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
      <div class="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
        <div class="flex flex-col items-center sm:items-start gap-2 w-full sm:w-auto">
          <div
            class="px-5 py-2 rounded-full font-bold text-sm border shadow-sm w-full sm:w-auto text-center"
            :class="{
              'bg-gray-700 border-gray-600 text-gray-300': status === 'Idle',
              'bg-blue-900/40 border-blue-500/50 text-blue-300 animate-pulse': status === 'Running',
              'bg-green-900/40 border-green-500/50 text-green-300': status === 'Success',
              'bg-red-900/40 border-red-500/50 text-red-300': status === 'Failed',
            }"
          >
            <span
              v-if="status === 'Running'"
              class="inline-block w-2 h-2 rounded-full bg-blue-400 mr-2 animate-ping"
            ></span>
            {{ $t('plugins.pins.status.' + status.toLowerCase()) }}
          </div>
          <p v-if="status === 'Failed' && upgradeExitCode !== null" class="text-xs text-red-300">
            {{ $t('plugins.pins.logs.upgradeFailed', { exitCode: upgradeExitCode }) }}
          </p>
        </div>
      </div>

      <button
        @click="$emit('start-upgrade')"
        :disabled="status === 'Running'"
        class="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none w-full md:w-auto flex items-center justify-center gap-2"
      >
        <svg
          v-if="status === 'Running'"
          class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span>
          {{
            status === 'Running' && activeOperation === 'upgrade'
              ? $t('plugins.pins.upgrading')
              : $t('plugins.pins.startUpgrade')
          }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  status: {
    type: String,
    required: true,
  },
  activeOperation: {
    type: String,
    default: null,
  },
  upgradeExitCode: {
    type: [Number, String],
    default: null,
  },
});

defineEmits(['start-upgrade']);
</script>
