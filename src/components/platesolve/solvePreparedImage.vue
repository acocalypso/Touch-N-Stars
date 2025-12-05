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
      <path d="M12 2L12 7M12 17L12 22M2 12L7 12M17 12L22 12" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="8" opacity="0.5" />
    </svg>
  </button>

  <Modal :show="showModal" @close="closeModal" :closeOnBackdropClick="false" max-width="max-w-md" z-index="z-50">
    <template #header>
      <h2 class="text-xl font-bold text-white">Plate Solve</h2>
    </template>

    <template #body>
      <div v-if="isSolving" class="loading-spinner">
        <div class="spinner"></div>
        <p class="text-gray-300">{{ $t('components.platesolve.solving') }}</p>
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
            {{
              solveResult.Response?.Success
                ? $t('components.platesolve.solve_successful')
                : $t('components.platesolve.solve_failed')
            }}
          </span>
        </div>

        <div class="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div class="space-y-3">
            <div v-if="solveResult.Response?.SolveTime" class="flex justify-between items-center">
              <span class="text-gray-400">{{ $t('components.platesolve.solve_time') }}</span>
              <span class="text-cyan-400 font-semibold text-sm">{{
                formatDateTime(solveResult.Response.SolveTime)
              }}</span>
            </div>
            <div
              v-if="solveResult.Response?.Orientation !== undefined"
              class="flex justify-between items-center"
            >
              <span class="text-gray-400">{{ $t('components.platesolve.orientation') }}</span>
              <span class="text-cyan-400 font-semibold"
                >{{ formatValue(solveResult.Response.Orientation) }}°</span
              >
            </div>
            <div
              v-if="solveResult.Response?.PositionAngle !== undefined"
              class="flex justify-between items-center"
            >
              <span class="text-gray-400">{{ $t('components.platesolve.ra') }}</span>
              <span class="text-cyan-400 font-semibold"
                >{{ formatValue(solveResult.Response.Coordinates.RAString) }}°</span
              >
            </div>
            <div
              v-if="solveResult.Response?.Pixscale !== undefined"
              class="flex justify-between items-center"
            >
              <span class="text-gray-400">{{ $t('components.platesolve.dec') }}</span>
              <span class="text-cyan-400 font-semibold"
                >{{ formatValue(solveResult.Response.Coordinates.DecString) }}"</span
              >
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-gray-600">
              <span class="text-gray-400">{{ $t('components.platesolve.flipped') }}</span>
              <span class="text-cyan-400 font-semibold">{{
                solveResult.Response?.Flipped ? $t('general.yes') : $t('general.no')
              }}</span>
            </div>
          </div>
        </div>
        <ButtomSyncCoordinatesToMount
          v-if="solveResult.Response?.Success"
          :raAngle="solveResult.Response.Coordinates.RADegrees"
          :decAngle="solveResult.Response.Coordinates.Dec"
        />
      </div>

      <div v-else-if="solveError" class="solve-error space-y-4">
        <div class="bg-red-900/20 rounded-lg p-4 border border-red-700/50">
          <p class="text-red-400">{{ solveError }}</p>
        </div>
        <button class="default-button-cyan w-full px-4 py-2" @click="closeModal">Close</button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref } from 'vue';
import apiService from '@/services/apiService';
import { useCameraStore } from '@/store/cameraStore';
import Modal from '@/components/helpers/Modal.vue';
import ButtomSyncCoordinatesToMount from '../mount/ButtomSyncCoordinatesToMount.vue';

const cameraStore = useCameraStore();
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
    cameraStore.plateSolveResult = response.Response;
  } catch (error) {
    console.error('[solvePreparedImage] Error solving prepared image:', error);
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
</style>
