<template>
  <Modal :show="show" @close="$emit('close')">
    <template #header>
      <h2 class="text-2xl font-semibold">
        {{ $t('components.guider.calibrationAssistant.title') }}
      </h2>
    </template>
    <template #body>
      <div class="flex flex-col gap-6 min-w-[500px]">
        <!-- Info Section -->
        <div class="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <p class="text-blue-300 text-sm">
            {{ $t('components.guider.calibrationAssistant.info') }}
          </p>
        </div>

        <!-- Position Settings -->
        <div class="bg-gray-700/50 p-3 rounded-lg">
          <h3 class="text-sm font-medium text-gray-300 mb-3">
            {{ $t('components.guider.calibrationAssistant.positionSettings') }}
          </h3>
          <div class="space-y-3">
            <!-- Dec Offset -->
            <div>
              <label class="block text-xs text-gray-400 mb-1">
                {{ $t('components.guider.calibrationAssistant.decOffset') }} (°)
              </label>
              <input
                v-model.number="decOffset"
                type="number"
                min="-90"
                max="90"
                class="w-full px-2 py-1 bg-gray-600 text-white text-sm rounded border border-gray-500 focus:border-blue-400"
                @input="calculateOptimalPosition"
              />
            </div>
            
            <!-- Meridian Offset -->
            <div>
              <label class="block text-xs text-gray-400 mb-1">
                {{ $t('components.guider.calibrationAssistant.meridianOffset') }} (°)
              </label>
              <input
                v-model.number="meridianOffset"
                type="number"
                min="0"
                max="90"
                class="w-full px-2 py-1 bg-gray-600 text-white text-sm rounded border border-gray-500 focus:border-blue-400"
                @input="calculateOptimalPosition"
              />
            </div>
            
            <!-- East/West Selection -->
            <div>
              <label class="block text-xs text-gray-400 mb-1">
                {{ $t('components.guider.calibrationAssistant.direction') }}
              </label>
              <div class="flex gap-2">
                <button
                  @click="setDirection('west')"
                  :class="direction === 'west' ? 'default-button-cyan' : 'default-button-gray'"
                  class="flex-1 px-2 py-1 text-xs"
                >
                  {{ $t('components.guider.calibrationAssistant.west') }}
                </button>
                <button
                  @click="setDirection('east')"
                  :class="direction === 'east' ? 'default-button-cyan' : 'default-button-gray'"
                  class="flex-1 px-2 py-1 text-xs"
                >
                  {{ $t('components.guider.calibrationAssistant.east') }}
                </button>
              </div>
            </div>
            
          </div>
        </div>

        <!-- Status -->
        <div v-if="displayStatus" class="p-3 rounded-lg" :class="statusClass">
          <div class="flex items-center gap-2">
            <div v-if="isSlewing" class="spinner"></div>
            <span class="text-sm">{{ displayStatus }}</span>
          </div>
        </div>

        <!-- Calibration Result -->
        <div v-if="calibrationResult" class="p-4 rounded-lg" :class="calibrationResultClass">
          <h3 class="font-medium mb-2">
            {{ $t('components.guider.calibrationAssistant.calibrationResult') }}
          </h3>
          <div class="text-sm">
            <div>
              {{ $t('components.guider.calibrationAssistant.quality') }}:
              {{ calibrationResult.quality }}
            </div>
            <div v-if="calibrationResult.explanation" class="mt-2 text-gray-300">
              {{ calibrationResult.explanation }}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <!-- Slew Button -->
          <button
            @click="slewToOptimalPosition"
            :disabled="!canSlew || isSlewing || isCalibrating"
            class="default-button-cyan px-4 py-3 flex items-center justify-center gap-2 flex-1"
          >
            <svg v-if="!isSlewing" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
            <div v-else class="spinner"></div>
            {{ $t('components.guider.calibrationAssistant.slewToPosition') }}
          </button>

          <!-- Calibration Button -->
          <button
            @click="toggleCalibration"
            :disabled="!store.guiderInfo?.Connected"
            :class="store.guiderInfo?.State === 'Calibrating' ? 'default-button-red' : 'default-button-green'"
            class="px-4 py-3 flex items-center justify-center gap-2 flex-1"
          >
            <StopIcon v-if="store.guiderInfo?.State === 'Calibrating'" class="w-5 h-5" />
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ store.guiderInfo?.State === 'Calibrating' ? $t('components.guider.calibrationAssistant.stopCalibration') : $t('components.guider.calibrationAssistant.startCalibration') }}
          </button>

        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { StopIcon } from '@heroicons/vue/24/outline';
import Modal from '@/components/helpers/Modal.vue';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import {  degreesToHMS, degreesToDMS, getLST } from '@/utils/utils';
import apiService from '@/services/apiService';

const { t } = useI18n();
const store = apiStore();
const framingStore = useFramingStore();

defineProps({
  show: Boolean,
});

defineEmits(['close']);

// Reactive state
const currentPosition = ref({ ra: null, dec: null });
const recommendedPosition = ref({ ra: null, dec: null });
const status = ref('');
const isSlewing = ref(false);
const isCalibrating = ref(false);
const calibrationResult = ref(null);

// PHD2-style position settings
const decOffset = ref(0); // Start neutral, let altitude calculation handle it
const meridianOffset = ref(15); // Standard 15° offset from meridian
const direction = ref('west');

// Track if we've slewed to show appropriate button
const hasSlewed = ref(false);

// Computed properties
const isOptimalPosition = computed(() => {
  if (!currentPosition.value.ra || !recommendedPosition.value.ra) return false;

  // Check if current position is close enough to recommended position
  // This is a simplified check - in reality you'd need proper coordinate comparison
  const raClose =
    Math.abs(parseRA(currentPosition.value.ra) - parseRA(recommendedPosition.value.ra)) < 0.1;
  const decClose =
    Math.abs(parseDec(currentPosition.value.dec) - parseDec(recommendedPosition.value.dec)) < 1;

  return raClose && decClose;
});

const canSlew = computed(() => {
  return store.mountInfo?.Connected && 
         !isSlewing.value && 
         !isCalibrating.value &&
         !framingStore.isSlewing &&
         !framingStore.isSlewingAndCentering;
});

const canCalibrate = computed(() => {
  return store.guiderInfo?.Connected && !isSlewing.value && !isCalibrating.value;
});

const displayStatus = computed(() => {
  const guiderState = store.guiderInfo?.State;
  
  if (isSlewing.value) {
    return t('components.guider.calibrationAssistant.slewing');
  }
  
  if (status.value && !guiderState) {
    return status.value; // Show custom status when no guider state
  }
  
  // Show guider state-based status
  switch (guiderState) {
    case 'Calibrating':
      return t('components.guider.calibrationAssistant.calibrating');
    case 'Guiding':
      return t('components.guider.calibrationAssistant.calibrationComplete');
    case 'Stopped':
      return status.value || t('components.guider.calibrationAssistant.positionCalculated');
    case 'LostLock':
      return t('components.guider.calibrationAssistant.calibrationFailed');
    default:
      return status.value;
  }
});

const statusClass = computed(() => {
  const guiderState = store.guiderInfo?.State;
  
  if (isSlewing.value) return 'bg-blue-500/20 border border-blue-500/30';
  if (guiderState === 'Calibrating') return 'bg-yellow-500/20 border border-yellow-500/30';
  if (guiderState === 'Guiding') return 'bg-green-500/20 border border-green-500/30';
  if (guiderState === 'LostLock') return 'bg-red-500/20 border border-red-500/30';
  return 'bg-gray-500/20 border border-gray-500/30';
});

const calibrationResultClass = computed(() => {
  if (!calibrationResult.value) return '';

  switch (calibrationResult.value.quality) {
    case 'good':
      return 'bg-green-500/20 border border-green-500/30';
    case 'acceptable':
      return 'bg-yellow-500/20 border border-yellow-500/30';
    case 'poor':
      return 'bg-red-500/20 border border-red-500/30';
    default:
      return 'bg-gray-500/20 border border-gray-500/30';
  }
});

// Methods
function parseRA(raString) {
  if (!raString) return 0;
  const parts = raString.split(':');
  return parseFloat(parts[0]) + parseFloat(parts[1]) / 60 + parseFloat(parts[2]) / 3600;
}

function parseDec(decString) {
  if (!decString) return 0;
  // Simple parsing - would need proper DMS parsing in production
  return parseFloat(decString.replace(/[°'"]/g, ''));
}

function getCurrentPosition() {
  // Get current telescope position
  if (store.mountInfo?.Coordinates) {
    currentPosition.value = {
      ra: store.mountInfo.Coordinates.Ra,
      dec: store.mountInfo.Coordinates.Dec,
    };
  }
}

function calculateOptimalPosition() {
  // Calculate optimal calibration position with proper PHD2-style offsets
  const latitude = store.profileInfo?.AstrometrySettings?.Latitude || 0;
  const longitude = store.profileInfo?.AstrometrySettings?.Longitude || 0;
  
  // Get Local Sidereal Time for meridian calculation
  const lstDegrees = getLST(longitude);
  const lstHours = lstDegrees / 15; // Convert to hours
  
  // Calculate target RA based on meridian offset and direction
  let targetRAHours = lstHours;
  if (meridianOffset.value > 0) {
    const offsetHours = meridianOffset.value / 15; // Convert degrees to hours
    if (direction.value === 'west') {
      targetRAHours = (lstHours - offsetHours + 24) % 24; // West of meridian (earlier RA)
    } else {
      targetRAHours = (lstHours + offsetHours) % 24; // East of meridian (later RA)
    }
  }
  
  // Calculate target Dec using user's offset
  let targetDec = decOffset.value;
  
  // Convert RA hours back to degrees for final calculation
  const targetRADegrees = targetRAHours * 15;
  
  console.log(`LST: ${lstHours.toFixed(2)}h, Target RA: ${targetRAHours.toFixed(2)}h (${targetRADegrees.toFixed(1)}°), Target Dec: ${targetDec}°`);
  console.log(`Meridian offset: ${meridianOffset.value}° ${direction.value}, Dec offset: ${decOffset.value}°`);
  
  // Store both formatted and degree values
  const raFormatted = degreesToHMS(targetRADegrees);
  const decFormatted = degreesToDMS(targetDec);
  
  console.log(`Final RA/Dec: ${raFormatted}, ${decFormatted} (${targetRADegrees}°, ${targetDec}°)`);
  
  recommendedPosition.value = { 
    ra: raFormatted, 
    dec: decFormatted,
    raDegrees: targetRADegrees,
    decDegrees: targetDec
  };
  status.value = t('components.guider.calibrationAssistant.positionCalculated');
}


function setDirection(newDirection) {
  direction.value = newDirection;
  calculateOptimalPosition();
}

function toggleCalibration() {
  if (store.guiderInfo?.State === 'Calibrating') {
    stopCalibration();
  } else {
    startCalibration();
  }
}

async function slewToOptimalPosition() {
  if (!canSlew.value) return;

  isSlewing.value = true;
  status.value = t('components.guider.calibrationAssistant.slewing');

  try {
    // Use the same slew method as Flat Assistant (via framingStore)
    const raInDegrees = recommendedPosition.value.raDegrees;
    const decInDegrees = recommendedPosition.value.decDegrees;
    
    console.log(`Slewing to: RA=${raInDegrees}°, Dec=${decInDegrees}°`);
    
    // Use framingStore.slew like the Flat Assistant ButtonSlew component
    await framingStore.slew(raInDegrees, decInDegrees);

    status.value = t('components.guider.calibrationAssistant.slewComplete');
  } catch (error) {
    console.error('Slew failed:', error);
    status.value = t('components.guider.calibrationAssistant.slewError');
  } finally {
    isSlewing.value = false;
  }
}

async function startCalibration() {
  if (!store.guiderInfo?.Connected) return;

  status.value = t('components.guider.calibrationAssistant.calibrating');
  calibrationResult.value = null;

  try {
    // Start PHD2 calibration with forced calibration
    await apiService.guiderStart(true);

    // Monitor calibration progress
    watchCalibrationProgress();
  } catch (error) {
    console.error('Calibration failed:', error);
    status.value = t('components.guider.calibrationAssistant.calibrationError');
  }
}

async function stopCalibration() {
  try {
    await apiService.guiderAction('stop');
    status.value = t('components.guider.calibrationAssistant.calibrationStopped');
  } catch (error) {
    console.error('Stop calibration failed:', error);
  }
}

function watchCalibrationProgress() {
  const unwatch = watch(
    () => store.guiderInfo?.State,
    (newState, oldState) => {
      console.log('Guider state changed:', oldState, '->', newState);
      
      // If we transition away from Calibrating, the calibration process is done
      if (oldState === 'Calibrating' && newState !== 'Calibrating') {
        if (newState === 'Guiding') {
          // Calibration completed successfully
          status.value = t('components.guider.calibrationAssistant.calibrationComplete');

          // Simulate calibration result assessment
          calibrationResult.value = {
            quality: 'good',
            explanation: t('components.guider.calibrationAssistant.goodCalibration'),
          };
        } else {
          // Calibration failed or stopped
          status.value = t('components.guider.calibrationAssistant.calibrationFailed');

          calibrationResult.value = {
            quality: 'poor',
            explanation: t('components.guider.calibrationAssistant.poorCalibration'),
          };
        }
        
        unwatch();
      }
    }
  );
}

// Lifecycle
onMounted(() => {
  getCurrentPosition();
  calculateOptimalPosition();
});

// Watch for mount position updates
watch(
  () => store.mountInfo?.Coordinates,
  () => {
    getCurrentPosition();
  },
  { deep: true }
);
</script>

<style scoped>
.spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid #bbb;
  border-top-color: #333;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
