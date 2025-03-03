<template>
  <div>
    <!-- Mount position icon overlay -->
    <div
      v-if="mountVisible && mountIconPosition"
      :style="{
        position: 'absolute',
        left: `${mountIconPosition.x}px`,
        top: `${mountIconPosition.y}px`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 10,
      }"
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M7.5 0C7.77614 0 8 0.223858 8 0.5V1.80687C10.6922 2.0935 12.8167 4.28012 13.0068 7H14.5C14.7761 7 15 7.22386 15 7.5C15 7.77614 14.7761 8 14.5 8H12.9888C12.7094 10.6244 10.6244 12.7094 8 12.9888V14.5C8 14.7761 7.77614 15 7.5 15C7.22386 15 7 14.7761 7 14.5V13.0068C4.28012 12.8167 2.0935 10.6922 1.80687 8H0.5C0.223858 8 0 7.77614 0 7.5C0 7.22386 0.223858 7 0.5 7H1.78886C1.98376 4.21166 4.21166 1.98376 7 1.78886V0.5C7 0.223858 7.22386 0 7.5 0Z"
          fill="#FF5500"
          stroke="#FFFFFF"
          stroke-width="0.5"
        />
      </svg>
    </div>

    <!-- Mount Controls -->
    <div class="absolute bottom-3 right-3 flex gap-2">
      <button
        @click="toggleMountIcon"
        class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
        :class="{ 'bg-cyan-600': mountVisible }"
        title="Toggle mount position indicator"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M7.5 0C7.77614 0 8 0.223858 8 0.5V1.80687C10.6922 2.0935 12.8167 4.28012 13.0068 7H14.5C14.7761 7 15 7.22386 15 7.5C15 7.77614 14.7761 8 14.5 8H12.9888C12.7094 10.6244 10.6244 12.7094 8 12.9888V14.5C8 14.7761 7.77614 15 7.5 15C7.22386 15 7 14.7761 7 14.5V13.0068C4.28012 12.8167 2.0935 10.6922 1.80687 8H0.5C0.223858 8 0 7.77614 0 7.5C0 7.22386 0.223858 7 0.5 7H1.78886C1.98376 4.21166 4.21166 1.98376 7 1.78886V0.5C7 0.223858 7.22386 0 7.5 0Z"
            fill="white"
          />
        </svg>
      </button>
      <button
        @click="syncViewToMount"
        class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
        title="Center view on mount position"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="white"
            stroke-width="2"
          />
          <path d="M12 8V16" stroke="white" stroke-width="2" />
          <path d="M8 12H16" stroke="white" stroke-width="2" />
        </svg>
      </button>
      <button
        @click="toggleAutoSync"
        class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
        :class="{ 'bg-cyan-600': autoSyncEnabled }"
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

    <!-- Mount position overlay -->
    <div
      v-if="showMountInfo"
      class="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white p-4 rounded-lg shadow-lg min-w-[250px]"
    >
      <h3 class="text-lg font-semibold">{{ $t('components.stellarium.mount_position.title') }}:</h3>
      <p class="mt-2 text-sm">
        {{ $t('components.stellarium.selected_object.ra') }}: {{ mountRa }}
      </p>
      <p class="text-sm">{{ $t('components.stellarium.selected_object.dec') }}: {{ mountDec }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { degreesToHMS, degreesToDMS } from '@/utils/utils';
import apiService from '@/services/apiService';
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

const emit = defineEmits(['moveToPosition']);

const stellariumStore = useStellariumStore();
const mountPositionInterval = ref(null);
const mountRa = ref('--');
const mountDec = ref('--');
const mountRaDeg = ref(null);
const mountDecDeg = ref(null);
const mountIconPosition = ref(null);
const mountVisible = ref(true);
const autoSyncEnabled = ref(false);
const showMountInfo = ref(true);

// Toggle mount icon visibility
function toggleMountIcon() {
  mountVisible.value = !mountVisible.value;
}

// Toggle auto-sync with mount
function toggleAutoSync() {
  autoSyncEnabled.value = !autoSyncEnabled.value;
}

// Manually sync view to mount position
function syncViewToMount() {
  if (mountRaDeg.value !== null && mountDecDeg.value !== null) {
    emit('moveToPosition', mountRaDeg.value, mountDecDeg.value, 1, 50);
  }
}

// Update the position of the mount icon on screen
function updateMountIconPosition() {
  if (!stellariumStore.stel || mountRaDeg.value === null || mountDecDeg.value === null) {
    return;
  }

  const stel = stellariumStore.stel;
  const ra_rad = mountRaDeg.value * stel.D2R;
  const dec_rad = mountDecDeg.value * stel.D2R;

  // Convert celestial coordinates to screen coordinates
  const icrfVec = stel.s2c(ra_rad, dec_rad);
  const observedVec = stel.convertFrame(stel.observer, 'ICRF', 'OBSERVED', icrfVec);

  // Check if the point is visible (above horizon)
  const alt = stel.c2s(observedVec)[1];
  if (alt < 0) {
    // Object is below horizon
    mountIconPosition.value = null;
    return;
  }

  // Get screen coordinates (projected point)
  const proj = stel.core.proj.project(observedVec);
  if (proj[2] <= 0) {
    // Object is not in current view
    mountIconPosition.value = null;
    return;
  }

  // Convert normalized coordinates to screen pixels
  const canvasWidth = props.canvasRef.clientWidth;
  const canvasHeight = props.canvasRef.clientHeight;
  const x = ((proj[0] + 1) / 2) * canvasWidth;
  const y = (1 - (proj[1] + 1) / 2) * canvasHeight;

  mountIconPosition.value = { x, y };
}

// Animation frame for updating mount icon position
let animationFrameId = null;
const updateLoop = () => {
  if (mountVisible.value && stellariumStore.stel) {
    updateMountIconPosition();
  }
  animationFrameId = requestAnimationFrame(updateLoop);
};

// Watch for search visibility changes to control mount info display
watch(
  () => props.isSearchVisible,
  (newValue) => {
    showMountInfo.value = !newValue;
  }
);

onMounted(() => {
  // Start animation loop for mount icon position updates
  animationFrameId = requestAnimationFrame(updateLoop);

  // Start polling mount position
  mountPositionInterval.value = setInterval(async () => {
    if (stellariumStore.stel) {
      try {
        const response = await apiService.mountAction('info');
        if (response.Success) {
          const ra = response.Response.RightAscension;
          const dec = response.Response.Declination;

          // Update displayed coordinates
          mountRa.value = degreesToHMS(ra);
          mountDec.value = degreesToDMS(dec);
          mountRaDeg.value = ra;
          mountDecDeg.value = dec;

          // Move Stellarium view only if auto-sync is enabled
          if (autoSyncEnabled.value) {
            emit('moveToPosition', ra, dec, 1, 50);
          }
        }
      } catch (error) {
        console.error('Error fetching mount position:', error);
      }
    }
  }, 5000);
});

onBeforeUnmount(() => {
  // Clean up intervals and animation frames
  if (mountPositionInterval.value) {
    clearInterval(mountPositionInterval.value);
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});

// Expose mount position data and functions to the parent component
defineExpose({
  mountRa,
  mountDec,
  mountRaDeg,
  mountDecDeg,
  syncViewToMount,
  toggleAutoSync,
  toggleMountIcon,
});
</script>
