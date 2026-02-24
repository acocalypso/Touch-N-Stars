<template>
  <div class="min-h-screen bg-gray-900">
    <div v-if="store.isAnyDeviceConnected" class="container py-10">
      <div class="max-w-4xl mx-auto space-y-5">
        <!-- Header Section -->
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-white">{{ t('plugins.pinsDevices.title') }}</h2>
          <div class="flex justify-between w-full gap-4 mt-1">
            <span class="text-gray-400 text-sm">
              {{ t('plugins.pinsDevices.settings.temperature') }}
              {{
                store.isPowerboxConnected &&
                typeof store.powerboxStatus.Temperature === 'number' &&
                store.powerboxStatus.Temperature !== undefined &&
                !isNaN(store.powerboxStatus.Temperature)
                  ? store.powerboxStatus.Temperature.toFixed(1)
                  : store.isMeteostationConnected &&
                      typeof store.meteoStationStatus.Temperature === 'number' &&
                      store.meteoStationStatus.Temperature !== undefined &&
                      !isNaN(store.meteoStationStatus.Temperature)
                    ? store.meteoStationStatus.Temperature.toFixed(1)
                    : '--'
              }}°C
            </span>
            <span class="text-gray-400 text-sm">
              {{ t('plugins.pinsDevices.settings.humidity') }}
              {{
                store.isPowerboxConnected &&
                typeof store.powerboxStatus.Humidity === 'number' &&
                store.powerboxStatus.Humidity !== undefined &&
                !isNaN(store.powerboxStatus.Humidity)
                  ? store.powerboxStatus.Humidity.toFixed(1)
                  : store.isMeteostationConnected &&
                      typeof store.meteoStationStatus.Humidity === 'number' &&
                      store.meteoStationStatus.Humidity !== undefined &&
                      !isNaN(store.meteoStationStatus.Humidity)
                    ? store.meteoStationStatus.Humidity.toFixed(1)
                    : '--'
              }}%
            </span>
            <span class="text-gray-400 text-sm">
              {{ t('plugins.pinsDevices.settings.dewPoint') }}
              {{
                store.isPowerboxConnected &&
                typeof store.powerboxStatus.DewPoint === 'number' &&
                store.powerboxStatus.DewPoint !== undefined &&
                !isNaN(store.powerboxStatus.DewPoint)
                  ? store.powerboxStatus.DewPoint.toFixed(1)
                  : store.isMeteostationConnected &&
                      typeof store.meteoStationStatus.DewPoint === 'number' &&
                      store.meteoStationStatus.DewPoint !== undefined &&
                      !isNaN(store.meteoStationStatus.DewPoint)
                    ? store.meteoStationStatus.DewPoint.toFixed(1)
                    : '--'
              }}°C
            </span>
          </div>
        </div>

        <!-- Tabs Container -->
        <div
          class="border border-gray-700 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg"
        >
          <!-- Tab Buttons -->
          <div class="flex border-b border-gray-700">
            <button
              class="px-4 py-3 text-sm font-semibold"
              :class="
                activeTab === 'general'
                  ? 'text-white border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-white'
              "
              @click="setActiveTab('general')"
            >
              {{ t('plugins.pinsDevices.settings.general') }}
            </button>

            <button
              :disabled="!store.isPowerboxConnected"
              class="px-4 py-3 text-sm font-semibold transition-all"
              :class="{
                'text-white border-b-2 border-cyan-400': activeTab === 'ports',
                'text-gray-400 hover:text-white':
                  activeTab !== 'ports' && store.isPowerboxConnected,
                'text-gray-600 cursor-not-allowed': !store.isPowerboxConnected,
              }"
              @click="store.isPowerboxConnected && setActiveTab('ports')"
            >
              {{ t('plugins.pinsDevices.settings.ports') }}
            </button>

            <button
              :disabled="!store.isMeteostationConnected"
              class="px-4 py-3 text-sm font-semibold transition-all"
              :class="{
                'text-white border-b-2 border-cyan-400': activeTab === 'weather',
                'text-gray-400 hover:text-white':
                  activeTab !== 'weather' && store.isMeteostationConnected,
                'text-gray-600 cursor-not-allowed': !store.isMeteostationConnected,
              }"
              @click="store.isMeteostationConnected && setActiveTab('weather')"
            >
              {{ t('plugins.pinsDevices.settings.weather') }}
            </button>

            <button
              class="px-4 py-3 text-sm font-semibold"
              :class="
                activeTab === 'configuration'
                  ? 'text-white border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-white'
              "
              @click="setActiveTab('configuration')"
            >
              {{ t('plugins.pinsDevices.settings.configuration') }}
            </button>
          </div>

          <!-- Tab Content -->
          <div class="p-5">
            <!-- General Tab -->
            <div v-show="activeTab === 'general'">
              <PinsDeviceGeneralTab />
            </div>

            <!-- Ports Tab with Sub-tabs -->
            <div v-show="activeTab === 'ports'" class="space-y-4">
              <!-- Ports Sub-Tab Buttons -->
              <div class="border border-gray-700 rounded-lg bg-gray-800/50">
                <div class="flex border-b border-gray-700">
                  <button
                    class="px-4 py-2 text-sm font-semibold"
                    :class="
                      activePortsSubTab === 'power'
                        ? 'text-white border-b-2 border-cyan-400'
                        : 'text-gray-400 hover:text-white'
                    "
                    @click="setActivePortsSubTab('power')"
                  >
                    {{ t('plugins.pinsDevices.settings.powerPorts') }}
                  </button>
                  <button
                    class="px-4 py-2 text-sm font-semibold"
                    :class="
                      activePortsSubTab === 'usb'
                        ? 'text-white border-b-2 border-cyan-400'
                        : 'text-gray-400 hover:text-white'
                    "
                    @click="setActivePortsSubTab('usb')"
                  >
                    {{ t('plugins.pinsDevices.settings.usbPorts') }}
                  </button>
                  <button
                    class="px-4 py-2 text-sm font-semibold"
                    :class="
                      activePortsSubTab === 'dew'
                        ? 'text-white border-b-2 border-cyan-400'
                        : 'text-gray-400 hover:text-white'
                    "
                    @click="setActivePortsSubTab('dew')"
                  >
                    {{ t('plugins.pinsDevices.settings.dewPorts') }}
                  </button>
                  <button
                    class="px-4 py-2 text-sm font-semibold"
                    :class="
                      activePortsSubTab === 'adjustable'
                        ? 'text-white border-b-2 border-cyan-400'
                        : 'text-gray-400 hover:text-white'
                    "
                    @click="setActivePortsSubTab('adjustable')"
                  >
                    {{ t('plugins.pinsDevices.settings.adjustablePower') }}
                  </button>
                </div>

                <!-- Ports Sub-Tab Content -->
                <div class="p-4">
                  <div v-show="activePortsSubTab === 'power'">
                    <PinsDevicePowerPortsTab />
                  </div>
                  <div v-show="activePortsSubTab === 'usb'">
                    <PinsDeviceUsbPortsTab />
                  </div>
                  <div v-show="activePortsSubTab === 'dew'">
                    <PinsDeviceDewPortsTab />
                  </div>
                  <div v-show="activePortsSubTab === 'adjustable'">
                    <PinsDeviceAdjustablePowerTab />
                  </div>
                </div>
              </div>
            </div>

            <!-- Weather Tab -->
            <div v-show="activeTab === 'weather'">
              <PinsDeviceWeatherTab />
            </div>

            <!-- Configuration Tab -->
            <div v-show="activeTab === 'configuration'">
              <PinsDeviceConfigurationTab />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Device Connected Message -->
    <div v-else class="container py-10">
      <div class="max-w-4xl mx-auto">
        <div class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p class="text-red-400 font-medium text-center">
            {{ $t('plugins.pinsDevices.status.notConnected') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import PinsDeviceGeneralTab from './PinsDeviceGeneralTab.vue';
import PinsDevicePowerPortsTab from './PinsDevicePowerPortsTab.vue';
import PinsDeviceUsbPortsTab from './PinsDeviceUsbPortsTab.vue';
import PinsDeviceDewPortsTab from './PinsDeviceDewPortsTab.vue';
import PinsDeviceAdjustablePowerTab from './PinsDeviceAdjustablePowerTab.vue';
import PinsDeviceWeatherTab from './PinsDeviceWeatherTab.vue';
import PinsDeviceConfigurationTab from './PinsDeviceConfigurationTab.vue';
import { usePinsDeviceStore } from '../store/pinsDevicesStore.js';

const { t } = useI18n();
const store = usePinsDeviceStore();
const activeTab = ref('general');
const activePortsSubTab = ref('power');

const setActiveTab = (tab) => {
  activeTab.value = tab;
};

const setActivePortsSubTab = (subTab) => {
  activePortsSubTab.value = subTab;
};

onMounted(async () => {
  await store.loadAllData();
});
</script>
