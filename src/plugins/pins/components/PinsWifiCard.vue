<template>
  <div
    class="border border-gray-700 rounded-lg bg-gray-800 shadow-xl p-6 relative overflow-hidden flex flex-col gap-4"
  >
    <div class="absolute top-0 right-20 p-4 opacity-10 pointer-events-none">
      <svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
        />
      </svg>
    </div>

    <div class="flex flex-row items-center justify-between w-full relative z-10">
      <div>
        <h3 class="text-xl font-bold text-white mb-1">{{ $t('plugins.pins.wifiTitle') }}</h3>
        <p class="text-gray-400 text-sm">{{ $t('plugins.pins.stationaryDescription') }}</p>
      </div>
      <div class="flex items-center gap-4">
        <button
          v-if="stationaryMode"
          @click="$emit('scan-wifi')"
          class="text-blue-400 hover:text-white transition-colors p-2"
          :disabled="isScanning"
          :title="$t('plugins.pins.rescan')"
        >
          <svg
            class="w-5 h-5"
            :class="{ 'animate-spin': isScanning }"
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
        <toggleButton
          :status-value="stationaryMode"
          @update:status-value="$emit('toggle-stationary', $event)"
          :disabled="disabled"
        />
      </div>
    </div>

    <div
      class="w-full relative z-10 border border-gray-700 rounded-lg bg-gray-900/40 p-4 flex flex-col gap-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <h4 class="text-base font-bold text-white">{{ $t('plugins.pins.wifiAdaptersTitle') }}</h4>
          <p class="text-gray-400 text-xs">{{ $t('plugins.pins.wifiAdaptersDescription') }}</p>
        </div>
        <button
          class="text-blue-400 hover:text-white transition-colors p-2"
          :disabled="interfacesLoading || interfacesSaving || disabled"
          :title="$t('plugins.pins.wifiAdapterRefresh')"
          @click="$emit('refresh-interfaces')"
        >
          <svg
            class="w-5 h-5"
            :class="{ 'animate-spin': interfacesLoading }"
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

      <div v-if="wifiAdapters.length === 0" class="text-sm text-gray-400 italic">
        {{ $t('plugins.pins.wifiNoAdapters') }}
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="flex flex-col gap-2">
          <label class="text-gray-400 text-xs uppercase font-bold">{{
            $t('plugins.pins.wifiClientInterface')
          }}</label>
          <select
            :value="selectedClientInterface"
            @change="$emit('update:selectedClientInterface', $event.target.value)"
            class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
            :disabled="interfacesLoading || interfacesSaving || disabled"
          >
            <option value="">{{ $t('plugins.pins.wifiAutoInterface') }}</option>
            <option
              v-for="adapter in wifiAdapters"
              :key="adapter.interface"
              :value="adapter.interface"
            >
              {{ formatAdapterLabel(adapter) }}
            </option>
          </select>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-gray-400 text-xs uppercase font-bold">{{
            $t('plugins.pins.wifiHotspotInterface')
          }}</label>
          <select
            :value="selectedHotspotInterface"
            @change="$emit('update:selectedHotspotInterface', $event.target.value)"
            class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
            :disabled="interfacesLoading || interfacesSaving || disabled"
          >
            <option value="">{{ $t('plugins.pins.wifiAutoInterface') }}</option>
            <option
              v-for="adapter in wifiAdapters"
              :key="adapter.interface"
              :value="adapter.interface"
            >
              {{ formatAdapterLabel(adapter) }}
            </option>
          </select>
        </div>
      </div>

      <button
        class="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg shadow-md shadow-blue-900/20 transition-all disabled:opacity-50"
        :disabled="interfacesLoading || interfacesSaving || disabled"
        @click="$emit('save-interfaces')"
      >
        {{
          interfacesSaving
            ? $t('plugins.pins.wifiAdapterSaving')
            : $t('plugins.pins.wifiAdapterSave')
        }}
      </button>
    </div>

    <div
      v-if="stationaryMode"
      class="w-full relative z-10 flex flex-col gap-3 mt-2 animate-fade-in-up"
    >
      <div v-if="isScanning" class="flex items-center gap-2 text-blue-400 py-4 justify-center">
        <svg
          class="animate-spin h-6 w-6"
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
        <span>{{ $t('plugins.pins.scanning') }}</span>
      </div>

      <div v-else-if="wifiList.length > 0" class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-gray-400 text-xs uppercase font-bold">{{
            $t('plugins.pins.wifiSelect')
          }}</label>
          <select
            :value="selectedSsid"
            @change="$emit('update:selectedSsid', $event.target.value)"
            class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
          >
            <option value="" disabled>{{ $t('plugins.pins.wifiSelect') }}</option>
            <option v-for="net in wifiList" :key="net.ssid" :value="net.ssid">
              {{ net.ssid }} ({{ net.quality }}) {{ net.encrypted ? '🔒' : '' }}
            </option>
          </select>
        </div>

        <div class="flex flex-col gap-2" v-if="selectedSsid">
          <label class="text-gray-400 text-xs uppercase font-bold">{{
            $t('plugins.pins.wifiBand')
          }}</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="auto"
                :checked="selectedBand === 'auto'"
                @change="$emit('update:selectedBand', 'auto')"
                class="text-blue-500 bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2"
              />
              <span class="text-white text-sm">{{ $t('plugins.pins.bandAuto') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="2.4GHz"
                :checked="selectedBand === '2.4GHz'"
                @change="$emit('update:selectedBand', '2.4GHz')"
                class="text-blue-500 bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2"
              />
              <span class="text-white text-sm">{{ $t('plugins.pins.band24') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="5GHz"
                :checked="selectedBand === '5GHz'"
                @change="$emit('update:selectedBand', '5GHz')"
                class="text-blue-500 bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2"
              />
              <span class="text-white text-sm">{{ $t('plugins.pins.band5') }}</span>
            </label>
          </div>
        </div>

        <div class="flex flex-col gap-2" v-if="selectedSsid">
          <label class="text-gray-400 text-xs uppercase font-bold">{{
            $t('plugins.pins.wifiPassword')
          }}</label>
          <input
            :value="wifiPassword"
            @input="$emit('update:wifiPassword', $event.target.value)"
            type="password"
            class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
            placeholder="********"
          />
        </div>

        <div v-if="selectedSsid" class="flex flex-row items-center gap-2 mt-2">
          <input
            type="checkbox"
            :checked="autoConnect"
            @change="$emit('update:autoConnect', $event.target.checked)"
            id="autoConnect"
            class="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label for="autoConnect" class="text-white text-sm cursor-pointer select-none">
            {{ $t('plugins.pins.autoConnect') }}
          </label>
        </div>

        <button
          v-if="selectedSsid"
          class="mt-2 w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
          :disabled="disabled"
          @click="$emit('connect-wifi')"
        >
          {{ $t('plugins.pins.wifiConnect') }}
        </button>

        <button
          class="w-full py-3 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg shadow-lg shadow-red-900/20 transition-all disabled:opacity-50"
          :disabled="disabled"
          @click="$emit('disconnect-wifi')"
        >
          {{ $t('plugins.pins.wifiDisconnect') }}
        </button>
      </div>

      <div v-else class="text-gray-400 italic py-4 text-center">
        {{ $t('plugins.pins.noNetworks') }}
      </div>
    </div>

    <div class="w-full relative z-10 border-t border-gray-700 pt-4 mt-1 flex flex-col gap-3">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h4 class="text-base font-bold text-white">
            {{ $t('plugins.pins.hotspotPasswordTitle') }}
          </h4>
          <p class="text-gray-400 text-xs">
            {{
              hotspotConfigured
                ? $t('plugins.pins.hotspotConfigured')
                : $t('plugins.pins.hotspotNotConfigured')
            }}
          </p>
        </div>
        <button
          class="text-blue-400 hover:text-white transition-colors p-2"
          :disabled="hotspotLoading || hotspotSaving || disabled"
          :title="$t('plugins.pins.hotspotRefresh')"
          @click="$emit('load-hotspot')"
        >
          <svg
            class="w-5 h-5"
            :class="{ 'animate-spin': hotspotLoading }"
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

      <div class="flex flex-col gap-2">
        <label class="text-gray-400 text-xs uppercase font-bold">{{
          $t('plugins.pins.hotspotNewPassword')
        }}</label>
        <input
          :value="hotspotPassword"
          @input="$emit('update:hotspotPassword', $event.target.value)"
          type="password"
          class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none w-full"
          placeholder="********"
          :disabled="hotspotSaving || hotspotLoading || disabled"
        />
        <p class="text-xs text-gray-500">{{ $t('plugins.pins.hotspotPasswordHint') }}</p>
      </div>

      <button
        class="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
        :disabled="
          hotspotSaving ||
          hotspotLoading ||
          disabled ||
          !hotspotPassword ||
          hotspotPassword.length < 8
        "
        @click="$emit('save-hotspot')"
      >
        {{ hotspotSaving ? $t('plugins.pins.hotspotSaving') : $t('plugins.pins.hotspotSave') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import toggleButton from '@/components/helpers/toggleButton.vue';

defineProps({
  stationaryMode: {
    type: Boolean,
    required: true,
  },
  isScanning: {
    type: Boolean,
    required: true,
  },
  wifiList: {
    type: Array,
    required: true,
  },
  selectedSsid: {
    type: String,
    required: true,
  },
  wifiPassword: {
    type: String,
    required: true,
  },
  selectedBand: {
    type: String,
    required: true,
  },
  autoConnect: {
    type: Boolean,
    required: true,
  },
  wifiAdapters: {
    type: Array,
    required: true,
  },
  interfacesLoading: {
    type: Boolean,
    required: true,
  },
  interfacesSaving: {
    type: Boolean,
    required: true,
  },
  selectedClientInterface: {
    type: String,
    required: true,
  },
  selectedHotspotInterface: {
    type: String,
    required: true,
  },
  hotspotConfigured: {
    type: Boolean,
    required: true,
  },
  hotspotPassword: {
    type: String,
    required: true,
  },
  hotspotLoading: {
    type: Boolean,
    required: true,
  },
  hotspotSaving: {
    type: Boolean,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits([
  'toggle-stationary',
  'scan-wifi',
  'refresh-interfaces',
  'save-interfaces',
  'connect-wifi',
  'disconnect-wifi',
  'update:selectedSsid',
  'update:wifiPassword',
  'update:selectedBand',
  'update:autoConnect',
  'update:selectedClientInterface',
  'update:selectedHotspotInterface',
  'update:hotspotPassword',
  'load-hotspot',
  'save-hotspot',
]);

function formatAdapterLabel(adapter) {
  if (!adapter || !adapter.interface) {
    return '';
  }

  const parts = [adapter.interface];
  if (adapter.role && adapter.role !== 'idle') {
    parts.push(adapter.role);
  }
  if (adapter.state) {
    parts.push(adapter.state);
  }
  if (adapter.driver) {
    parts.push(adapter.driver);
  }

  return parts.join(' | ');
}
</script>
