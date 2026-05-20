<template>
  <div class="flex flex-col space-y-6">
    <PinsWifiCard
      :stationary-mode="stationaryMode"
      :allow-concurrent-mode="allowConcurrentMode"
      :is-scanning="isScanning"
      :wifi-list="wifiList"
      :selected-ssid="selectedSsid"
      :wifi-password="wifiPassword"
      :selected-band="selectedBand"
      :auto-connect="autoConnect"
      :wifi-adapters="wifiAdapters"
      :interfaces-loading="interfacesLoading"
      :interfaces-saving="interfacesSaving"
      :selected-client-interface="selectedClientInterface"
      :selected-hotspot-interface="selectedHotspotInterface"
      :hotspot-configured="hotspotConfigured"
      :hotspot-password="hotspotPassword"
      :hotspot-loading="hotspotLoading"
      :hotspot-saving="hotspotSaving"
      :disabled="disabled"
      @toggle-stationary="$emit('toggle-stationary', $event)"
      @scan-wifi="$emit('scan-wifi')"
      @refresh-interfaces="$emit('refresh-interfaces')"
      @save-interfaces="$emit('save-interfaces')"
      @connect-wifi="$emit('connect-wifi')"
      @disconnect-wifi="$emit('disconnect-wifi')"
      @update:selected-ssid="$emit('update:selected-ssid', $event)"
      @update:wifi-password="$emit('update:wifi-password', $event)"
      @update:selected-band="$emit('update:selected-band', $event)"
      @update:auto-connect="$emit('update:auto-connect', $event)"
      @update:selected-client-interface="$emit('update:selected-client-interface', $event)"
      @update:selected-hotspot-interface="$emit('update:selected-hotspot-interface', $event)"
      @update:hotspot-password="$emit('update:hotspot-password', $event)"
      @load-hotspot="$emit('load-hotspot')"
      @save-hotspot="$emit('save-hotspot')"
    />

    <PinsDhcpClientsCard
      v-if="!stationaryMode || allowConcurrentMode"
      :clients="dhcpClients"
      :loading="dhcpClientsLoading"
      @refresh="$emit('refresh-dhcp')"
    />
  </div>
</template>

<script setup>
import PinsWifiCard from '../PinsWifiCard.vue';
import PinsDhcpClientsCard from '../PinsDhcpClientsCard.vue';

defineProps({
  stationaryMode: {
    type: Boolean,
    required: true,
  },
  allowConcurrentMode: {
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
    required: true,
  },
  dhcpClients: {
    type: Array,
    required: true,
  },
  dhcpClientsLoading: {
    type: Boolean,
    required: true,
  },
});

defineEmits([
  'toggle-stationary',
  'scan-wifi',
  'refresh-interfaces',
  'save-interfaces',
  'connect-wifi',
  'disconnect-wifi',
  'update:selected-ssid',
  'update:wifi-password',
  'update:selected-band',
  'update:auto-connect',
  'update:selected-client-interface',
  'update:selected-hotspot-interface',
  'update:hotspot-password',
  'load-hotspot',
  'save-hotspot',
  'refresh-dhcp',
]);
</script>
