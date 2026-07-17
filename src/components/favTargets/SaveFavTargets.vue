<template>
  <div :class="{ 'w-full': showLabel }">
    <button
      @click="showModal = true"
      class="tns-btn-primary"
      :class="{ 'w-full gap-2': showLabel }"
    >
      <HeartIcon class="w-7 h-7 shrink-0" />
      <span v-if="showLabel">{{ t('components.fav_target.save_to_favorites') }}</span>
    </button>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        class="bg-gray-800 text-gray-300 p-4 m-8 rounded-lg max-w-xl max-h-[80vh] min-h-48 min-w-72 overflow-y-auto"
      >
        <h3 class="text-lg font-semibold mb-4">
          {{ t('components.fav_target.enter_name') }}
        </h3>
        <input v-model="nameInput" type="text" class="w-full h-10 tns-input" />
        <p v-if="isMosaic" class="text-xs text-gray-400 mt-2">
          {{ mosaicCols * mosaicRows }} {{ t('components.framing.mosaic.panels') }}
          {{ t('components.framing.mosaic.willBeSaved') }}
        </p>
        <div class="flex justify-end mt-4 space-x-2">
          <button @click="confirmSave" class="tns-btn-primary">
            {{ t('common.confirm') }}
          </button>
          <button @click="showModal = false" class="tns-btn-danger">
            {{ t('common.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useFavTargetStore } from '@/store/favTargetsStore';
import { HeartIcon } from '@heroicons/vue/24/outline';
import { useI18n } from 'vue-i18n';
import { degreesToHMS, degreesToDMS } from '@/utils/utils';
import { useFramingStore } from '@/store/framingStore';

const favTargetsStore = useFavTargetStore();
const { t } = useI18n();

const props = defineProps({
  name: { type: String, default: 'Unknown' },
  ra: Number,
  dec: Number,
  raString: String,
  decString: String,
  rotation: { type: Number, default: 0 },
  mosaicCols: { type: Number, default: null },
  mosaicRows: { type: Number, default: null },
  mosaicOverlap: { type: Number, default: null },
  mosaicPreserveAlignment: { type: Boolean, default: null },
  showLabel: { type: Boolean, default: false },
});

const showModal = ref(false);
const nameInput = ref(props.name);

watch(showModal, (isOpen) => {
  if (isOpen) nameInput.value = props.name;
});

const isMosaic = computed(() => props.mosaicCols > 1 || props.mosaicRows > 1);

function computePanels() {
  const overlap = props.mosaicOverlap / 100;
  const cols = props.mosaicCols;
  const rows = props.mosaicRows;
  const centerRA = props.ra;
  const centerDec = props.dec;
  const centerRot = props.rotation;

  const framingStore = useFramingStore();
  const scale = framingStore.fov / framingStore.containerWidth;
  const fovX = framingStore.camWidth * scale;
  const fovY = framingStore.camHeight * scale;

  const stepRa = fovX * (1 - overlap);
  const stepDec = fovY * (1 - overlap);
  let cosDec = Math.cos((centerDec * Math.PI) / 180);
  if (Math.abs(cosDec) < 1e-8) cosDec = 1e-8;

  const theta = (centerRot * Math.PI) / 180;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  const panels = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dc = col - (cols - 1) / 2;
      const dr = row - (rows - 1) / 2;
      const rawX = dc * stepRa;
      const rawY = dr * stepDec;
      // Im Uhrzeigersinn rotieren, passend zur visuellen Kamera-Rotation in
      // FramingAssitantImg (SVG rotiert clockwise um rotationAngleVisu).
      const rotX = rawX * cosT + rawY * sinT;
      const rotY = -rawX * sinT + rawY * cosT;
      const panelRA = centerRA - rotX / cosDec;
      const panelDec = centerDec - rotY;
      const panelRot = centerRot;
      panels.push({
        label: `${col + 1}-${row + 1}`,
        ra: panelRA,
        dec: panelDec,
        rotation: panelRot,
      });
    }
  }
  return panels;
}

async function confirmSave() {
  if (!nameInput.value.trim()) return;
  const baseName = nameInput.value.trim();

  if (isMosaic.value) {
    // Panel-Koordinaten kommen aus dem Store (von FramingAssitantImg aus den
    // tatsächlich gerenderten Pixelpositionen berechnet) und stimmen damit exakt
    // mit dem Overlay überein. Fallback auf lokale Berechnung, falls leer.
    const framingStore = useFramingStore();
    const panels =
      framingStore.mosaicPanelCoords.length > 0 ? framingStore.mosaicPanelCoords : computePanels();
    for (const p of panels) {
      await favTargetsStore.addFavorite({
        Name: `${baseName} Panel ${p.label}`,
        Ra: p.ra,
        Dec: p.dec,
        RaString: degreesToHMS(p.ra),
        DecString: degreesToDMS(p.dec),
        Rotation: p.rotation,
      });
    }
  } else {
    console.log('Saving favorite target rotation:', props.rotation);
    await favTargetsStore.addFavorite({
      Name: baseName,
      Ra: props.ra,
      Dec: props.dec,
      RaString: props.raString,
      DecString: props.decString,
      Rotation: props.rotation,
    });
  }

  showModal.value = false;
}
</script>
