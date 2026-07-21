<template>
  <div>
    <button @click="setSequenceTarget" class="tns-btn-secondary">
      <span>{{ $t('components.framing.setSequnceTarget') }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import apiService from '@/services/apiService';
import { useFramingStore } from '@/store/framingStore';
import { useSequenceStore } from '@/store/sequenceStore';
import { useToastStore } from '@/store/toastStore';
import { degreesToHMS, degreesToDMS } from '@/utils/utils';
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

const hasSequenceLoaded = computed(
  () =>
    sequenceStore.sequenceIsLoaded &&
    Array.isArray(sequenceStore.sequenceInfo) &&
    sequenceStore.sequenceInfo.length > 0
);

function buildCoordinateName(ra, dec) {
  return `RA ${degreesToHMS(ra)} Dec ${degreesToDMS(dec)}`;
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

  const name =
    framingStore.selectedItem?.Name ||
    props.name ||
    buildCoordinateName(framingStore.RAangle, framingStore.DECangle);
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
</script>
