<template>
  <button
    @click="openSolveModal"
    class="w-10 h-10 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg shadow-lg flex items-center justify-center transition-colors"
    title="Plate Solve"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      class="w-5 h-5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  </button>

  <Teleport to="body">
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center text-gray-200 p-2 bg-black bg-opacity-30"
      @click="closeModal"
    >
      <div
        class="p-6 bg-gradient-to-br from-gray-950 bg-gray-800 rounded-lg shadow-lg w-full max-w-md relative"
        @click.stop
      >
        <!-- Header -->
        <div class="mb-4 border-b border-gray-700 pb-2 flex justify-between items-center">
          <h2 class="text-xl font-bold text-white">Plate Solve</h2>
          <button
            @click="closeModal"
            class="w-8 h-8 text-gray-400 hover:text-gray-200 transition-colors flex items-center justify-center"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="max-h-[60vh] overflow-y-auto scrollbar-thin">
          <div v-if="isSolving" class="loading-spinner">
            <div class="spinner"></div>
            <p class="text-gray-300">Solving...</p>
          </div>

          <div v-else-if="solveResult" class="solve-result space-y-4">
            <!-- Success Status -->
            <div class="flex items-center gap-2 mb-2">
              <div
                :class="[
                  'w-4 h-4 rounded-full',
                  solveResult.Response?.Success ? 'bg-green-500' : 'bg-red-500',
                ]"
              ></div>
              <span :class="solveResult.Response?.Success ? 'text-green-400' : 'text-red-400'">
                {{ solveResult.Response?.Success ? 'Solve Successful' : 'Solve Failed' }}
              </span>
            </div>

            <div class="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div class="space-y-3">
                <div
                  v-if="solveResult.Response?.SolveTime"
                  class="flex justify-between items-center"
                >
                  <span class="text-gray-400">Solve Time:</span>
                  <span class="text-cyan-400 font-semibold text-sm">{{
                    formatDateTime(solveResult.Response.SolveTime)
                  }}</span>
                </div>
                <div
                  v-if="solveResult.Response?.Orientation !== undefined"
                  class="flex justify-between items-center"
                >
                  <span class="text-gray-400">Orientation:</span>
                  <span class="text-cyan-400 font-semibold"
                    >{{ formatValue(solveResult.Response.Orientation) }}°</span
                  >
                </div>
                <div
                  v-if="solveResult.Response?.PositionAngle !== undefined"
                  class="flex justify-between items-center"
                >
                  <span class="text-gray-400">Position Angle:</span>
                  <span class="text-cyan-400 font-semibold"
                    >{{ formatValue(solveResult.Response.PositionAngle) }}°</span
                  >
                </div>
                <div
                  v-if="solveResult.Response?.Pixscale !== undefined"
                  class="flex justify-between items-center"
                >
                  <span class="text-gray-400">Pixel Scale:</span>
                  <span class="text-cyan-400 font-semibold"
                    >{{ formatValue(solveResult.Response.Pixscale) }}"</span
                  >
                </div>
                <div
                  v-if="solveResult.Response?.Radius !== undefined"
                  class="flex justify-between items-center"
                >
                  <span class="text-gray-400">Radius:</span>
                  <span class="text-cyan-400 font-semibold">{{
                    formatValue(solveResult.Response.Radius)
                  }}</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-gray-600">
                  <span class="text-gray-400">Flipped:</span>
                  <span class="text-cyan-400 font-semibold">{{
                    solveResult.Response?.Flipped ? 'Yes' : 'No'
                  }}</span>
                </div>
              </div>
            </div>
            <ButtomSyncCoordinatesToMount
              v-if="solveResult.Response?.Success"
              :ra="solveResult.Response.RA"
              :dec="solveResult.Response.Dec"
              class="w-full"
            />
          </div>

          <div v-else-if="solveError" class="solve-error space-y-4">
            <div class="bg-red-900/20 rounded-lg p-4 border border-red-700/50">
              <p class="text-red-400">{{ solveError }}</p>
            </div>
            <button class="default-button-cyan w-full px-4 py-2" @click="closeModal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';
import apiService from '@/services/apiService';
import ButtomSyncCoordinatesToMount from '../mount/ButtomSyncCoordinatesToMount.vue';

const isSolving = ref(false);
const showModal = ref(false);
const solveResult = ref(null);
const solveError = ref(null);

function openSolveModal() {
  showModal.value = true;
  solvePreparedImage();
}

function closeModal() {
  showModal.value = false;
  solveResult.value = null;
  solveError.value = null;
}

async function solvePreparedImage() {
  try {
    isSolving.value = true;
    solveError.value = null;
    const response = await apiService.solvePreparedImage();
    solveResult.value = response;
  } catch (error) {
    console.error('Error solving prepared image:', error);
    solveError.value = error.message || 'Failed to solve image';
  } finally {
    isSolving.value = false;
  }
}

function formatValue(value) {
  if (typeof value === 'number') {
    return value.toFixed(4);
  }
  return value;
}

function formatDateTime(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateString;
  }
}
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.spinner {
  border: 4px solid #1f2937;
  border-top: 4px solid #22d3ee;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.solve-result {
  padding: 0;
}

.solve-error {
  padding: 0;
}

/* Smooth scroll behavior */
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #4a5568;
  border-radius: 20px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: #5a6578;
}
</style>
