<template>
  <div class="container py-16">
    <div class="container max-w-6xl space-y-6">
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

            <div class="grid grid-cols-2 gap-3">
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

              <label class="text-sm text-gray-300">
                Path (optional)
                <input
                  v-model.trim="connectionPath"
                  type="text"
                  class="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none"
                  placeholder="websockify"
                  autocomplete="off"
                />
              </label>
            </div>

            <label class="text-sm text-gray-300">
              Password (optional)
              <input
                v-model="password"
                type="password"
                class="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none"
                autocomplete="new-password"
              />
            </label>

            <div class="grid grid-cols-2 gap-3 text-sm text-gray-200">
              <label class="inline-flex items-center space-x-2">
                <input v-model="useTls" type="checkbox" class="h-4 w-4 text-indigo-500" />
                <span>Use TLS (wss)</span>
              </label>
              <label class="inline-flex items-center space-x-2">
                <input v-model="viewOnly" type="checkbox" class="h-4 w-4 text-indigo-500" />
                <span>View only</span>
              </label>
              <label class="inline-flex items-center space-x-2">
                <input v-model="resizeSession" type="checkbox" class="h-4 w-4 text-indigo-500" />
                <span>Resize remote</span>
              </label>
              <label class="inline-flex items-center space-x-2">
                <input v-model="scaleViewport" type="checkbox" class="h-4 w-4 text-indigo-500" />
                <span>Scale viewport</span>
              </label>
            </div>

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
            class="relative min-h-[420px] w-full overflow-hidden rounded border border-gray-800 bg-black/60"
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
import { computed, onBeforeUnmount, ref, watch } from 'vue';

const host = ref('localhost');
const port = ref('6080');
const connectionPath = ref('');
const password = ref('');
const useTls = ref(false);
const viewOnly = ref(false);
const resizeSession = ref(true);
const scaleViewport = ref(true);

const isConnecting = ref(false);
const isConnected = ref(false);
const statusMessage = ref('Not connected');
const errorMessage = ref('');

const viewerRef = ref(null);
const rfbInstance = ref(null);

const connectionUrl = computed(() => {
  const trimmedHost = host.value.trim() || 'localhost';
  const trimmedPort = (port.value || '').toString().trim() || '6080';
  const cleanedPath = connectionPath.value.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  const scheme = useTls.value ? 'wss' : 'ws';
  const pathSegment = cleanedPath ? `/${cleanedPath}` : '';

  return `${scheme}://${trimmedHost}:${trimmedPort}${pathSegment}`;
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
  errorMessage.value = 'Password required';
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

    const { default: RFB } = await import('@novnc/novnc/core/rfb.js');

    const rfb = new RFB(viewerRef.value, connectionUrl.value, {
      credentials: password.value ? { password: password.value } : undefined,
      shared: true,
      viewOnly: viewOnly.value,
    });

    rfb.scaleViewport = scaleViewport.value;
    rfb.resizeSession = resizeSession.value;

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

watch(viewOnly, (value) => {
  if (rfbInstance.value) {
    rfbInstance.value.viewOnly = value;
  }
});

watch(resizeSession, (value) => {
  if (rfbInstance.value) {
    rfbInstance.value.resizeSession = value;
  }
});

watch(scaleViewport, (value) => {
  if (rfbInstance.value) {
    rfbInstance.value.scaleViewport = value;
  }
});

onBeforeUnmount(detachRfb);
</script>
