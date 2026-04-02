<template>
  <div>
    <button @click="setSequenceTarget" :disabled="!hasTargetSelected" class="default-button-cyan">
      <span v-if="framingStore.isMosaicMode">
        {{ $t('components.framing.mosaic.setMosaicTargets') }}
        ({{ framingStore.mosaicCols * framingStore.mosaicRows }})
      </span>
      <span v-else>{{ $t('components.framing.setSequnceTarget') }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import apiService from '@/services/apiService';
import { useFramingStore } from '@/store/framingStore';
import { useSequenceStore } from '@/store/sequenceStore';
import { useToastStore } from '@/store/toastStore';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  raAngle: Number,
  decAngle: Number,
  name: String,
});

const framingStore = useFramingStore();
const sequenceStore = useSequenceStore();
const toastStore = useToastStore();
const { t } = useI18n();

const hasTargetSelected = computed(() => {
  // Wenn Props übergeben wurden (z.B. von Stellarium), ist ein Target vorhanden
  if (props.raAngle !== undefined && props.decAngle !== undefined && props.name) {
    return true;
  }
  // Ansonsten prüfen, ob im framingStore ein Target ausgewählt ist
  return !!framingStore.selectedItem;
});
const hasSequenceLoaded = computed(
  () =>
    sequenceStore.sequenceIsLoaded &&
    Array.isArray(sequenceStore.sequenceInfo) &&
    sequenceStore.sequenceInfo.length > 0
);

function calculatePositionAngle(ra1Deg, ra2Deg, dec1Deg, dec2Deg) {
  const toRad = (d) => (d * Math.PI) / 180;
  const num = Math.sin(toRad(ra1Deg - ra2Deg));
  const den =
    Math.cos(toRad(dec2Deg)) * Math.tan(toRad(dec1Deg)) -
    Math.sin(toRad(dec2Deg)) * Math.cos(toRad(ra1Deg - ra2Deg));
  return Math.atan2(num, den) * (180 / Math.PI);
}

function computeMosaicPanels() {
  const store = framingStore;
  const overlap = store.mosaicOverlap / 100;
  const scale = store.fov / store.containerSize;
  const fovX = store.camWidth * scale;
  const fovY = store.camHeight * scale;
  const stepRa = fovX * (1 - overlap);
  const stepDec = fovY * (1 - overlap);
  let cosDec = Math.cos((store.DECangle * Math.PI) / 180);
  if (Math.abs(cosDec) < 1e-8) cosDec = 1e-8;

  const centerRA = store.RAangle;
  const centerDec = store.DECangle;
  const centerRot = store.rotationAngle;
  const panels = [];

  for (let row = 0; row < store.mosaicRows; row++) {
    for (let col = 0; col < store.mosaicCols; col++) {
      const dc = col - (store.mosaicCols - 1) / 2;
      const dr = row - (store.mosaicRows - 1) / 2;
      const panelRA = centerRA - (dc * stepRa) / cosDec;
      const panelDec = centerDec - dr * stepDec;
      let panelRot = centerRot;
      if (store.mosaicPreserveAlignment && (dc !== 0 || dr !== 0)) {
        const pa = calculatePositionAngle(centerRA, panelRA, centerDec, panelDec);
        panelRot = (centerRot + pa + 360) % 360;
      }
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

async function setSequenceTarget() {
  console.log('Setting sequence target');

  // Wenn Props übergeben wurden, diese in den framingStore schreiben
  if (props.raAngle !== undefined && props.decAngle !== undefined) {
    framingStore.RAangle = props.raAngle;
    framingStore.DECangle = props.decAngle;

    // Wenn ein Name übergeben wurde, ein selectedItem-Objekt erstellen
    if (props.name) {
      framingStore.selectedItem = { Name: props.name };
    }
  }

  if (!framingStore.selectedItem) {
    console.error('No target selected');
    return;
  }

  const name = framingStore.selectedItem.Name;
  const rotation = framingStore.rotationAngle;

  console.log(
    'Name:',
    name,
    'RA:',
    framingStore.RAangle,
    'Dec:',
    framingStore.DECangle,
    'Rotation:',
    rotation
  );

  if (!hasSequenceLoaded.value) {
    console.error('No sequence loaded');
    toastStore.showToast({
      type: 'error',
      title: t('components.fav_target.modal_sequence.titel'),
      message: t('components.fav_target.modal_sequence_error.message'),
    });
    return;
  }

  if (framingStore.isMosaicMode) {
    const panels = computeMosaicPanels();
    for (let i = 0; i < panels.length; i++) {
      const p = panels[i];
      try {
        await apiService.sequnceTargetSet(`${name} Panel ${p.label}`, p.ra, p.dec, p.rotation, i);
      } catch (error) {
        console.error(`Error setting panel ${p.label}:`, error);
        toastStore.showToast({
          type: 'error',
          title: t('components.fav_target.modal_sequence.titel'),
          message:
            error?.response?.data?.Message ||
            t('components.fav_target.modal_sequence_error.message'),
        });
        return;
      }
    }
    toastStore.showToast({
      type: 'success',
      title: t('components.fav_target.modal_sequence.titel'),
      message: `${panels.length} ${t('components.framing.mosaic.panelsSet')}`,
    });
  } else {
    try {
      await apiService.sequnceTargetSet(
        name,
        framingStore.RAangle,
        framingStore.DECangle,
        rotation,
        0
      );
      toastStore.showToast({
        type: 'success',
        title: t('components.fav_target.modal_sequence.titel'),
        message: t('components.fav_target.modal_sequence_ok.message'),
      });
    } catch (error) {
      console.error('Error setting sequence target:', error);
      toastStore.showToast({
        type: 'error',
        title: t('components.fav_target.modal_sequence.titel'),
        message:
          error?.response?.data?.Message || t('components.fav_target.modal_sequence_error.message'),
      });
    }
  }
}
</script>
