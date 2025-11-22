<template>
  <!-- Crosshair in the center -->
  <div class="crosshair-container" @click="openFramingModal">
    <!-- Vertical line -->
    <div class="crosshair-line vertical"></div>
    <!-- Horizontal line -->
    <div class="crosshair-line horizontal"></div>
    <!-- Center dot -->
    <div class="crosshair-dot"></div>
  </div>

  <!-- Coordinates below crosshair -->
  <div class="coordinates-display">
    <p class="coordinate-text">{{ formattedRA }}</p>
    <p class="coordinate-text">{{ formattedDec }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useStellariumStore } from '@/store/stellariumStore';
import { useFramingStore } from '@/store/framingStore';
import { degreesToHMS, degreesToDMS, rad2deg } from '@/utils/utils';

const stellariumStore = useStellariumStore();
const framingStore = useFramingStore();
const formattedRA = ref('--:--:--');
const formattedDec = ref('+--:--:--');
const formattedRADeg = ref('0.00');
const formattedDecDeg = ref('0.00');

// Koordinaten-Offset (in Grad) für Justierung
const COORD_OFFSET_RA = 0;
const COORD_OFFSET_DEC = 0;
let animationFrameId = null;

function updateViewDirection() {
  if (!stellariumStore.stel) return;

  try {
    const stel = stellariumStore.stel;
    const obs = stel.observer;

    // Get the center of the view - forward direction is [0, 0, -1] in VIEW frame
    const viewVec = [0, 0, -1];

    // Convert from VIEW to CIRS frame
    const cirsVec = stel.convertFrame(obs, 'VIEW', 'ICRF', viewVec);

    // Convert to spherical coordinates (RA/Dec)
    const radec = stel.c2s(cirsVec);

    let raDeg = rad2deg(radec[0]);
    const decDeg = rad2deg(radec[1]);

    // Normalize RA to 0-360 range
    raDeg = ((raDeg % 360) + 360) % 360;

    formattedRA.value = degreesToHMS(raDeg + COORD_OFFSET_RA);
    formattedDec.value = degreesToDMS(decDeg + COORD_OFFSET_DEC);
    formattedRADeg.value = (raDeg + COORD_OFFSET_RA).toString();
    formattedDecDeg.value = (decDeg + COORD_OFFSET_DEC).toString();
  } catch (error) {
    console.error('Error updating view direction:', error);
  }

  animationFrameId = requestAnimationFrame(updateViewDirection);
}

function openFramingModal() {
  framingStore.RAangle = parseFloat(formattedRADeg.value);
  framingStore.DECangle = parseFloat(formattedDecDeg.value);
  framingStore.RAangleString = formattedRA.value;
  framingStore.DECangleString = formattedDec.value;
  framingStore.showFramingModal = true;
}

onMounted(() => {
  updateViewDirection();
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<style scoped>
/* Crosshair styles */
.crosshair-container {
  position: fixed;
  top: calc(50% - 16px);
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  width: 40px;
  height: 40px;
  cursor: pointer;
}

.crosshair-line {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.6);
}

.crosshair-line.vertical {
  width: 2px;
  height: 100%;
  left: 50%;
  transform: translateX(-50%);
}

.crosshair-line.horizontal {
  width: 100%;
  height: 2px;
  top: 50%;
  transform: translateY(-50%);
}

.crosshair-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@media (orientation: landscape) {
  .crosshair-container {
    left: calc(50% + 4rem);
  }
}

/* Coordinates display */
.coordinates-display {
  position: fixed;
  top: calc(50% + 20px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  text-align: center;
  pointer-events: none;
}

.coordinate-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
  font-family: monospace;
  margin: 2px 0;
  line-height: 1.2;
}

@media (orientation: landscape) {
  .coordinates-display {
    left: calc(50% + 4rem);
  }
}

/* Ensure proper touch handling */
.touch-manipulation {
  touch-action: manipulation;
}
</style>
