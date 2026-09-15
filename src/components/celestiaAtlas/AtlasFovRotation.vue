<template>
  <div :class="positionClasses" class="absolute z-30 flex flex-col items-end gap-2">
    <template v-if="fovAvailable">
      <button
        v-if="!expanded"
        @click="open"
        class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
        :title="$t('components.framing.fovSettings.rotationAngle')"
      >
        <CameraFramingIcon class="w-7 h-7 text-cyan-300" camera-class="text-white" />
      </button>
      <div
        v-else
        class="flex flex-col gap-2 bg-black/90 border border-cyan-600 rounded-lg p-3 shadow-md w-80 max-h-[calc(100dvh-14rem)] overflow-y-auto"
      >
        <div class="flex justify-between items-start gap-2">
          <NumberInputPicker
            v-model="rotationModel"
            :label="$t('components.framing.fovSettings.rotationAngle')"
            labelKey="components.framing.fovSettings.rotationAngle"
            :min="0"
            :max="360"
            :step="1"
            :decimalPlaces="1"
            inputId="atlas-fov-rotation"
            wrapperClass="w-full"
          />
          <div class="flex items-center gap-1 shrink-0">
            <button
              v-if="!rotationOnly"
              @click="mosaicSettingsOpen = !mosaicSettingsOpen"
              class="p-1 hover:text-white"
              :class="framingStore.isMosaicMode ? 'text-cyan-400' : 'text-gray-300'"
              :title="$t('components.framing.mosaic.title')"
            >
              <Squares2X2Icon class="w-5 h-5" />
            </button>
            <button
              @click="rotationOnly = !rotationOnly"
              class="p-1 text-gray-300 hover:text-white"
              :title="rotationOnly ? $t('common.expand') : $t('common.collapse')"
            >
              <ChevronUpIcon v-if="!rotationOnly" class="w-5 h-5" />
              <ChevronDownIcon v-else class="w-5 h-5" />
            </button>
            <button
              @click="expanded = false"
              class="p-1 text-gray-300 hover:text-white"
              :title="$t('common.close')"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
        </div>

        <template v-if="!rotationOnly">
          <getImageRotation />

          <MosaicControls v-show="mosaicSettingsOpen" :show-nina-cache="false" />

          <div class="text-xs font-mono text-gray-400 leading-tight">
            <div>RA: {{ raString || '—' }}</div>
            <div>Dec: {{ decString || '—' }}</div>
          </div>

          <input
            v-model="targetName"
            type="text"
            :placeholder="$t('components.celestiaAtlas.camera_panel.target_name_placeholder')"
            class="tns-input"
          />

          <fieldset
            :disabled="!hasValidCoordinates"
            class="flex flex-col gap-2"
            :class="{ 'opacity-50': !hasValidCoordinates }"
          >
            <ButtonSlewCenterRotate
              :raAngle="raDeg"
              :decAngle="decDeg"
              :disabled="!hasMount || !hasValidCoordinates"
            />

            <setSequenceTarget
              v-if="!framingStore.isMosaicMode"
              class="w-full"
              :raAngle="raDeg"
              :decAngle="decDeg"
              :name="effectiveTargetName"
            />

            <SaveFavTargets
              :name="effectiveTargetName"
              :ra="raDeg"
              :dec="decDeg"
              :ra-string="raString"
              :dec-string="decString"
              :rotation="rotationModel"
              :mosaic-cols="framingStore.isMosaicMode ? framingStore.mosaicCols : null"
              :mosaic-rows="framingStore.isMosaicMode ? framingStore.mosaicRows : null"
              :mosaic-overlap="framingStore.isMosaicMode ? framingStore.mosaicOverlap : null"
              :mosaic-preserve-alignment="
                framingStore.isMosaicMode ? framingStore.mosaicPreserveAlignment : null
              "
              :panels="mosaicPanels"
              :disabled="framingStore.isMosaicMode && !mosaicPanels"
              :show-label="true"
            />
          </fieldset>
        </template>
      </div>
    </template>
    <div
      v-else-if="missingEquipmentSettings"
      role="status"
      class="w-80 max-w-[calc(100vw-2rem)] bg-yellow-900/90 border border-yellow-600 text-yellow-100 text-sm rounded-lg shadow-lg p-3 flex items-start gap-2"
    >
      <ExclamationTriangleIcon class="w-5 h-5 shrink-0 text-yellow-300 mt-0.5" />
      <span>{{ $t('components.framing.missingEquipmentSettings') }}</span>
    </div>

    <div class="flex gap-2">
      <FavTargets :showFramning="true" :showSeqTarget="false" :showBadgeLabel="true" />
      <FitsPlateSolve
        v-if="fitsPlateSolveAvailable"
        :showFraming="false"
        :showSeqTarget="false"
        :showBadgeLabel="true"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import {
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline';
import CameraFramingIcon from '@/components/icons/CameraFramingIcon.vue';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useOrientation } from '@/composables/useOrientation';
import { degreesToHMS, degreesToDMS } from '@/utils/utils';
import { toNinaJ2000Coordinates } from '@/integrations/celestiaAtlas/contracts';
import { computeMosaicPanelCenters } from '@/integrations/celestiaAtlas/mosaicPanels';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import ButtonSlewCenterRotate from '@/components/mount/ButtonSlewCenterRotate.vue';
import setSequenceTarget from '@/components/framing/setSequenceTarget.vue';
import SaveFavTargets from '@/components/favTargets/SaveFavTargets.vue';
import FavTargets from '@/components/favTargets/FavTargets.vue';
import FitsPlateSolve from '@/components/fitsPlatesolve/FitsPlateSolve.vue';
import getImageRotation from '@/components/framing/getImageRotation.vue';
import MosaicControls from '@/components/framing/MosaicControls.vue';

const props = defineProps({
  getViewCenter: {
    type: Function,
    default: null,
  },
  defaultTargetName: {
    type: String,
    default: 'Celestia Atlas view',
  },
  active: {
    type: Boolean,
    default: true,
  },
  // False while no camera FOV can be drawn (camera disconnected or profile
  // incomplete); favourites and FITS solve stay reachable regardless.
  fovAvailable: {
    type: Boolean,
    default: true,
  },
  // CameraFieldOfView from the profile (widthDeg/heightDeg), used for the
  // mosaic panel centres. Null when unknown.
  cameraFov: {
    type: Object,
    default: null,
  },
  missingEquipmentSettings: {
    type: Boolean,
    default: false,
  },
});

const store = apiStore();
const framingStore = useFramingStore();
const { isLandscape } = useOrientation();

const expanded = ref(false);
const rotationOnly = ref(false);
const mosaicSettingsOpen = ref(false);
const raDeg = ref(null);
const decDeg = ref(null);
const raString = ref('');
const decString = ref('');
const hasValidCoordinates = ref(false);
const targetName = ref('');
let rafId = null;
let lastViewSampleAt = 0;
const VIEW_SAMPLE_INTERVAL_MS = 100;

const rotationModel = computed({
  get: () => Number(framingStore.rotationAngle ?? 0),
  set: (value) => {
    framingStore.rotationAngle = Number(value);
  },
});

const hasMount = computed(() => store.mountInfo.Connected && !store.sequenceRunning);

// Same gate as FramingPage.vue: the FITS endpoints need PINS or plugin >= 1.2.7.0.
const fitsPlateSolveAvailable = computed(
  () => store.isPINS || store.checkVersionNewerOrEqual(store.currentTnsPluginVersion, '1.2.7.0')
);

// Panel centres follow the sampled view centre while the panel is open. Null
// disables saving so SaveFavTargets never falls back to the framing page's
// stale framingStore.mosaicPanelCoords.
const mosaicPanels = computed(() => {
  if (!framingStore.isMosaicMode || !props.cameraFov || !hasValidCoordinates.value) return null;
  return computeMosaicPanelCenters({
    centerRaDeg: raDeg.value,
    centerDecDeg: decDeg.value,
    positionAngleDeg: rotationModel.value,
    fovWidthDeg: props.cameraFov.widthDeg,
    fovHeightDeg: props.cameraFov.heightDeg,
    columns: Number(framingStore.mosaicCols),
    rows: Number(framingStore.mosaicRows),
    overlapPercent: Number(framingStore.mosaicOverlap),
  });
});

const effectiveTargetName = computed(() => {
  if (targetName.value && targetName.value.trim() !== '') return targetName.value.trim();
  if (raString.value && decString.value) return `${raString.value} ${decString.value}`;
  return props.defaultTargetName;
});

function sampleView() {
  if (!props.getViewCenter) {
    invalidateCoordinates();
    return;
  }
  try {
    setCommandCoordinates(props.getViewCenter());
  } catch {
    invalidateCoordinates();
  }
}

function setCommandCoordinates(value) {
  try {
    const coordinates = toNinaJ2000Coordinates(value ?? {});
    raDeg.value = coordinates.raDeg;
    decDeg.value = coordinates.decDeg;
    raString.value = degreesToHMS(coordinates.raDeg);
    decString.value = degreesToDMS(coordinates.decDeg);
    hasValidCoordinates.value = true;
  } catch {
    invalidateCoordinates();
  }
}

function invalidateCoordinates() {
  raDeg.value = null;
  decDeg.value = null;
  raString.value = '';
  decString.value = '';
  hasValidCoordinates.value = false;
}

function loop(timestamp) {
  if (timestamp - lastViewSampleAt >= VIEW_SAMPLE_INTERVAL_MS) {
    sampleView();
    lastViewSampleAt = timestamp;
  }
  rafId = requestAnimationFrame(loop);
}

function open() {
  sampleView();
  // Show the mosaic settings right away when a mosaic is already active.
  mosaicSettingsOpen.value = Boolean(framingStore.isMosaicMode);
  expanded.value = true;
}

watch([expanded, () => props.active], ([isExpanded, isActive]) => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (isExpanded && isActive) {
    lastViewSampleAt = 0;
    rafId = requestAnimationFrame(loop);
  }
});

onBeforeUnmount(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
});

const positionClasses = computed(() => ({
  'top-40 right-3': !isLandscape.value,
  'top-16 right-6': isLandscape.value,
}));
</script>
