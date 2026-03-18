<template>
  <div class="space-y-6">
    <!-- Error Message -->
    <div v-if="store.error" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <p class="text-red-400 font-medium">{{ store.error }}</p>
    </div>

    <!-- Device Status Section -->
    <div
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('plugins.pinsDevices.settings.generalDescription') }}
      </h3>

      <!-- Powerbox Connection Status -->
      <div class="mt-4">
        <h4 class="text-gray-200 font-semibold mb-3 flex items-center gap-2">
          <span
            class="inline-block w-2 h-2 rounded-full transition-colors"
            :class="store.isPowerboxConnected ? 'bg-green-500' : 'bg-gray-500'"
          ></span>
          PINS.PowerBox
        </h4>
        <div class="space-y-2 ml-4">
          <div v-if="!store.isPowerboxConnected" class="text-gray-400 italic text-sm">
            {{ $t('plugins.pinsDevices.status.notConnected') }}
          </div>
          <div v-else class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">{{ $t('plugins.pinsDevices.info.deviceId') }}</span>
              <span class="text-gray-200 font-mono">{{ store.powerboxInfo.Id }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">{{ $t('plugins.pinsDevices.info.firmware') }}</span>
              <span class="text-gray-200">{{ store.powerboxInfo.Firmware }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">{{ $t('plugins.pinsDevices.info.driverVersion') }}</span>
              <span class="text-gray-200">{{ store.powerboxInfo.DriverVersion }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">{{ $t('plugins.pinsDevices.weather.uptime') }}</span>
              <span class="text-gray-200 font-mono">{{ store.powerboxStatus.UpTime }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">{{ $t('plugins.pinsDevices.info.coreTemp') }}</span>
              <span class="text-gray-200 font-mono"
                >{{ Number(store.powerboxStatus.CoreTemp).toFixed(1) }}°C</span
              >
            </div>

            <!-- Port Information -->
            <div class="border-t border-gray-700 pt-3 mt-3">
              <h5 class="text-gray-300 font-semibold text-sm mb-2">
                {{ $t('plugins.pinsDevices.info.ports') }}
              </h5>
              <div class="grid grid-cols-2 gap-2 text-sm ml-2">
                <div class="flex justify-between">
                  <span class="text-gray-400">{{ $t('plugins.pinsDevices.info.powerPorts') }}</span>
                  <span class="text-cyan-400 font-semibold">{{
                    store.powerboxInfo.PowerPorts
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">{{ $t('plugins.pinsDevices.info.usbPorts') }}</span>
                  <span class="text-cyan-400 font-semibold">{{ store.powerboxInfo.USBPorts }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">{{ $t('plugins.pinsDevices.info.dewPorts') }}</span>
                  <span class="text-cyan-400 font-semibold">{{ store.powerboxInfo.DewPorts }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">{{ $t('plugins.pinsDevices.info.adjPorts') }}</span>
                  <span class="text-cyan-400 font-semibold">{{
                    store.powerboxInfo.BuckPorts + store.powerboxInfo.PWMPorts
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Power Status -->
            <div class="border-t border-gray-700 pt-3 mt-3">
              <h5 class="text-gray-300 font-semibold text-sm mb-2">
                {{ $t('plugins.pinsDevices.info.powerStatus') }}
              </h5>
              <div class="space-y-2 text-sm ml-2">
                <div class="flex justify-between">
                  <span class="text-gray-400">12V Rail</span>
                  <span class="text-gray-200">
                    {{ store.powerboxStatus.Rail12V.toFixed(2) }}V /
                    {{ store.powerboxStatus.Rail12A.toFixed(2) }}A /
                    {{ store.powerboxStatus.Rail12W.toFixed(2) }}W
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">5V Rail</span>
                  <span class="text-gray-200">
                    {{ store.powerboxStatus.Rail5V.toFixed(2) }}V
                    <span
                      v-if="
                        store.powerboxStatus.Rail5A !== 'NaN' &&
                        store.powerboxStatus.Rail5A !== undefined
                      "
                    >
                      / {{ store.powerboxStatus.Rail5A.toFixed(2) }}A
                    </span>
                    <span
                      v-if="
                        store.powerboxStatus.Rail5W !== 'NaN' &&
                        store.powerboxStatus.Rail5W !== undefined
                      "
                    >
                      / {{ store.powerboxStatus.Rail5W.toFixed(2) }}W
                    </span>
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Average Amps</span>
                  <span class="text-gray-200"
                    >{{ store.powerboxStatus.AverageAmps.toFixed(2) }}A</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Amps/Hour</span>
                  <span class="text-gray-200"
                    >{{ store.powerboxStatus.AmpsPerHour.toFixed(2) }}Ah</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Watts/Hour</span>
                  <span class="text-gray-200"
                    >{{ store.powerboxStatus.WattsPerHour.toFixed(2) }}Wh</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MeteoStation Connection Status -->
      <div class="mt-6">
        <h4 class="text-gray-200 font-semibold mb-3 flex items-center gap-2">
          <span
            class="inline-block w-2 h-2 rounded-full transition-colors"
            :class="store.isMeteostationConnected ? 'bg-green-500' : 'bg-gray-500'"
          ></span>
          PINS.MeteoStation
        </h4>
        <div class="space-y-2 ml-4">
          <div v-if="!store.isMeteostationConnected" class="text-gray-400 italic text-sm">
            {{ $t('plugins.pinsDevices.status.notConnected') }}
          </div>
          <div v-else class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">{{ $t('plugins.pinsDevices.info.deviceId') }}</span>
              <span class="text-gray-200 font-mono">{{ store.meteoStationInfo.Id }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">{{ $t('plugins.pinsDevices.info.firmware') }}</span>
              <span class="text-gray-200">{{ store.meteoStationInfo.Firmware }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">{{ $t('plugins.pinsDevices.info.driverVersion') }}</span>
              <span class="text-gray-200">{{ store.meteoStationInfo.DriverVersion }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">{{ $t('plugins.pinsDevices.weather.uptime') }}</span>
              <span class="text-gray-200 font-mono">{{ store.meteoStationStatus.UpTime }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { usePinsDeviceStore } from '../store/pinsDevicesStore.js';

const store = usePinsDeviceStore();

onMounted(async () => {
  await store.loadAllData();
  // Start polling for real-time updates (1 second interval)
  store.startPolling(1000);
});

onUnmounted(() => {
  // Stop polling when component is unmounted
  store.stopPolling();
});
</script>
