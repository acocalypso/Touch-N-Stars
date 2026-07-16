<template>
  <div
    v-if="selectedObject"
    :class="containerClasses"
    :aria-busy="!buttonsEnabled"
    class="absolute bg-black/90 backdrop-blur-sm text-gray-300 p-4 rounded-lg shadow-lg border border-gray-600 z-50"
  >
    <!-- Overlay mit Spinner um eine versehntliches drücken der Button zu verhindern -->
    <div
      v-if="!buttonsEnabled"
      class="absolute inset-0 z-50 bg-black/50 flex items-center justify-center rounded-lg"
      role="status"
    >
      <span class="spinner"></span>
      <span class="sr-only">{{ $t('common.loading') }}</span>
    </div>

    <!-- Scrollable Content -->
    <div :class="contentClasses" class="overflow-y-auto">
      <div class="flex items-start justify-between gap-3">
        <h3 class="text-lg font-semibold">
          {{ $t('components.stellarium.selected_object.title') }}:
        </h3>
        <button
          v-if="dismissible"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded text-gray-300 hover:bg-gray-700 hover:text-white"
          type="button"
          :aria-label="$t('common.close')"
          :title="$t('common.close')"
          @click="emit('dismiss')"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <ul class="mt-2">
        <li v-for="(name, index) in selectedObject" :key="index" class="text-sm">
          {{ name }}
        </li>
      </ul>

      <p class="mt-2 text-sm">
        {{ $t('components.stellarium.selected_object.ra') }}: {{ selectedObjectRa || '—' }}
      </p>
      <p class="text-sm">
        {{ $t('components.stellarium.selected_object.dec') }}: {{ selectedObjectDec || '—' }}
      </p>

      <fieldset
        :disabled="!actionControlsEnabled"
        class="flex min-w-0 flex-col gap-2 border-0 p-0 mt-2 disabled:opacity-50"
      >
        <SaveFavTargets
          :name="selectedObject[0]"
          :ra="selectedObjectRaDeg"
          :dec="selectedObjectDecDeg"
          :ra-string="selectedObjectRa"
          :dec-string="selectedObjectDec"
          :show-label="true"
          :disabled="!actionControlsEnabled"
        />

        <button class="default-button-cyan w-full" @click="openFramingModal">
          {{ $t('components.framing.openFraminingModal') }}
        </button>

        <setSequenceTarget
          class="w-full"
          :raAngle="props.selectedObjectRaDeg"
          :decAngle="props.selectedObjectDecDeg"
          :name="props.selectedObject[0]"
        />

        <ButtonSlewCenterRotate
          :raAngle="props.selectedObjectRaDeg"
          :decAngle="props.selectedObjectDecDeg"
          :disabled="!store.mountInfo.Connected || store.sequenceRunning"
        />

        <ButtomSyncCoordinatesToMount
          :raAngle="props.selectedObjectRaDeg"
          :decAngle="props.selectedObjectDecDeg"
          :disabled="!store.mountInfo.Connected || store.sequenceRunning"
        />
      </fieldset>
      <div class="pb-10"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiStore } from '@/store/store';
import { Capacitor } from '@capacitor/core';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import ButtonSlewCenterRotate from '@/components/mount/ButtonSlewCenterRotate.vue';
import SaveFavTargets from '@/components/favTargets/SaveFavTargets.vue';
import ButtomSyncCoordinatesToMount from '@/components/mount/ButtomSyncCoordinatesToMount.vue';
import setSequenceTarget from '../framing/setSequenceTarget.vue';
import { useOrientation } from '@/composables/useOrientation';
import { useFramingStore } from '@/store/framingStore';

const store = apiStore();
const framingStore = useFramingStore();
const router = useRouter();

function openFramingModal() {
  if (!hasValidCoordinates.value) return;
  framingStore.RAangle = props.selectedObjectRaDeg;
  framingStore.DECangle = props.selectedObjectDecDeg;
  framingStore.RAangleString = props.selectedObjectRa;
  framingStore.DECangleString = props.selectedObjectDec;
  framingStore.selectedItem = {
    ...(props.commandTarget ?? {}),
    Name: props.commandTarget?.Name ?? props.selectedObject?.[0] ?? '',
    RA: props.selectedObjectRaDeg,
    Dec: props.selectedObjectDecDeg,
  };
  router.push('/framing');
}
const props = defineProps({
  selectedObject: Array,
  selectedObjectRa: String,
  selectedObjectDec: String,
  selectedObjectRaDeg: Number,
  selectedObjectDecDeg: Number,
  commandTarget: {
    type: Object,
    default: null,
  },
  dismissible: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['dismiss']);

const buttonsEnabled = ref(false);
let enableButtonsTimer = null;
const hasValidCoordinates = computed(
  () =>
    Number.isFinite(props.selectedObjectRaDeg) &&
    props.selectedObjectRaDeg >= 0 &&
    props.selectedObjectRaDeg < 360 &&
    Number.isFinite(props.selectedObjectDecDeg) &&
    props.selectedObjectDecDeg >= -90 &&
    props.selectedObjectDecDeg <= 90
);
const actionControlsEnabled = computed(() => buttonsEnabled.value && hasValidCoordinates.value);

// Check if in landscape mode
const { isLandscape } = useOrientation();

const containerClasses = computed(() => ({
  'selected-object-portrait': !isLandscape.value,
  'selected-object-landscape': isLandscape.value,
}));

const contentClasses = computed(() => ({
  'selected-object-content-portrait': !isLandscape.value,
  'selected-object-content-landscape': isLandscape.value,
}));

onMounted(() => {
  buttonsEnabled.value = false;
  // Platform detection for iOS-specific handling
  const isIOS = Capacitor.getPlatform() === 'ios';
  // Use longer delay for iOS devices to ensure UI is fully rendered
  const delay = isIOS ? 800 : 500;

  enableButtonsTimer = setTimeout(() => {
    buttonsEnabled.value = true;
  }, delay);
});

onBeforeUnmount(() => {
  if (enableButtonsTimer !== null) clearTimeout(enableButtonsTimer);
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

.selected-object-portrait {
  top: calc(7rem + env(safe-area-inset-top, 0px));
  left: 50%;
  width: min(
    22rem,
    calc(100% - 2rem - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))
  );
  min-width: min(18.75rem, calc(100% - 2rem));
  transform: translateX(-50%);
}

.selected-object-landscape {
  top: calc(1rem + env(safe-area-inset-top, 0px));
  left: calc(1rem + env(safe-area-inset-left, 0px));
  width: min(
    20rem,
    calc(100% - 2rem - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))
  );
}

.selected-object-content-portrait {
  max-height: calc(
    100dvh - 11rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
  );
}

.selected-object-content-landscape {
  max-height: calc(
    100dvh - 5rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
  );
}

@media screen and (orientation: landscape) and (max-width: 1024px) {
  .selected-object-landscape {
    top: calc(4.5rem + env(safe-area-inset-top, 0px));
  }

  .selected-object-content-landscape {
    max-height: calc(
      100dvh - 8rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
    );
  }
}
</style>
