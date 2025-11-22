<template>
  <!-- Framing symbol in the center -->
  <div class="framing-container" @click="openFramingModal">
    <!-- Rectangle around crosshair -->
    <div class="crosshair-rectangle"></div>
    <!-- Vertical line -->
    <div class="crosshair-line vertical"></div>
    <!-- Horizontal line -->
    <div class="crosshair-line horizontal"></div>
    <!-- Center dot -->
    <div class="crosshair-dot"></div>
    <!-- SVG framing symbol overlay -->
    <svg viewBox="0 0 100 100" class="framing-icon">
      <!-- First rectangle (straight) -->
      <rect x="60" y="30" width="25" height="13" fill="none" stroke="rgba(255, 255, 255, 0.6)" stroke-width="1.5"/>
      <!-- Second rectangle (rotated, overlapped) -->
      <rect x="62" y="28" width="25" height="13" fill="none" stroke="rgba(6, 182, 212, 0.7)" stroke-width="1.5" transform="rotate(15 75 35)"/>
    </svg>
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

    formattedRA.value = degreesToHMS(raDeg);
    formattedDec.value = degreesToDMS(decDeg);
    formattedRADeg.value = raDeg.toString();
    formattedDecDeg.value = decDeg.toString();
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
/* Framing symbol styles */
.framing-container {
  position: fixed;
  top: calc(50% - 30px);
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  width: 70px;
  height: 70px;
  cursor: pointer;
}

.crosshair-rectangle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 45px;
  transform: translate(-50%, -50%);
  border: 1px dashed rgba(255, 255, 255, 0.5);
  pointer-events: none;
}

.crosshair-line {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.6);
}

.crosshair-line.vertical {
  width: 2px;
  height: 12px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.crosshair-line.horizontal {
  width: 12px;
  height: 2px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
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

.framing-icon {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.4));
}

@media (orientation: landscape) {
  .framing-container {
    left: calc(50% + 4rem);
  }
}

/* Coordinates display */
.coordinates-display {
  position: fixed;
  top: calc(50% + 20px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
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
