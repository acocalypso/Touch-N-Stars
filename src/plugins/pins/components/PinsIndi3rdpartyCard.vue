<template>
  <div class="border border-gray-700 rounded-lg bg-gray-800 shadow-xl p-6 relative overflow-hidden">
    <div class="absolute top-0 right-20 p-4 opacity-10 pointer-events-none">
      <svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 7h16M4 12h16M4 17h16"
        />
      </svg>
    </div>

    <div class="relative z-10 flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 class="text-xl font-bold text-white mb-1">
            {{ $t('plugins.pins.indi3rdpartyTitle') }}
          </h3>
          <p class="text-gray-400 text-sm">{{ $t('plugins.pins.indi3rdpartyDescription') }}</p>
        </div>

        <button
          class="text-blue-400 hover:text-white transition-colors p-2 self-end sm:self-auto"
          :disabled="loading || disabled"
          :title="$t('plugins.pins.indi3rdpartyRefresh')"
          @click="$emit('refresh')"
        >
          <svg
            class="w-5 h-5"
            :class="{ 'animate-spin': loading }"
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
        </button>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <input
          :value="searchQuery"
          @input="$emit('update:searchQuery', $event.target.value)"
          @keyup.enter="$emit('search')"
          class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
          :placeholder="$t('plugins.pins.indi3rdpartySearchPlaceholder')"
          :disabled="disabled"
        />
        <button
          @click="$emit('search')"
          :disabled="disabled"
          class="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
        >
          {{ $t('plugins.pins.indi3rdpartySearch') }}
        </button>
      </div>

      <div v-if="loading" class="text-blue-400 text-sm">{{ $t('plugins.pins.scanning') }}</div>

      <div v-else-if="drivers.length === 0" class="text-gray-400 italic py-2">
        {{ $t('plugins.pins.indi3rdpartyNoDrivers') }}
      </div>

      <div v-else class="flex flex-col gap-3">
        <label class="text-gray-400 text-xs uppercase font-bold">{{
          $t('plugins.pins.indi3rdpartySelect')
        }}</label>
        <select
          :value="selectedAsset"
          @change="$emit('update:selectedAsset', $event.target.value)"
          class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
          :disabled="disabled"
        >
          <option value="" disabled>{{ $t('plugins.pins.indi3rdpartySelect') }}</option>
          <option v-for="pkg in drivers" :key="pkg.assetName" :value="pkg.assetName">
            {{ pkg.name }} - {{ pkg.version }} ({{ pkg.architecture }})
          </option>
        </select>

        <button
          @click="$emit('install')"
          :disabled="disabled || installing || !selectedAsset"
          class="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
        >
          {{
            installing
              ? $t('plugins.pins.indi3rdpartyInstalling')
              : $t('plugins.pins.indi3rdpartyInstall')
          }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  drivers: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  installing: {
    type: Boolean,
    default: false,
  },
  searchQuery: {
    type: String,
    default: '',
  },
  selectedAsset: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['refresh', 'search', 'install', 'update:searchQuery', 'update:selectedAsset']);
</script>
