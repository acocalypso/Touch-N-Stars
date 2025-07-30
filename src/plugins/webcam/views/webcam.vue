<template>
  <div class="container py-16 flex items-center justify-center">
    <div class="container max-w-4xl">
      <h5 class="text-2xl text-center font-bold text-white mb-4">webcam</h5>

      <div class="flex flex-col space-y-4">
        <div
          class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
        >
          <p class="text-white text-center">Welcome to the webcam plugin!</p>
          <p class="text-gray-400 text-center mt-2">Used to display an image from a webcam</p>
        </div>
        
        <!-- Webcam Snapshot Display -->
        <div class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5">
          <h6 class="text-lg font-semibold text-white mb-4">Live View</h6>
          <WebcamSnapshot />
        </div>
        
        <!-- Settings Section -->
        <div class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5">
          <div class="space-y-4">
            <h6 class="text-lg font-semibold text-white mb-3">Settings</h6>
            
            <!-- Snapshot URL -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Snapshot URL</label>
              <input
                v-model="webcamStore.snapshotUrl"
                type="url"
                placeholder="http://example.com/webcam/snapshot.jpg"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                @input="webcamStore.updateSnapshotUrl($event.target.value)"
              />
            </div>
            
            <!-- Refresh Interval -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Refresh Interval ({{ webcamStore.refreshIntervalSeconds }}s)
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
            </div>
            
            <!-- Display Options -->
            <div class="flex flex-wrap gap-4">
              <label class="flex items-center">
                <input
                  v-model="webcamStore.showControls"
                  type="checkbox"
                  class="mr-2"
                  @change="webcamStore.updateDisplaySettings({ showControls: $event.target.checked })"
                />
                <span class="text-gray-300">Show Controls</span>
              </label>
              
              <label class="flex items-center">
                <input
                  v-model="webcamStore.autoRefresh"
                  type="checkbox"
                  class="mr-2"
                  @change="webcamStore.updateDisplaySettings({ autoRefresh: $event.target.checked })"
                />
                <span class="text-gray-300">Auto Refresh</span>
              </label>
            </div>
            
            <!-- Connection Status -->
            <div class="mt-4 p-3 rounded-md" :class="statusClass">
              <p class="text-sm font-medium">
                Status: {{ webcamStore.isConnected ? 'Connected' : 'Disconnected' }}
              </p>
              <p v-if="webcamStore.errorMessage" class="text-sm mt-1">
                Error: {{ webcamStore.errorMessage }}
              </p>
              <p v-if="webcamStore.lastUpdate" class="text-sm mt-1">
                Last Update: {{ formatTime(webcamStore.lastUpdate) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useWebcamStore } from '../store/webcamStore.js';
import WebcamSnapshot from '../components/WebcamSnapshot.vue';

const webcamStore = useWebcamStore();

const statusClass = computed(() => {
  if (webcamStore.isConnected) {
    return 'bg-green-900 border border-green-700';
  } else if (webcamStore.errorMessage) {
    return 'bg-red-900 border border-red-700';
  } else {
    return 'bg-gray-700 border border-gray-600';
  }
});

const formatTime = (timeString) => {
  if (!timeString) return '';
  return new Date(timeString).toLocaleTimeString();
};

onMounted(() => {
  webcamStore.loadFromLocalStorage();
  // Don't auto-start here, let the WebcamSnapshot component handle it
});
</script>
