<template>
  <button
    @click="slewAndCenter"
    :disabled="
      framingStore.isSlewing ||
      framingStore.isSlewingAndCentering ||
      framingStore.isRotating ||
      props.disabled
    "
    class="default-button-cyan"
  >
    <span v-if="framingStore.isSlewingAndCentering" class="loader mr-2"></span>
    {{ $t('components.slewAndCenter.slew_and_center') }}
  </button>
  <CenterModal ref="centeringModalRef" />
</template>

<script setup>
import { defineProps, ref, defineEmits } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useI18n } from 'vue-i18n';
import { wait } from '@/utils/utils';
import CenterModal from '@/components/mount/CenterModal.vue';

const centeringModalRef = ref(null);
const store = apiStore();
const framingStore = useFramingStore();
const { t } = useI18n();

const props = defineProps({
  raAngle: Number,
  decAngle: Number,
  disabled: Boolean,
});
const emit = defineEmits(['finished']);

async function unparkMount() {
  if (store.mountInfo.AtPark) {
    try {
      await apiService.mountAction('unpark');
      await wait(2000);
      console.log(t('components.mount.control.unpark'));
    } catch (error) {
      console.log(t('components.mount.control.errors.unpark'));
    }
  }
}

async function slewAndCenter() {
  centeringModalRef.value?.openModal();
  await unparkMount(); // Überprüfen und Entparken, falls erforderlich
  console.log('slew');
  await framingStore.slew(props.raAngle, props.decAngle);
  if (framingStore.slewIsStopt) return;
  console.log('slewAndCenter');
  await framingStore.slewAndCenter(props.raAngle, props.decAngle);
  emit('finished'); // Emit Event nach Erfolg
}
</script>

<style scoped>
.loader {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
