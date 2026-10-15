<template>
  <section class="border border-gray-700 rounded-lg bg-gray-800 shadow-xl p-6 space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-xl font-bold text-white">{{ $t('plugins.pins.savedWifi.title') }}</h3>
      <button class="tns-btn-secondary" :disabled="busy || disabled" @click="load">
        {{ $t('common.refresh') }}
      </button>
    </div>
    <p class="text-sm text-gray-400">{{ $t('plugins.pins.savedWifi.description') }}</p>
    <p class="text-xs text-gray-400">{{ $t('plugins.pins.savedWifi.retryHint') }}</p>
    <button class="tns-btn-secondary" :disabled="busy || disabled" @click="$emit('retry')">
      {{ $t('plugins.pins.savedWifi.retry') }}
    </button>
    <p v-if="loading" class="text-gray-400">{{ $t('common.loading') }}</p>
    <p v-if="error" role="alert" class="text-red-300">{{ error }}</p>
    <p v-if="!loading && !error && !networks.length" class="text-gray-400">
      {{ $t('plugins.pins.savedWifi.empty') }}
    </p>
    <div
      v-for="network in networks"
      :key="network.uuid"
      class="border-t border-gray-700 pt-4 space-y-3"
    >
      <div class="flex flex-wrap items-center gap-2">
        <strong class="text-white break-all">{{ network.ssid }}</strong>
        <span v-if="network.connected" class="text-emerald-300 text-sm">
          {{ $t('plugins.pins.wifiConnectedAction') }}
        </span>
        <span v-if="!network.compatible" class="text-amber-300 text-sm">
          {{ $t('plugins.pins.savedWifi.otherAdapter', { interface: network.interface }) }}
        </span>
      </div>
      <p v-if="network.name !== network.ssid" class="text-xs text-gray-400 break-all">
        {{ network.name }}
      </p>
      <label class="flex items-center gap-2 text-sm text-white">
        <input v-model="network.editedAutoConnect" type="checkbox" :disabled="busy || disabled" />
        {{ $t('plugins.pins.autoConnect') }}
      </label>
      <label class="flex items-center gap-3 text-sm text-white">
        {{ $t('plugins.pins.savedWifi.priority') }}
        <input
          v-model.number="network.editedPriority"
          type="number"
          min="-999"
          max="999"
          step="1"
          :disabled="busy || disabled"
          class="w-24 bg-gray-900 border border-gray-600 rounded p-2"
        />
      </label>
      <div class="flex flex-wrap gap-2">
        <button class="tns-btn-secondary" :disabled="busy || disabled" @click="save(network)">
          {{ $t('general.save') }}
        </button>
        <button
          class="tns-btn-secondary"
          :disabled="busy || disabled || network.connected || !network.compatible"
          @click="$emit('connect', network)"
        >
          {{ $t('plugins.pins.wifiConnect') }}
        </button>
        <button
          class="tns-btn-secondary text-red-300"
          :disabled="busy || disabled || network.connected"
          @click="confirmForget = network.uuid"
        >
          {{ $t('plugins.pins.savedWifi.forget') }}
        </button>
      </div>
      <div v-if="confirmForget === network.uuid" class="space-y-2 text-sm text-gray-300">
        <p>{{ $t('plugins.pins.savedWifi.forgetConfirm', { ssid: network.ssid }) }}</p>
        <button
          class="tns-btn-secondary mr-2"
          :disabled="busy || disabled"
          @click="forget(network)"
        >
          {{ $t('common.confirm') }}
        </button>
        <button class="tns-btn-secondary" :disabled="busy" @click="confirmForget = ''">
          {{ $t('common.cancel') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import apiPinsService from '@/services/apiPinsService';
import { savedNetworkSettings, waitForSavedNetworkJob } from '../composables/savedWifiNetworks';

const props = defineProps({ disabled: Boolean, wifiStatus: { type: Object, default: null } });
const emit = defineEmits(['connect', 'retry', 'busy']);
const { t } = useI18n();
const networks = ref([]);
const loading = ref(false);
const busy = ref(false);
const error = ref('');
const confirmForget = ref('');
let disposed = false;

async function load() {
  if (disposed || loading.value) return;
  loading.value = true;
  error.value = '';
  try {
    const response = await apiPinsService.getPinsSavedWifiNetworks();
    if (!disposed) {
      networks.value = (response.networks || []).map((network) => ({
        ...network,
        editedPriority: network.priority,
        editedAutoConnect: network.auto_connect,
      }));
    }
  } catch (err) {
    if (!disposed) {
      error.value = t('plugins.pins.savedWifi.loadFailed');
    }
  } finally {
    loading.value = false;
  }
}

async function run(operation) {
  if (busy.value || props.disabled) return;
  busy.value = true;
  emit('busy', true);
  error.value = '';
  try {
    const job = await operation();
    await waitForSavedNetworkJob(job, (id) => apiPinsService.getPinsDaemonJob(id), {
      cancelled: () => disposed,
    });
    confirmForget.value = '';
    await load();
  } catch (err) {
    if (!disposed) error.value = t('plugins.pins.savedWifi.operationFailed');
  } finally {
    busy.value = false;
    emit('busy', false);
  }
}

function save(network) {
  let settings;
  try {
    settings = savedNetworkSettings(network);
  } catch {
    error.value = t('plugins.pins.savedWifi.invalidPriority');
    return;
  }
  return run(() => apiPinsService.updatePinsSavedWifiNetwork(network.uuid, settings));
}

function forget(network) {
  return run(() => apiPinsService.forgetPinsSavedWifiNetwork(network.uuid));
}

watch(
  () => `${props.wifiStatus?.ssid || ''}:${props.wifiStatus?.observedMode || ''}`,
  () => {
    if (!busy.value) load();
  }
);
watch(
  () => props.disabled,
  (disabled) => {
    if (!disabled && !busy.value) load();
  }
);
onMounted(load);
onUnmounted(() => {
  disposed = true;
});
</script>
