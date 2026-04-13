<template>
  <div class="flex flex-col space-y-6">
    <PinsSambaCard
      :enabled="sambaEnabled"
      :disabled="disabled"
      @toggle="$emit('toggle-samba', $event)"
    />

    <PinsPhd2Card
      :enabled="phd2Enabled"
      :running="phd2Running"
      :disabled="disabled"
      @toggle="$emit('toggle-phd2', $event)"
    />

    <div
      class="border border-gray-700 rounded-lg bg-gray-800 shadow-xl p-6 relative overflow-hidden flex flex-row items-center justify-between"
    >
      <div class="absolute top-0 right-20 p-4 opacity-10 pointer-events-none">
        <svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div class="relative z-10">
        <h3 class="text-xl font-bold text-white mb-1">{{ $t('plugins.pins.systemTime') }}</h3>
        <p class="text-gray-400 text-sm" v-if="deviceTime">
          {{ $t('plugins.pins.deviceTime') }}:
          {{ new Date(deviceTime * 1000).toLocaleString() }}
        </p>
        <p class="text-gray-400 text-sm" v-else>
          {{ $t('plugins.pins.loadingTime') }}
        </p>
        <button
          v-if="suppressTimeWarning"
          @click="$emit('reenable-time-warning')"
          class="text-xs text-yellow-400 hover:text-yellow-300 underline mt-1 text-left"
        >
          {{ $t('plugins.pins.timeWarning.reenable') }}
        </button>
      </div>
      <div class="relative z-10 flex flex-col items-end gap-2">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-400 uppercase font-bold">{{
            $t('plugins.pins.autoSync')
          }}</span>
          <toggleButton
            :status-value="timeSyncEnabled"
            @update:status-value="$emit('toggle-time-sync', $event)"
            :disabled="disabled"
          />
        </div>
        <button
          @click="$emit('manual-time-sync')"
          class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg shadow-md shadow-blue-900/20 transition-all disabled:opacity-50 text-xs sm:text-sm"
          :disabled="disabled"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {{ $t('plugins.pins.syncNow') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import toggleButton from '@/components/helpers/toggleButton.vue';
import PinsSambaCard from '../PinsSambaCard.vue';
import PinsPhd2Card from '../PinsPhd2Card.vue';

defineProps({
  sambaEnabled: {
    type: Boolean,
    required: true,
  },
  phd2Enabled: {
    type: Boolean,
    required: true,
  },
  phd2Running: {
    type: Boolean,
    required: true,
  },
  deviceTime: {
    type: Number,
    default: null,
  },
  timeSyncEnabled: {
    type: Boolean,
    required: true,
  },
  suppressTimeWarning: {
    type: Boolean,
    required: true,
  },
  disabled: {
    type: Boolean,
    required: true,
  },
});

defineEmits([
  'toggle-samba',
  'toggle-phd2',
  'toggle-time-sync',
  'manual-time-sync',
  'reenable-time-warning',
]);
</script>
