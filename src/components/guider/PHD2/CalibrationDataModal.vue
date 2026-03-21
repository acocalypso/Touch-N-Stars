<template>
  <Modal :show="show" @close="$emit('close')" maxWidth="max-w-2xl">
    <template #header>
      <div class="flex items-center gap-3">
        <h2 class="text-base font-semibold">Review Calibration</h2>
        <div class="flex border-b border-gray-600 text-xs">
          <span class="px-3 py-1 border-b-2 border-blue-400 text-blue-300">Mount</span>
        </div>
      </div>
    </template>
    <template #body>
      <div v-if="isLoading" class="flex justify-center py-10">
        <div
          class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        ></div>
      </div>

      <div v-else-if="data">
        <div v-if="!data.Calibrated" class="text-yellow-400 text-sm text-center py-8">
          Not calibrated
        </div>

        <div v-else class="flex gap-4 items-start">
          <!-- Left: Graph -->
          <div class="flex-shrink-0 flex flex-col items-center gap-1">
            <svg width="200" height="200" class="bg-black rounded">
              <!-- Dashed crosshair -->
              <line
                x1="100"
                y1="0"
                x2="100"
                y2="200"
                stroke="#333"
                stroke-width="1"
                stroke-dasharray="4,4"
              />
              <line
                x1="0"
                y1="100"
                x2="200"
                y2="100"
                stroke="#333"
                stroke-width="1"
                stroke-dasharray="4,4"
              />

              <!-- RA: full line through center (blue) -->
              <line
                :x1="ra.x1"
                :y1="ra.y1"
                :x2="ra.x2"
                :y2="ra.y2"
                stroke="#4488ee"
                stroke-width="1.5"
              />
              <!-- RA tip circle -->
              <circle
                :cx="ra.x2"
                :cy="ra.y2"
                r="4"
                fill="none"
                stroke="#4488ee"
                stroke-width="1.5"
              />

              <!-- Dec: full line through center (red) -->
              <line
                :x1="dec.x1"
                :y1="dec.y1"
                :x2="dec.x2"
                :y2="dec.y2"
                stroke="#ee4444"
                stroke-width="1.5"
              />
              <!-- Dec tip circle -->
              <circle
                :cx="dec.x2"
                :cy="dec.y2"
                r="4"
                fill="none"
                stroke="#ee4444"
                stroke-width="1.5"
              />

              <!-- Center dot -->
              <circle cx="100" cy="100" r="3" fill="#888" />
            </svg>
            <div class="flex gap-4 text-xs mt-1">
              <span class="text-blue-400 flex items-center gap-1">
                <span class="inline-block w-4 h-0.5 bg-blue-400"></span> Right Ascension
              </span>
              <span class="text-red-400 flex items-center gap-1">
                <span class="inline-block w-4 h-0.5 bg-red-400"></span> Declination
              </span>
            </div>
          </div>

          <!-- Right: Data panels -->
          <div class="flex-1 flex flex-col gap-3 text-xs min-w-0">
            <!-- Last Mount Calibration box -->
            <div class="border border-gray-500 rounded p-2">
              <div class="text-gray-300 font-semibold mb-2 text-xs uppercase tracking-wide">
                Last Mount Calibration
              </div>
              <table class="w-full border-collapse">
                <tbody>
                  <tr>
                    <td class="text-gray-400 pr-2 py-0.5 whitespace-nowrap">Camera angle:</td>
                    <td class="text-white pr-4">{{ data.XAngle?.toFixed(1) }}</td>
                    <td class="text-gray-400 pr-2 py-0.5 whitespace-nowrap">
                      Orthogonality error:
                    </td>
                    <td class="text-white">{{ orthogError }}</td>
                  </tr>
                  <tr>
                    <td class="text-gray-400 pr-2 py-0.5 whitespace-nowrap">RA rate:</td>
                    <td class="text-white pr-4">{{ data.XRate?.toFixed(3) }} px/sec</td>
                    <td class="text-gray-400 pr-2 py-0.5 whitespace-nowrap">Dec rate:</td>
                    <td class="text-white">{{ data.YRate?.toFixed(3) }} px/sec</td>
                  </tr>
                  <tr>
                    <td class="text-gray-400 pr-2 py-0.5 whitespace-nowrap">RA parity:</td>
                    <td class="text-white pr-4">
                      {{ data.XParity && data.XParity !== '?' ? data.XParity : '-' }}
                    </td>
                    <td class="text-gray-400 pr-2 py-0.5 whitespace-nowrap">Dec parity:</td>
                    <td class="text-white">
                      {{ data.YParity && data.YParity !== '?' ? data.YParity : '-' }}
                    </td>
                  </tr>
                  <tr>
                    <td class="text-gray-400 pr-2 py-0.5 whitespace-nowrap">Declination:</td>
                    <td class="text-white pr-4" colspan="3">{{ decDisplay }} (est)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Clear button -->
            <button
              @click="clearCalibration"
              :disabled="isClearing"
              class="default-button-red px-4 py-2 text-sm disabled:opacity-40 self-start"
            >
              <span v-if="isClearing">Clearing...</span>
              <span v-else>Clear Calibration</span>
            </button>
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Modal from '@/components/helpers/Modal.vue';
import apiService from '@/services/apiService';

const props = defineProps({ show: Boolean });
defineEmits(['close']);

const isLoading = ref(false);
const isClearing = ref(false);
const data = ref(null);

watch(
  () => props.show,
  async (visible) => {
    if (visible) {
      isLoading.value = true;
      data.value = null;
      try {
        const resp = await apiService.getPhd2CalibrationData();
        data.value = resp.Success ? resp.Response : { Calibrated: false };
      } finally {
        isLoading.value = false;
      }
    }
  }
);

async function clearCalibration() {
  isClearing.value = true;
  try {
    await apiService.clearPhd2Calibration();
    data.value = { Calibrated: false };
  } finally {
    isClearing.value = false;
  }
}

const orthogError = computed(() => {
  if (!data.value?.Calibrated) return 'N/A';
  const diff = data.value.XAngle - data.value.YAngle;
  const norm = ((diff % 180) + 180) % 180;
  return Math.abs(90 - norm).toFixed(1);
});

// UNKNOWN_DECLINATION in PHD2 is 997 radians → degrees(997) ≈ 57124
const decDisplay = computed(() => {
  if (!data.value?.Calibrated) return 'N/A';
  const d = data.value.Declination;
  if (d == null || Math.abs(d) > 200) return 'N/A';
  return d.toFixed(1) + '°';
});

const C = 100; // center
const R = 80; // radius

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function makeAxis(angleDeg) {
  const a = toRad(angleDeg);
  const dx = Math.cos(a);
  const dy = -Math.sin(a); // SVG y is inverted
  return {
    x1: C,
    y1: C, // center
    x2: C + dx * R,
    y2: C + dy * R, // tip
  };
}

const ra = computed(() => {
  if (!data.value?.Calibrated) return { x1: C, y1: C, x2: C, y2: C };
  return makeAxis(data.value.XAngle);
});

const dec = computed(() => {
  if (!data.value?.Calibrated) return { x1: C, y1: C, x2: C, y2: C };
  return makeAxis(data.value.YAngle);
});
</script>
