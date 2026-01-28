<template>
  <div
    class="flex h-[85vh] w-full flex-col overflow-hidden bg-gray-900 border border-gray-700 rounded-lg relative shadow-xl"
  >
    <!-- Viewer Container (Always rendered, overlays others when connected) -->
    <div ref="viewerRef" class="relative h-full w-full bg-black cursor-crosshair">
      <!-- NoVNC Style Toolbar -->
      <transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="-translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="translate-x-0"
        leave-to-class="-translate-x-full"
      >
        <div
          v-if="isConnected && isToolbarOpen"
          class="absolute left-0 top-0 z-30 flex h-full w-14 flex-col items-center gap-4 border-r border-gray-700 bg-gray-900/95 py-4 backdrop-blur-sm shadow-2xl"
        >
          <!-- Close Toolbar -->
          <button
            class="rounded p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
            title="Close Menu"
            @click="isToolbarOpen = false"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div class="h-px w-8 bg-gray-700"></div>

          <!-- Fullscreen -->
          <button
            class="rounded p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
            :class="{ 'text-indigo-400': isFullscreen }"
            :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
            @click="toggleFullscreen"
          >
            <svg
              v-if="!isFullscreen"
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <!-- Ctrl-Alt-Del -->
          <button
            class="rounded p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
            title="Send Ctrl+Alt+Del"
            @click="sendCtrlAltDel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </button>

          <div class="mt-auto flex flex-col gap-4">
            <div class="h-px w-8 bg-gray-700"></div>
            <!-- Disconnect -->
            <button
              class="rounded p-2 text-red-400 hover:bg-gray-800 hover:text-red-300"
              title="Disconnect"
              @click="disconnect"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </transition>

      <!-- Toolbar Toggle Handle -->
      <button
        v-if="isConnected && !isToolbarOpen"
        class="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-r-lg bg-gray-800/80 p-2 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-indigo-600/90 hover:pr-3"
        title="Open Menu"
        @click="isToolbarOpen = true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Connection Overlay -->
    <div
      v-if="!isConnected"
      class="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm p-2 overflow-hidden"
    >
      <div
        class="w-full max-w-sm rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-2xl transition-all"
      >
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-bold text-white uppercase tracking-wider">VNC Connect</h2>
          <div v-if="statusMessage" class="text-xs text-gray-400">{{ statusMessage }}</div>
        </div>

        <div class="flex gap-2 mb-3">
          <div class="flex-grow relative">
            <input
              v-model.trim="host"
              type="text"
              class="w-full rounded bg-gray-900/50 px-3 py-2 text-sm text-white placeholder-gray-600 border border-gray-600 focus:border-indigo-500 focus:outline-none"
              placeholder="Host / IP"
              :disabled="isConnecting"
            />
          </div>

          <div class="w-20 flex-shrink-0">
            <input
              v-model.trim="port"
              type="number"
              class="w-full rounded bg-gray-900/50 px-3 py-2 text-sm text-white placeholder-gray-600 border border-gray-600 focus:border-indigo-500 focus:outline-none"
              placeholder="Port"
              :disabled="isConnecting"
            />
          </div>
        </div>

        <div
          v-if="errorMessage"
          class="mb-3 rounded bg-red-900/20 p-2 text-xs text-red-200 border border-red-900/30 truncate"
        >
          {{ errorMessage }}
        </div>

        <button
          class="w-full rounded bg-indigo-600 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
          :disabled="isConnecting || !canConnect"
          @click="connect"
        >
          {{ isConnecting ? 'Connecting...' : 'Connect' }}
        </button>
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
const isFullscreen = ref(false);
const isToolbarOpen = ref(false);

const updateFullscreenState = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

const sendCtrlAltDel = () => {
  if (rfbInstance.value) {
    rfbInstance.value.sendCtrlAltDel();
  }
};

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
  document.addEventListener('fullscreenchange', updateFullscreenState);
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

const toggleFullscreen = () => {
  if (!viewerRef.value) return;

  if (!document.fullscreenElement) {
    viewerRef.value.requestFullscreen().catch((err) => {
      console.warn(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
};

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

onBeforeUnmount(() => {
  detachRfb();
  document.removeEventListener('fullscreenchange', updateFullscreenState);
});
</script>
