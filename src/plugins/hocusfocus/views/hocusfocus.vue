<template>
  <div class="min-h-screen bg-gray-900">
    <div class="container py-10">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-white mb-2">HocusFocus</h1>
          <p class="text-gray-400 text-sm">{{ store.pluginInfo.description }}</p>
        </div>

        <!-- Tabs Navigation -->
        <div class="border border-gray-700 rounded-lg bg-gray-800">
          <div class="flex border-b border-gray-700">
            <button
              @click="activeTab = 'aberration'"
              :class="
                activeTab === 'aberration'
                  ? 'border-b-2 border-cyan-400 text-white'
                  : 'text-gray-400 hover:text-white'
              "
              class="px-6 py-3 font-semibold transition"
            >
              Aberration Inspector
            </button>
            <button
              @click="activeTab = 'aberration-options'"
              :class="
                activeTab === 'aberration-options'
                  ? 'border-b-2 border-cyan-400 text-white'
                  : 'text-gray-400 hover:text-white'
              "
              class="px-6 py-3 font-semibold transition"
            >
              Aberration Inspector Options
            </button>
            <button
              @click="activeTab = 'configuration'"
              :class="
                activeTab === 'configuration'
                  ? 'border-b-2 border-cyan-400 text-white'
                  : 'text-gray-400 hover:text-white'
              "
              class="px-6 py-3 font-semibold transition"
            >
              AutoFocus Options
            </button>

            <button
              @click="activeTab = 'star-detection'"
              :class="
                activeTab === 'star-detection'
                  ? 'border-b-2 border-cyan-400 text-white'
                  : 'text-gray-400 hover:text-white'
              "
              class="px-6 py-3 font-semibold transition"
            >
              Star Detection
            </button>
          </div>

          <!-- AutoFocus Directory Selection Modal -->
          <div
            v-if="showAFDirectoryModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div class="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
              <h3 class="text-xl font-semibold text-white mb-4">
                Select AutoFocus Directory to Rerun
              </h3>

              <div v-if="loadingAFDirectories" class="text-gray-400 text-center py-4">
                <div class="spinner inline-block"></div>
                <p class="mt-2">Loading AutoFocus directories...</p>
              </div>

              <div v-else>
                <select
                  v-model="selectedAFDirectory"
                  class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white mb-4"
                >
                  <option value="" disabled selected>Choose an AutoFocus directory...</option>
                  <option v-for="dir in afDirectories" :key="dir" :value="dir">
                    {{ dir }}
                  </option>
                </select>

                <div class="flex gap-3">
                  <button
                    @click="proceedWithAFRerun()"
                    :disabled="!selectedAFDirectory"
                    class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-semibold transition"
                  >
                    Proceed
                  </button>
                  <button
                    @click="showAFDirectoryModal = false"
                    class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Aberration Inspector Tab -->
          <div v-if="activeTab === 'aberration'" class="p-6">
            <AberrationInspector
              :auto-focus-chart-active="autoFocusChartActive"
              :auto-focus-chart-activated-once="autoFocusChartActivatedOnce"
              :auto-focus-completed="autoFocusCompleted"
              :tilt-measurements="tiltMeasurements"
              :tilt-measurement-history="tiltMeasurementHistory"
              :final-focus-data="finalFocusData"
              :camera-connected="store.cameraConnected"
              :focuser-connected="store.focuserConnected"
              :is-cancelling="store.isCancelling"
              :backend-can-run="backendCanRun"
              :is-tab-active="activeTab === 'aberration'"
              :on-update-status="updateStatus"
              :on-update-final-focus-data="updateFinalFocusData"
              :on-update-tilt-measurements="updateTiltMeasurements"
              :on-update-tilt-measurement-history="updateTiltMeasurementHistory"
              :get-region-focus-points="() => apiService.hocusfocus.getRegionFocusPoints()"
              @run="runDetailedAutoFocus"
              @stop="stopDetailedAutoFocus"
              @rerun="rerunDetailedAutoFocus"
              @clear="clearDetailedAutoFocus"
            />
          </div>

          <!-- Aberration Inspector Options Tab -->
          <div v-if="activeTab === 'aberration-options'" class="p-6">
            <AberrationInspectorOptions />
          </div>

          <!-- Configuration Tab -->
          <div v-if="activeTab === 'configuration'" class="p-6">
            <AutoFocusOptions />
          </div>

          <!-- Star Detection Tab -->
          <div v-if="activeTab === 'star-detection'" class="p-6">
            <StarDetection :isTabActive="activeTab === 'star-detection'" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useHocusFocusStore } from '../store/hocusfocusStore';
import apiService from '@/services/apiService';
import AberrationInspector from '../components/AberrationInspector.vue';
import AberrationInspectorOptions from '../components/AberrationInspectorOptions.vue';
import AutoFocusOptions from '../components/AutoFocusOptions.vue';
import StarDetection from '../components/StarDetection.vue';

const store = useHocusFocusStore();
const activeTab = ref('aberration');
const tiltMeasurements = ref([]);
const tiltMeasurementHistory = ref([]);
const finalFocusData = ref(null);
const autoFocusCompleted = ref(false);
const autoFocusChartActive = ref(false);
const autoFocusChartActivatedOnce = ref(false);

// AutoFocus directory selection modal
const showAFDirectoryModal = ref(false);
const afDirectories = ref([]);
const selectedAFDirectory = ref(null);
const loadingAFDirectories = ref(false);

// Compute canRunAutoFocus from backend status - source of truth
const backendCanRun = ref(true);
const canRunAutoFocus = computed(() => {
  return (
    store.cameraConnected && store.focuserConnected && backendCanRun.value && !store.isCancelling
  );
});

// Polling management
let statusPollingInterval = null;

const startStatusPolling = () => {
  if (statusPollingInterval) return; // Already polling

  console.log('[HocusFocus] Starting status polling...');
  statusPollingInterval = setInterval(async () => {
    try {
      await updateStatus();
    } catch (err) {
      console.error('[HocusFocus] Error in status polling:', err);
    }
  }, 1000);
};

const stopStatusPolling = () => {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval);
    statusPollingInterval = null;
    console.log('[HocusFocus] Status polling stopped');
  }
};

// Fetch and update tilt corner measurements
const updateTiltMeasurements = async () => {
  try {
    console.log('[TiltMeasurements] Fetching data...');
    const data = await apiService.hocusfocus.getTiltCornerMeasurements();
    console.log('[TiltMeasurements] Data received:', data);
    if (data && data.tiltCornerMeasurements) {
      tiltMeasurements.value = data.tiltCornerMeasurements;
    }
  } catch (err) {
    console.error('Error fetching tilt measurements:', err);
  }
};

// Fetch and update tilt measurement history
const updateTiltMeasurementHistory = async () => {
  try {
    console.log('[TiltHistory] Fetching data...');
    const data = await apiService.hocusfocus.getTiltMeasurementHistory();
    console.log('[TiltHistory] Data received:', data);
    if (data && data.tiltMeasurementHistory) {
      tiltMeasurementHistory.value = data.tiltMeasurementHistory;
    }
  } catch (err) {
    console.error('Error fetching tilt measurement history:', err);
  }
};

// Fetch and update final focus data
const updateFinalFocusData = async () => {
  try {
    console.log('[FinalFocus] Fetching data...');
    const data = await apiService.hocusfocus.getFinalFocusData();
    console.log('[FinalFocus] Data received:', data);
    if (data && data.RegionFinalFocusPoints) {
      finalFocusData.value = data;
    }
  } catch (err) {
    console.error('Error fetching final focus data:', err);
  }
};

// Fetch and update status
const updateStatus = async () => {
  try {
    console.log('[Status] Fetching data...');
    const data = await apiService.hocusfocus.getStatus();
    console.log('[Status] Data received:', data);
    if (data && data.Success) {
      const wasNotCompleted = !autoFocusCompleted.value;
      backendCanRun.value = data.CanRunAutoFocusAnalysis ?? false;
      autoFocusCompleted.value = data.AutoFocusCompleted ?? false;
      autoFocusChartActive.value = data.AutoFocusChartActive ?? false;
      autoFocusChartActivatedOnce.value = data.AutoFocusChartActivatedOnce ?? false;

      // If AutoFocus just completed, fetch the updated tilt history
      if (wasNotCompleted && autoFocusCompleted.value) {
        console.log('[Status] AutoFocus completed, updating tilt history...');
        await updateTiltMeasurementHistory();
      }

      // Reset cancelling flag when backend indicates AF is no longer running
      if (backendCanRun.value && store.isCancelling) {
        store.isCancelling = false;
      }
    }
  } catch (err) {
    console.error('Error fetching status:', err);
    backendCanRun.value = false;
    autoFocusCompleted.value = false;
    autoFocusChartActive.value = false;
    autoFocusChartActivatedOnce.value = false;
  }
};

// Update and manage focus curve chart
// Start detailed autofocus run with analysis
const runDetailedAutoFocus = async () => {
  if (!canRunAutoFocus.value) {
    return;
  }

  try {
    console.log('[HocusFocus] Starting detailed AutoFocus analysis');

    // Call the backend endpoint - let polling handle state transitions
    const response = await apiService.hocusfocus.runDetailedAutoFocus();
    console.log('[HocusFocus] RunDetailedAutoFocus response:', response);

    if (response && response.Success) {
      store.error = null;
      // Let polling update button state
    } else {
      store.error = response?.Error || 'Failed to start detailed AutoFocus';
    }
  } catch (err) {
    console.error('[HocusFocus] Error starting analysis:', err);
    store.error = err.message || 'Failed to run DetailedAutoFocus';
  }
};

const stopDetailedAutoFocus = async () => {
  console.log('[HocusFocus] Sending cancel request to backend');
  store.isCancelling = true;

  try {
    const response = await apiService.hocusfocus.cancelDetailedAutoFocus();
    console.log('[HocusFocus] Cancel response:', response);

    if (!response?.Success) {
      store.error = response?.Error || 'Failed to cancel analysis';
    } else {
      store.error = null;
    }
    // Let polling reset the isCancelling flag
  } catch (err) {
    console.error('[HocusFocus] Error cancelling analysis:', err);
    store.error = `Error cancelling: ${err.message}`;
    // Next polling cycle will attempt to reset state
  }
};

const rerunDetailedAutoFocus = async () => {
  if (!canRunAutoFocus.value) {
    return;
  }

  try {
    console.log('[HocusFocus] Loading AutoFocus directories for rerun');
    loadingAFDirectories.value = true;
    afDirectories.value = [];
    selectedAFDirectory.value = null;

    // Load list of available AutoFocus directories
    const result = await apiService.hocusfocus.listAutoFocusDirectories();
    console.log('[HocusFocus] Directory list response:', result);

    if (result && Array.isArray(result.DirectoryNames)) {
      afDirectories.value = result.DirectoryNames;
    } else if (result && Array.isArray(result.directories)) {
      afDirectories.value = result.directories;
    }

    if (afDirectories.value.length === 0) {
      store.error = 'No AutoFocus directories available to rerun';
      console.warn('[HocusFocus] No AutoFocus directories found');
      return;
    }

    // Show the modal for directory selection
    showAFDirectoryModal.value = true;
  } catch (err) {
    console.error('[HocusFocus] Error loading AutoFocus directories:', err);
    store.error = err.message || 'Failed to load AutoFocus directories';
  } finally {
    loadingAFDirectories.value = false;
  }
};

const proceedWithAFRerun = async () => {
  if (!selectedAFDirectory.value) {
    console.warn('[HocusFocus] No AutoFocus directory selected');
    return;
  }

  try {
    console.log(
      '[HocusFocus] Re-running AutoFocus analysis with directory:',
      selectedAFDirectory.value
    );

    // Call the backend endpoint with the selected directory
    const response = await apiService.hocusfocus.rerunDetailedAutoFocus(selectedAFDirectory.value);
    console.log('[HocusFocus] ReRunDetailedAutoFocus response:', response);

    if (response && response.Success) {
      store.error = null;
      showAFDirectoryModal.value = false;
      // Immediately fetch updated data
      await updateStatus();
      await updateFinalFocusData();
      await updateTiltMeasurements();
    } else {
      store.error = response?.Error || 'Failed to re-run detailed AutoFocus';
    }
  } catch (err) {
    console.error('[HocusFocus] Error re-run analysis:', err);
    store.error = err.message || 'Failed to re-run DetailedAutoFocus';
  }
};

const clearDetailedAutoFocus = async () => {
  if (!canRunAutoFocus.value) {
    return;
  }

  try {
    console.log('[HocusFocus] Clearing AutoFocus analysis');

    // Call the backend endpoint (which now also clears tilt history)
    const response = await apiService.hocusfocus.clearDetailedAutoFocus();
    console.log('[HocusFocus] ClearDetailedAutoFocus response:', response);

    if (response && response.Success) {
      store.error = null;
      // Fetch updated data to reflect cleared state
      console.log('[HocusFocus] Fetching updated data after clear...');
      await updateStatus();
      await updateFinalFocusData();
      await updateTiltMeasurements();
      await updateTiltMeasurementHistory();
      console.log(
        '[HocusFocus] Tilt measurement history after clear:',
        tiltMeasurementHistory.value
      );
    } else {
      store.error = response?.Error || 'Failed to clear detailed AutoFocus';
    }
  } catch (err) {
    console.error('[HocusFocus] Error clearing analysis:', err);
    store.error = err.message || 'Failed to clear DetailedAutoFocus';
  }
};

// Generate sample focus data on mount
onMounted(() => {
  store.fetchEquipmentStatus();
  // Start polling for status updates
  startStatusPolling();
});

// Cleanup on component unmount
onBeforeUnmount(() => {
  stopStatusPolling();
});
</script>
