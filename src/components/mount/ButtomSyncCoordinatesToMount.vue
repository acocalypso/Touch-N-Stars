<template>
  <div class="flex gap-1">
    <button
      @click="syncCoordinates"
      :disabled="
        framingStore.isSlewing ||
        framingStore.isSlewingAndCentering ||
        framingStore.isRotating ||
        store.mountInfo.AtPark ||
        props.disabled
      "
      :class="['default-button-cyan', statusClass]"
    >
      <span
        v-if="isLoading"
        class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
      ></span>
      <p v-else>{{ $t('components.mount.control.sync_coordinates_to_mount') }}</p>
    </button>
  </div>
</template>

<script setup>
import { defineProps, ref } from 'vue';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useI18n } from 'vue-i18n';
import apiService from '@/services/apiService';
import { wait } from '@/utils/utils';

const store = apiStore();
const framingStore = useFramingStore();
const { t } = useI18n();
const statusClass = ref('');
const isLoading = ref(false);

const props = defineProps({
  raAngle: Number,
  decAngle: Number,
  label: String,
  disabled: Boolean,
});

async function setTrackingMode() {
  if (!store.mountInfo.TrackingEnabled) {
    try {
      const response = await apiService.setTrackingMode(0);
      await wait(1000);
      if (!response.Success) return;
    } catch (error) {
      console.log(t('components.mount.control.errors.unpark'));
    }
  }
}

async function syncCoordinates() {
  //Montierung muss im Tracking mode sein
  isLoading.value = true;
  await setTrackingMode();
  try {
    const response = await apiService.mountAction(`sync?ra=${props.raAngle}&dec=${props.decAngle}`);
    console.log(response);
    statusClass.value = 'glow-green';
  } catch (error) {
    console.log('Error when setting the coordinates');
    statusClass.value = 'glow-red';
  }
  isLoading.value = false;
  setTimeout(() => {
    statusClass.value = '';
  }, 1000);
}
</script>

<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00; /* Grüner Schein */
}
.glow-red {
  box-shadow: 0 0 10px rgb(255, 0, 0); /* Roter Schein */
}
</style>
