<template>
  <button
    v-if="store.mountInfo.CanPark"
    @click="mountPark"
    :class="['tns-btn-danger', statusClass]"
  >
    {{ $t('components.mount.control.park') }}
  </button>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';
import { useHaptics } from '@/composables/useHaptics';

const { t } = useI18n();
const store = apiStore();
const toastStore = useToastStore();
const { tapMedium, notifySuccess, notifyError } = useHaptics();
const statusClass = ref('');

async function mountPark() {
  tapMedium();

  // Parking stops tracking and drives the mount away from the target, so it must
  // not be triggerable by a single stray tap in the dark.
  const confirmed = await toastStore.showConfirmation(
    t('components.mount.control.confirmParkTitle'),
    t('components.mount.control.confirmParkMessage'),
    t('components.mount.control.park'),
    t('common.cancel')
  );
  if (!confirmed) return;

  try {
    const response = await apiService.mountAction('park');
    console.log('park', response);
    if (!response.Success) return;

    // Button grün leuchten lassen
    statusClass.value = 'glow-green';
    notifySuccess();
  } catch (error) {
    console.log('Error park', error);

    // Button rot leuchten lassen
    statusClass.value = 'glow-red';
    notifyError();
  }

  // Nach 1 Sekunde den Effekt entfernen
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
