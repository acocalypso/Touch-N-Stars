<template>
  <div>
    <!-- Mount Controls - moved to left side -->
    <div
      :class="controlsClasses"
      class="fixed flex gap-2 bg-black bg-opacity-90 p-2 rounded-full"
      style="bottom: calc(env(safe-area-inset-bottom, 0px) + 48px)"
    >
      <button
        @click="syncViewToMount"
        class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md transition-all duration-200"
        :class="{ 'bg-cyan-600 border-white shadow-cyan-400': syncViewClicked }"
        title="Center view on mount position"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M6 21l6 -5l6 5" />
          <path d="M12 13v8" />
          <path
            d="M3.294 13.678l.166 .281c.52 .88 1.624 1.265 2.605 .91l14.242 -5.165a1.023 1.023 0 0 0 .565 -1.456l-2.62 -4.705a1.087 1.087 0 0 0 -1.447 -.42l-.056 .032l-12.694 7.618c-1.02 .613 -1.357 1.897 -.76 2.905z"
          />
          <path d="M14 5l3 5.5" />
        </svg>
      </button>
      <button
        @click="toggleAutoSync"
        class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md transition-all duration-200"
        :class="{ 'bg-cyan-600 border-white shadow-cyan-400': autoSyncClicked || autoSyncEnabled }"
        title="Toggle auto-sync view with mount"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C13.1798 4 14.3037 4.26571 15.3067 4.7356"
            stroke="white"
            stroke-width="2"
          />
          <path d="M16 8L20 4M20 4L16 0M20 4H13" stroke="white" stroke-width="2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { degreesToHMS, degreesToDMS } from '@/utils/utils';
import { apiStore } from '@/store/store';
import { useStellariumStore } from '@/store/stellariumStore';

const props = defineProps({
  canvasRef: {
    type: Object,
    required: true,
  },
  isSearchVisible: {
    type: Boolean,
    default: false,
  },
});

const store = apiStore();

const stellariumStore = useStellariumStore();
const mountPositionInterval = ref(null);
const mountRa = ref('--');
const mountDec = ref('--');
const autoSyncEnabled = ref(false);
const showMountInfo = ref(true);
const syncViewClicked = ref(false);
const autoSyncClicked = ref(false);
const raDegree = ref(0);
const decDegree = ref(0);
const mountLayer = ref(null);
const mountCircle = ref(null);

// Check if in landscape mode
const isLandscape = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth > window.innerHeight;
  }
  return false;
});

// Controls positioning classes
const controlsClasses = computed(() => ({
  'right-3': !isLandscape.value, // Portrait: right side (original)
  'left-3': isLandscape.value, // Landscape: left side (moved from right)
}));

// Toggle auto-sync with mount
function toggleAutoSync() {
  autoSyncEnabled.value = !autoSyncEnabled.value;
  autoSyncClicked.value = true;
  stellariumStore.stel.pointAndLock(mountCircle.value);
  setTimeout(() => {
    autoSyncClicked.value = false;
  }, 500); // Reset after 500ms
}

// Manually sync view to mount position
function syncViewToMount() {
  if (raDegree.value !== null && decDegree.value !== null) {
    stellariumStore.stel.pointAndLock(mountCircle.value);
    syncViewClicked.value = true;
    setTimeout(() => {
      syncViewClicked.value = false;
    }, 500); // Reset after 500ms
  }
}

// 6) Kreis auf RA/Dec aktualisieren
function updateCirclePos(ra_deg, dec_deg) {
  const stel = stellariumStore.stel;
  const ra_rad = ra_deg * stel.D2R - 0.005;
  const dec_rad = dec_deg * stel.D2R;
  const icrfVec = stel.s2c(ra_rad, dec_rad);
  const observedVec = stel.convertFrame(stel.observer, 'CIRS', 'MOUNT', icrfVec);
  mountCircle.value.pos = observedVec;
  mountCircle.value.color = [0, 1, 0, 0.25];
  mountCircle.value.border_color = [1, 1, 1, 1];
  mountCircle.value.size = [0.03, 0.03];
  mountCircle.value.frame = 'MOUNT';
  mountCircle.value.label = 'MOUNT';
  mountCircle.value.update();
}

function handleMountUpdate(raVal, decVal) {
  raDegree.value = parseFloat(raVal);
  decDegree.value = parseFloat(decVal);
  updateCirclePos(raDegree.value, decDegree.value);
}

// Watch for search visibility changes to control mount info display
watch(
  () => props.isSearchVisible,
  (newValue) => {
    showMountInfo.value = !newValue;
  }
);

watch(
  () => [store.mountInfo.Coordinates.RADegrees, store.mountInfo.Coordinates.Dec],
  ([newRa, newDec]) => {
    if (stellariumStore.stel) {
      const ra = newRa;
      const dec = newDec;
      // Update displayed coordinates
      mountRa.value = degreesToHMS(ra);
      mountDec.value = degreesToDMS(dec);
      handleMountUpdate(newRa, newDec);

      // Move Stellarium view only if auto-sync is enabled
      if (autoSyncEnabled.value) {
        stellariumStore.stel.pointAndLock(mountCircle.value);
      }
    }
  }
);
onMounted(() => {
  const ra = store.mountInfo.Coordinates.RADegrees;
  const dec = store.mountInfo.Coordinates.Dec;

  // Update displayed coordinates
  mountRa.value = degreesToHMS(ra);
  mountDec.value = degreesToDMS(dec);

  if (!stellariumStore.stel) return;
  mountLayer.value = stellariumStore.stel.createLayer({ id: 'mountLayer', z: 7, visible: true });
  mountCircle.value = stellariumStore.stel.createObj('circle', {
    id: 'mountCircle',
    model_data: {},
  });

  mountCircle.value.update();
  mountLayer.value.add(mountCircle.value);
  handleMountUpdate(ra, dec);
});

onBeforeUnmount(() => {
  // Clean up intervals and animation frames
  if (mountPositionInterval.value) {
    clearInterval(mountPositionInterval.value);
  }
});

// Expose mount position data and functions to the parent component
defineExpose({
  mountRa,
  mountDec,
  syncViewToMount,
  toggleAutoSync,
  syncViewClicked,
  autoSyncClicked,
  autoSyncEnabled,
});
</script>