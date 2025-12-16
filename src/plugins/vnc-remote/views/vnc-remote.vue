<template>
  <div class="container py-6">
    <div class="container max-w-7xl space-y-4">
      <h5 class="text-2xl text-center font-bold text-white">VNC Remote</h5>

      <div class="grid gap-4 lg:grid-cols-3">
        <div
          class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5 space-y-4"
        >
          <div class="flex items-center justify-between">
            <h6 class="text-lg font-semibold text-white">Connection</h6>
            <span class="text-sm text-gray-400">{{ statusMessage }}</span>
          </div>

          <div class="grid gap-3">
            <label class="text-sm text-gray-300">
              Host
              <input
                v-model.trim="host"
                type="text"
                class="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none"
                placeholder="raspberrypi.local"
                autocomplete="off"
              />
            </label>

            <label class="text-sm text-gray-300">
              Port
              <input
                v-model.trim="port"
                type="number"
                min="1"
                max="65535"
                class="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none"
                placeholder="6080"
              />
            </label>

            <div class="flex items-center gap-3 pt-2">
              <button
                class="flex-1 rounded bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isConnecting || isConnected || !canConnect"
                @click="connect"
              >
                {{ isConnecting ? 'Connecting...' : 'Connect' }}
              </button>
              <button
                class="flex-1 rounded bg-gray-700 px-4 py-2 font-semibold text-white shadow hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!rfbInstance && !isConnected"
                @click="disconnect"
              >
                Disconnect
              </button>
            </div>

            <div class="space-y-1 text-sm">
              <div class="text-gray-300">
                URL: <span class="text-gray-100">{{ connectionUrl }}</span>
              </div>
              <div v-if="errorMessage" class="text-red-400">{{ errorMessage }}</div>
            </div>
          </div>
        </div>

        <div
          class="lg:col-span-2 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5 space-y-4"
        >
          <div class="flex items-center justify-between">
            <h6 class="text-lg font-semibold text-white">Remote Display</h6>
            <span class="text-sm text-gray-400">{{ isConnected ? 'Live' : 'Idle' }}</span>
          </div>

          <div
            ref="viewerRef"
            class="relative h-[70vh] w-full overflow-hidden rounded border border-gray-800 bg-black/60"
          >
            <div
              v-if="!isConnected"
              class="absolute inset-0 flex flex-col items-center justify-center space-y-2"
            >
              <div class="text-gray-200 font-semibold">Not connected</div>
              <div class="text-sm text-gray-400">Press Connect to open your VNC session</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useSettingsStore } from '@/store/settingsStore';

const settingsStore = useSettingsStore();

const host = ref('');
const port = ref('6080');

const isConnecting = ref(false);
const isConnected = ref(false);
const statusMessage = ref('Not connected');
const errorMessage = ref('');

const viewerRef = ref(null);
const rfbInstance = ref(null);

const applyAutoHost = () => {
  const candidateHost = settingsStore?.connection?.ip || window?.location?.hostname || 'localhost';
  const trimmed = host.value.trim();

  // Only auto-fill when the field is still empty or on its default.
  if (!trimmed || trimmed === 'localhost' || trimmed === window?.location?.hostname) {
    host.value = candidateHost;
  }
};

onMounted(() => {
  applyAutoHost();
});

watch(
  () => settingsStore?.connection?.ip,
  () => {
    if (isConnected.value || isConnecting.value) return;
    applyAutoHost();
  }
);

const connectionUrl = computed(() => {
  const trimmedHost = host.value.trim() || 'localhost';
  const trimmedPort = (port.value || '').toString().trim() || '6080';

  // Use a sensible default based on how the UI is hosted
  const scheme = window?.location?.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://${trimmedHost}:${trimmedPort}`;
});

const canConnect = computed(() => Boolean(host.value.trim()) && Boolean(port.value));

const detachRfb = () => {
  if (!rfbInstance.value) return;

  rfbInstance.value.removeEventListener('connect', handleConnect);
  rfbInstance.value.removeEventListener('disconnect', handleDisconnect);
  rfbInstance.value.removeEventListener('credentialsrequired', handleCredentialsRequired);
  rfbInstance.value.removeEventListener('securityfailure', handleSecurityFailure);

  try {
    rfbInstance.value.disconnect();
  } catch (error) {
    console.warn('Failed to close VNC session', error);
  }

  rfbInstance.value = null;
};

function handleConnect() {
  isConnected.value = true;
  statusMessage.value = 'Connected';
}

function handleDisconnect(event) {
  isConnected.value = false;
  const reason = event?.detail?.reason || 'Disconnected';
  statusMessage.value = reason;
}

function handleSecurityFailure(event) {
  isConnected.value = false;
  const reason = event?.detail?.status
    ? `Security error (${event.detail.status})`
    : 'Security error';
  errorMessage.value = reason;
  statusMessage.value = 'Connection failed';
}

function handleCredentialsRequired() {
  isConnected.value = false;
  errorMessage.value = 'Credentials required by server';
  statusMessage.value = 'Awaiting credentials';
}

const connect = async () => {
  if (isConnecting.value || !canConnect.value) return;

  errorMessage.value = '';
  statusMessage.value = 'Connecting...';
  isConnecting.value = true;

  try {
    if (!viewerRef.value) {
      throw new Error('Viewer is not ready yet');
    }

    detachRfb();

    const { default: RFB } = await import('@novnc/novnc/lib/rfb.js');

    const rfb = new RFB(viewerRef.value, connectionUrl.value, {
      shared: true,
    });

    // Let noVNC handle scaling so pointer coordinates match the image.
    // CSS-stretching the canvas breaks click/drag mapping.
    rfb.scaleViewport = true;
    rfb.clipViewport = true;
    rfb.resizeSession = false;

    rfb.addEventListener('connect', handleConnect);
    rfb.addEventListener('disconnect', handleDisconnect);
    rfb.addEventListener('credentialsrequired', handleCredentialsRequired);
    rfb.addEventListener('securityfailure', handleSecurityFailure);

    rfbInstance.value = rfb;
  } catch (error) {
    statusMessage.value = 'Failed to connect';
    errorMessage.value = error?.message || String(error);
    isConnected.value = false;
  } finally {
    isConnecting.value = false;
  }
};

const disconnect = () => {
  detachRfb();
  isConnected.value = false;
  statusMessage.value = 'Disconnected';
};

onBeforeUnmount(detachRfb);
</script>
