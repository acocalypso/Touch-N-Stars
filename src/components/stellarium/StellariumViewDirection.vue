<template>
  <button
    :class="buttonClasses"
    class="fixed bg-black bg-opacity-80 p-2 rounded-full text-gray-200 font-mono transition-all duration-200 shadow-md z-10"
    style="bottom: calc(env(safe-area-inset-bottom, 0px) + 48px)"
    @click="toggleViewInfo"
  >
    <p class="text-center text-sm">{{ formattedRA }}</p>
    <p class="text-center text-xs">{{ formattedDec }}</p>
  </button>

  <!-- View Direction Info Panel -->
  <div
    v-if="isViewInfoVisible"
    class="fixed inset-0 z-10 flex bg-black bg-opacity-50"
    :class="containerClasses"
    @click.self="isViewInfoVisible = false"
  >
    <div
      :class="modalClasses"
      class="bg-black bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg text-gray-300 border border-gray-600 p-4"
    >
      <h3 class="text-lg font-semibold mb-4">View Direction</h3>

      <div class="space-y-3">
        <!-- RA/Dec -->
        <div>
          <label class="block text-sm mb-1 text-gray-400">RA / Dec</label>
          <p class="text-base font-mono">{{ formattedRA }} / {{ formattedDec }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ formattedRADeg }}° / {{ formattedDecDeg }}°</p>
        </div>

        <!-- Alt/Az -->
        <div>
          <label class="block text-sm mb-1 text-gray-400">Alt / Az</label>
          <p class="text-base font-mono">{{ formattedAlt }}° / {{ formattedAz }}°</p>
        </div>

        <!-- Observer Position -->
        <div>
          <label class="block text-sm mb-1 text-gray-400">Observer Location</label>
          <p class="text-xs font-mono">
            Lat: {{ formattedLat }}°
            <br />
            Lon: {{ formattedLon }}°
          </p>
        </div>

        <!-- Copy Button -->
        <button
          @click="copyToClipboard"
          class="w-full mt-4 px-3 py-2 bg-slate-800/40 border border-slate-600/30 hover:bg-slate-700/60 hover:border-slate-500/50 rounded-lg shadow-md text-sm touch-manipulation transition-all duration-200 backdrop-blur-sm"
        >
          {{ copyButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useStellariumStore } from '@/store/stellariumStore';
import { degreesToHMS, degreesToDMS, rad2deg } from '@/utils/utils';
import { useOrientation } from '@/composables/useOrientation';

const stellariumStore = useStellariumStore();
const formattedRA = ref('--:--:--');
const formattedDec = ref('+--:--:--');
const formattedRADeg = ref('0.00');
const formattedDecDeg = ref('0.00');
const formattedAlt = ref('0.00');
const formattedAz = ref('0.00');
const formattedLat = ref('0.00');
const formattedLon = ref('0.00');
const isViewInfoVisible = ref(false);
const copyButtonText = ref('Copy Coordinates');
let animationFrameId = null;

const { isLandscape } = useOrientation();

const buttonClasses = computed(() => ({
  'right-4': !isLandscape.value,
  'right-8': isLandscape.value,
}));

const containerClasses = computed(() => ({
  'items-center justify-center p-4': !isLandscape.value,
  'items-center justify-center pl-32 pr-4': isLandscape.value,
}));

const modalClasses = computed(() => ({
  'w-full max-w-sm sm:max-w-md mx-4': !isLandscape.value,
  'w-[420px] max-w-[90vw]': isLandscape.value,
}));

function updateViewDirection() {
  if (!stellariumStore.stel || !stellariumStore.getCurrentViewDirection) return;

  try {
    const viewDir = stellariumStore.getCurrentViewDirection();
    const stel = stellariumStore.stel;

    // Update RA/Dec
    let raDeg = rad2deg(viewDir.ra);
    const decDeg = rad2deg(viewDir.dec);
    const altDeg = rad2deg(viewDir.alt);
    const azDeg = rad2deg(viewDir.az);

    // Normalize RA to 0-360 range
    raDeg = ((raDeg % 360) + 360) % 360;

    formattedRA.value = degreesToHMS(raDeg);
    formattedDec.value = degreesToDMS(decDeg);
    formattedRADeg.value = raDeg.toFixed(2);
    formattedDecDeg.value = decDeg.toFixed(2);
    formattedAlt.value = altDeg.toFixed(2);
    formattedAz.value = azDeg.toFixed(2);

    // Update observer position
    const lat = stel.core.observer.latitude * stel.R2D;
    const lon = stel.core.observer.longitude * stel.R2D;
    formattedLat.value = lat.toFixed(4);
    formattedLon.value = lon.toFixed(4);
  } catch (error) {
    console.error('Error updating view direction:', error);
  }

  animationFrameId = requestAnimationFrame(updateViewDirection);
}

function toggleViewInfo() {
  isViewInfoVisible.value = !isViewInfoVisible.value;
}

function copyToClipboard() {
  const text = `RA: ${formattedRA.value}, Dec: ${formattedDec.value}`;
  navigator.clipboard.writeText(text).then(() => {
    copyButtonText.value = 'Copied!';
    setTimeout(() => {
      copyButtonText.value = 'Copy Coordinates';
    }, 2000);
  });
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
/* Ensure proper touch handling */
.touch-manipulation {
  touch-action: manipulation;
}
</style>
