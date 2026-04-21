<template>
  <div class="border border-gray-700 rounded-lg bg-gray-800 shadow-xl p-6 relative overflow-hidden">
    <div class="absolute top-0 right-20 p-4 opacity-10 pointer-events-none">
      <svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 11H5m14-6H5m14 12H5m14 6H5"
        />
      </svg>
    </div>

    <div class="relative z-10 flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 class="text-xl font-bold text-white mb-1">{{ $t('plugins.pins.pluginsTitle') }}</h3>
          <p class="text-gray-400 text-sm">{{ $t('plugins.pins.pluginsDescription') }}</p>
        </div>

        <button
          class="text-blue-400 hover:text-white transition-colors p-2 self-end sm:self-auto"
          :disabled="loading || disabled"
          :title="$t('plugins.pins.pluginsRefresh')"
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

      <div class="text-xs text-gray-400">
        {{ $t('plugins.pins.pluginsCheckedAt') }}:
        {{ checkedAt ? new Date(checkedAt).toLocaleString() : '-' }}
      </div>

      <div v-if="loading" class="text-blue-400 text-sm">{{ $t('plugins.pins.scanning') }}</div>

      <div v-else-if="plugins.length === 0" class="text-gray-400 italic py-2">
        {{ $t('plugins.pins.pluginsEmpty') }}
      </div>

      <div v-else class="max-h-96 overflow-y-auto border border-gray-700 rounded-lg">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-900 text-gray-300 sticky top-0">
            <tr>
              <th class="px-4 py-3">{{ $t('plugins.pins.pluginsPackage') }}</th>
              <th class="px-4 py-3">{{ $t('plugins.pins.pluginsInstalled') }}</th>
              <th class="px-4 py-3">{{ $t('plugins.pins.pluginsVersion') }}</th>
              <th class="px-4 py-3 text-right">{{ $t('plugins.pins.pluginsAction') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="plugin in plugins"
              :key="plugin.packageName"
              class="border-t border-gray-700 text-gray-200"
            >
              <td class="px-4 py-3 font-medium break-all">{{ plugin.packageName }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center rounded px-2 py-1 text-xs font-semibold"
                  :class="
                    plugin.installed
                      ? 'bg-emerald-700/40 text-emerald-200 border border-emerald-500/40'
                      : 'bg-gray-700/60 text-gray-300 border border-gray-500/40'
                  "
                >
                  {{
                    plugin.installed
                      ? $t('plugins.pins.pluginsInstalledYes')
                      : $t('plugins.pins.pluginsInstalledNo')
                  }}
                </span>
              </td>
              <td class="px-4 py-3">{{ plugin.installedVersion || '-' }}</td>
              <td class="px-4 py-3">
                <div class="flex justify-end">
                  <button
                    v-if="!plugin.installed"
                    class="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded transition-colors disabled:opacity-50"
                    :disabled="disabled || busyPackage === plugin.packageName"
                    @click="$emit('install', plugin.packageName)"
                  >
                    {{
                      busyPackage === plugin.packageName
                        ? $t('plugins.pins.pluginsInstalling')
                        : $t('plugins.pins.pluginsInstall')
                    }}
                  </button>
                  <button
                    v-else
                    class="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50"
                    :disabled="disabled || busyPackage === plugin.packageName"
                    @click="$emit('uninstall', plugin.packageName)"
                  >
                    {{
                      busyPackage === plugin.packageName
                        ? $t('plugins.pins.pluginsUninstalling')
                        : $t('plugins.pins.pluginsUninstall')
                    }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  plugins: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  checkedAt: {
    type: String,
    default: '',
  },
  busyPackage: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['refresh', 'install', 'uninstall']);
</script>
