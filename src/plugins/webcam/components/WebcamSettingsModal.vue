<template>
  <!-- Teleported out of the webcam page: that shell is `fixed` + `overflow-hidden`, and
       iOS scrolls such an ancestor around when the on-screen keyboard opens, which used to
       drag the URL field out of view. -->
  <teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>

      <!-- Modal -->
      <div
        class="relative flex flex-col max-h-[90dvh] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-lg w-full max-w-md border border-gray-700"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
          <h3 class="text-lg font-semibold text-white">{{ t('plugins.webcam.title') }}</h3>
          <button @click="closeModal" class="text-gray-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <!-- Body: scrolls on its own so the fields below the URL stay reachable in
             landscape and with the keyboard open. -->
        <div class="p-4 space-y-4 overflow-y-auto overscroll-contain">
          <!-- Snapshot URL -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">{{
              t('plugins.webcam.snapshotUrl')
            }}</label>
            <input
              :value="webcamStore.snapshotUrl"
              type="url"
              inputmode="url"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              placeholder="http://example.com/webcam/snapshot.jpg"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @input="webcamStore.updateSnapshotUrl($event.target.value)"
            />
            <p class="text-xs text-gray-400 mt-1">
              {{ t('plugins.webcam.snapshotUrlDescription') }}
            </p>
            <details class="mt-1">
              <summary class="text-xs text-gray-400 cursor-pointer">
                {{ t('plugins.webcam.snapshotUrlExamples') }}
              </summary>
              <p class="text-xs text-gray-400 mt-1">
                • IP-Kamera:
                <code class="bg-gray-600 px-1 rounded">http://192.168.1.100/snapshot.jpg</code
                ><br />
                • ONVIF-Kamera:
                <code class="bg-gray-600 px-1 rounded"
                  >http://192.168.1.100/onvif-http/snapshot?Profile_1</code
                ><br />
                • Axis-Kamera:
                <code class="bg-gray-600 px-1 rounded"
                  >http://192.168.1.100/axis-cgi/jpg/image.cgi</code
                >
              </p>
            </details>
          </div>

          <!-- Refresh Interval -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              {{ t('plugins.webcam.refreshInterval') }} ({{ webcamStore.refreshIntervalSeconds }}s)
            </label>
            <input
              :value="webcamStore.refreshInterval"
              type="range"
              min="500"
              max="10000"
              step="500"
              class="w-full"
              @input="webcamStore.updateRefreshInterval(parseInt($event.target.value))"
            />
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.5s</span>
              <span>10s</span>
            </div>
          </div>

          <!-- Display Options -->
          <div class="space-y-3">
            <h4 class="text-sm font-medium text-gray-300">
              {{ t('plugins.webcam.displayOptions') }}
            </h4>

            <label class="flex items-center">
              <input
                :checked="webcamStore.autoRefresh"
                type="checkbox"
                class="mr-2 rounded"
                @change="webcamStore.updateDisplaySettings({ autoRefresh: $event.target.checked })"
              />
              <span class="text-gray-300">{{ t('plugins.webcam.autoRefresh') }}</span>
            </label>
          </div>

          <!-- Connection Status -->
          <div class="p-3 rounded-md" :class="statusClass">
            <p class="text-sm font-medium">
              {{ t('plugins.webcam.status') }}:
              {{
                webcamStore.isConnected
                  ? t('plugins.webcam.connected')
                  : t('plugins.webcam.disconnected')
              }}
            </p>
            <p v-if="webcamStore.errorMessage" class="text-sm mt-1">
              {{ t('plugins.webcam.error') }}: {{ errorText }}
            </p>
            <p v-if="webcamStore.lastUpdate" class="text-sm mt-1">
              {{ t('plugins.webcam.lastUpdate') }}: {{ formatTime(webcamStore.lastUpdate) }}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 p-4 border-t border-gray-700 shrink-0">
          <button v-if="!confirmReset" @click="confirmReset = true" class="tns-btn-danger">
            {{ t('plugins.webcam.reset') }}
          </button>
          <template v-else>
            <span class="mr-auto self-center text-sm text-gray-300">
              {{ t('plugins.webcam.resetConfirm') }}
            </span>
            <button @click="resetSettings" class="tns-btn-danger">
              {{ t('plugins.webcam.reset') }}
            </button>
            <button @click="confirmReset = false" class="tns-btn-secondary">
              {{ t('plugins.webcam.cancel') }}
            </button>
          </template>
          <button v-if="!confirmReset" @click="closeModal" class="tns-btn-secondary">
            {{ t('plugins.webcam.close') }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWebcamStore } from '../store/webcamStore.js';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['close']);

const { t, te } = useI18n();
const webcamStore = useWebcamStore();
const confirmReset = ref(false);

watch(
  () => props.isOpen,
  (open) => {
    if (!open) confirmReset.value = false;
  }
);

const statusClass = computed(() => {
  if (webcamStore.isConnected) {
    return 'bg-green-900 border border-green-700';
  } else if (webcamStore.errorMessage) {
    return 'bg-red-900 border border-red-700';
  } else {
    return 'bg-gray-700 border border-gray-600';
  }
});

// The store keeps i18n keys relative to plugins.webcam; anything else is shown verbatim.
const errorText = computed(() => {
  const message = webcamStore.errorMessage;
  if (!message) return '';
  const key = `plugins.webcam.${message}`;
  return te(key) ? t(key) : message;
});

const formatTime = (timeString) => {
  if (!timeString) return '';
  return new Date(timeString).toLocaleTimeString();
};

const closeModal = () => {
  emit('close');
};

const resetSettings = () => {
  confirmReset.value = false;
  webcamStore.resetSettings();
};
</script>
