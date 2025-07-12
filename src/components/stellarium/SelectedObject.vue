<template>
  <div
    v-if="selectedObject"
    :class="containerClasses"
    class="absolute bg-black bg-opacity-90 backdrop-blur-sm text-gray-300 p-4 rounded-lg shadow-lg border border-gray-600"
    style="z-index: 100"
  >
    <!-- Overlay mit Spinner um eine versehntliches drücken der Button zu verhindern -->
    <div
      v-if="!buttonsEnabled"
      class="absolute inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center rounded-lg"
    >
      <span class="spinner"></span>
    </div>

    <!-- Scrollable Content -->
    <div :class="contentClasses" class="overflow-y-auto">
      <h3 class="text-lg font-semibold">{{ $t('components.stellarium.selected_object.title') }}:</h3>
      
      <ul class="mt-2">
        <li v-for="(name, index) in selectedObject" :key="index" class="text-sm">
          {{ name }}
        </li>
      </ul>
      
      <p class="mt-2 text-sm">
        {{ $t('components.stellarium.selected_object.ra') }}: {{ selectedObjectRa }}
      </p>
      <p class="text-sm">
        {{ $t('components.stellarium.selected_object.dec') }}: {{ selectedObjectDec }}
      </p>
      
      <div
        v-if="store.mountInfo.Connected && !store.sequenceRunning"
        class="flex flex-col gap-2 mt-2"
      >
        <div class="flex gap-1">
          <button @click="setFramingCoordinates" class="default-button-cyan max-w-56">
            {{ $t('components.stellarium.selected_object.button_framing') }}
          </button>
          <SaveFavTargets
            class="w-5 h-5"
            :name="selectedObject[0]"
            :ra="selectedObjectRaDeg"
            :dec="selectedObjectDecDeg"
            :ra-string="selectedObjectRa"
            :dec-string="selectedObjectDec"
          />
        </div>
        <ButtonSlew :raAngle="props.selectedObjectRaDeg" :decAngle="props.selectedObjectDecDeg" />
        <ButtonSlewAndCenter
          :raAngle="props.selectedObjectRaDeg"
          :decAngle="props.selectedObjectDecDeg"
        />
        <ButtomSyncCoordinatesToMount
          :raAngle="props.selectedObjectRaDeg"
          :decAngle="props.selectedObjectDecDeg"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted, computed } from 'vue';
import { apiStore } from '@/store/store';
import { Capacitor } from '@capacitor/core';
import ButtonSlew from '@/components/mount/ButtonSlew.vue';
import ButtonSlewAndCenter from '@/components/mount/ButtonSlewAndCenter.vue';
import SaveFavTargets from '@/components/favTargets/SaveFavTargets.vue';
import ButtomSyncCoordinatesToMount from '@/components/mount/ButtomSyncCoordinatesToMount.vue';

const store = apiStore();
const props = defineProps({
  selectedObject: Object,
  selectedObjectRa: String,
  selectedObjectDec: String,
  selectedObjectRaDeg: Number,
  selectedObjectDecDeg: Number,
});

const emit = defineEmits(['setFramingCoordinates']);
const buttonsEnabled = ref(false);

// Check if in landscape mode
const isLandscape = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth > window.innerHeight;
  }
  return false;
});

// Container positioning classes
const containerClasses = computed(() => ({
  // Portrait mode - centered top
  'top-28 left-1/2 transform -translate-x-1/2 min-w-[300px] max-w-[90vw]': !isLandscape.value,
  // Landscape mode - left side, higher position is ok
  'top-4 left-4 w-80 max-w-[calc(100vw-6rem)]': isLandscape.value,
}));

// Content scrolling classes
const contentClasses = computed(() => ({
  // Portrait mode - account for status bar at bottom
  'max-h-[calc(100vh-8rem)]': !isLandscape.value,
  // Landscape mode - account for status bar and navigation
  'max-h-[calc(100vh-6rem)]': isLandscape.value,
}));

function setFramingCoordinates() {
  // Temporarily disable buttons to prevent multiple taps (especially on iOS)
  buttonsEnabled.value = false;

  // Platform detection for iOS-specific handling
  const isIOS = Capacitor.getPlatform() === 'ios';

  // For iOS, add a small delay to ensure touch events are fully processed
  setTimeout(
    () => {
      emit('setFramingCoordinates', {
        raString: props.selectedObjectRa,
        decString: props.selectedObjectDec,
        ra: props.selectedObjectRaDeg,
        dec: props.selectedObjectDecDeg,
        item: props.selectedObject,
      });

      // Re-enable buttons after a short delay
      setTimeout(
        () => {
          buttonsEnabled.value = true;
        },
        isIOS ? 300 : 100
      );
    },
    isIOS ? 50 : 0
  );
}

onMounted(() => {
  buttonsEnabled.value = false;
  // Platform detection for iOS-specific handling
  const isIOS = Capacitor.getPlatform() === 'ios';
  // Use longer delay for iOS devices to ensure UI is fully rendered
  const delay = isIOS ? 800 : 500;

  setTimeout(() => {
    buttonsEnabled.value = true;
  }, delay);
});
</script>

<style scoped>
.spinner {
  display: inline-block;
  width: 3em;
  height: 3em;
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

/* Custom scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

/* Responsive adjustments */
@media screen and (orientation: landscape) and (max-height: 600px) {
  /* For very short landscape screens */
  .max-h-\[calc\(100vh-6rem\)\] {
    max-height: calc(100vh - 4rem) !important;
  }
}

@media screen and (orientation: portrait) {
  /* Adjust for portrait with status bar */
  .max-h-\[calc\(100vh-8rem\)\] {
    max-height: calc(100vh - 10rem) !important;
  }
}
</style>