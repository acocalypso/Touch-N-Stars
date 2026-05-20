<template>
  <div class="space-y-4">
    <!-- Error Message -->
    <div v-if="store.error" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <p class="text-red-400 font-medium">{{ store.error }}</p>
    </div>

    <!-- Buck Port Section -->
    <div v-if="buckPort" class="space-y-2">
      <h3 class="text-sm font-semibold text-gray-300 mb-2">Buck Converter</h3>
      <div class="border rounded-lg p-4 transition-all" :class="getPortClass(buckPort)">
        <PortCard
          :port="buckPort"
          port-type="buck"
          @rename="renameBuckPort"
          @toggle-enabled="toggleBuckEnabled"
          @toggle-boot="toggleBuckBootState"
          @set-voltage="setBuckVoltage"
        />
      </div>
    </div>

    <!-- PWM Port Section -->
    <div v-if="pwmPort" class="space-y-2">
      <h3 class="text-sm font-semibold text-gray-300 mb-2">PWM Output</h3>
      <div class="border rounded-lg p-4 transition-all" :class="getPortClass(pwmPort)">
        <PortCard
          :port="pwmPort"
          port-type="pwm"
          @rename="renamePwmPort"
          @toggle-enabled="togglePwmEnabled"
          @set-power="setPwmPower"
        />
      </div>
    </div>

    <!-- No Ports Message -->
    <div v-if="!buckPort && !pwmPort" class="p-4 bg-gray-800/30 border border-gray-600 rounded-lg">
      <p class="text-gray-400 text-sm">{{ $t('common.noPorts') }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePinsDeviceStore } from '../store/pinsDevicesStore.js';
import PortCard from './PortCard.vue';

const store = usePinsDeviceStore();

const buckPort = computed(() => {
  return store.buckPorts.Ports.length > 0 ? store.buckPorts.Ports[0] : null;
});

const pwmPort = computed(() => {
  return store.pwmPorts.Ports.length > 0 ? store.pwmPorts.Ports[0] : null;
});

const getPortClass = (port) => {
  if (!port) return '';
  return [port.Enabled ? 'border-green-500/50 bg-green-500/10' : 'border-gray-600 bg-gray-800/30'];
};

const renameBuckPort = async (name) => {
  await store.setBuckPortName(name);
};

const renamePwmPort = async (name) => {
  await store.setPwmPortName(name);
};

const toggleBuckEnabled = async () => {
  await store.setBuckPortState(!buckPort.value.Enabled);
};

const togglePwmEnabled = async () => {
  const currentPower = pwmPort.value.Power;
  const success = await store.setPwmPortState(!pwmPort.value.Enabled);
  if (!success) {
    console.error('Failed to toggle port');
  } else {
    // After toggling, update power: 0 when disabling, current power when enabling
    const newPower = pwmPort.value.Enabled ? currentPower : 0;
    await store.setPwmPortPower(newPower);
  }
};

const toggleBuckBootState = async () => {
  await store.setBuckPortBootState(!buckPort.value.BootState);
};

const setBuckVoltage = async (voltage) => {
  await store.setBuckPortVoltage(voltage);
};

const setPwmPower = async (power) => {
  await store.setPwmPortPower(power);
};
</script>
