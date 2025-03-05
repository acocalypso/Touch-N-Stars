<template>
  <div>
    <!-- Mount Controls -->
    <div class="absolute bottom-3 right-3 flex gap-2">
      <button
        @click="syncViewToMount"
        class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md transition-all duration-200"
        :class="{ 'bg-cyan-600 border-white shadow-cyan-400': syncViewClicked }"
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

    <!-- Mount position overlay -->
    <div
      v-if="showMountInfo"
      class="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white p-4 rounded-lg shadow-lg min-w-[250px]"
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

const emit = defineEmits(['moveToPosition']);
const store = apiStore();

const stellariumStore = useStellariumStore();
const mountPositionInterval = ref(null);
const mountRa = ref('--');
const mountDec = ref('--');
const mountRaDeg = ref(null);
const mountDecDeg = ref(null);
const autoSyncEnabled = ref(false);
const showMountInfo = ref(true);
const syncViewClicked = ref(false);
const autoSyncClicked = ref(false);

// Toggle auto-sync with mount
function toggleAutoSync() {
  autoSyncEnabled.value = !autoSyncEnabled.value;
  autoSyncClicked.value = true;
  setTimeout(() => {
    autoSyncClicked.value = false;
  }, 500); // Reset after 500ms
}

// Manually sync view to mount position
function syncViewToMount() {
  if (mountRaDeg.value !== null && mountDecDeg.value !== null) {
    emit('moveToPosition', mountRaDeg.value, mountDecDeg.value, 1, 50);
    syncViewClicked.value = true;
    setTimeout(() => {
      syncViewClicked.value = false;
    }, 500); // Reset after 500ms
  }
}

// Watch for search visibility changes to control mount info display
watch(
  () => props.isSearchVisible,
  (newValue) => {
    showMountInfo.value = !newValue;
  }
);

watch(
  () => store.mountInfo.RightAscension || store.mountInfo.Declination,
  () => {
    if (stellariumStore.stel) {
     
        const ra = store.mountInfo.RightAscension;
        const dec = store.mountInfo.Declination;

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
  }
);

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
  mountRaDeg,
  mountDecDeg,
  syncViewToMount,
  toggleAutoSync,
  syncViewClicked,
  autoSyncClicked,
  autoSyncEnabled,
});
</script>
