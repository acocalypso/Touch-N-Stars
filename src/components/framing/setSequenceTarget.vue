<template>
  <div>
    <button @click="setSequenceTarget" :disabled="!hasTargetSelected" class="default-button-cyan">
      {{ $t('components.framing.setSequnceTarget') }}
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
  const ra = framingStore.RAangle;
  const dec = framingStore.DECangle;
  const rotation = framingStore.rotationAngle;
  const index = 0;

  console.log('Name:', name, 'RA:', ra, 'Dec:', dec, 'Rotation:', rotation);

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
    await apiService.sequnceTargetSet(name, ra, dec, rotation, index);
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
