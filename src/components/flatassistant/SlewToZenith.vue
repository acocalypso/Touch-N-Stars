<template>
  <div class="flex w-full items-center gap-2 p-4">
    <select
      v-model="settingsStore.flats.altitudeSite"
      class="w-28 border border-gray-500 rounded-lg bg-gray-800 p-2 text-white"
    >
      <option value="EAST">{{ $t('components.tppa.east') }}</option>
      <option value="WEST">{{ $t('components.tppa.west') }}</option>
    </select>

    <ButtonSlew
      class="w-full"
      :label="t('components.flatassistant.button_slew_to_zenith')"
      :raAngle="computedRa"
      :decAngle="computedDec"
      @finished="stopTracking"
    />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import ButtonSlew from '@/components/mount/ButtonSlew.vue';
import apiService from '@/services/apiService';
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import { altAzToRaDec } from '@/utils/utils';
import { useI18n } from 'vue-i18n';

const settingsStore = useSettingsStore();
const store = apiStore();
const { t } = useI18n();

const ALTITUDE_SITE = {
  EAST: 'EAST',
  WEST: 'WEST',
};

const zenithAzimuth = computed(() =>
  settingsStore.flats.altitudeSite === ALTITUDE_SITE.WEST ? 90 : 270
);

const computedRa = computed(() => {
  const { ra } = altAzToRaDec(
    89,
    zenithAzimuth.value,
    store.profileInfo.AstrometrySettings.Latitude,
    store.profileInfo.AstrometrySettings.Longitude
  );
  return ra;
});

const computedDec = computed(() => {
  const { dec } = altAzToRaDec(
    89,
    zenithAzimuth.value,
    store.profileInfo.AstrometrySettings.Latitude,
    store.profileInfo.AstrometrySettings.Longitude
  );
  return dec;
});

async function stopTracking() {
  try {
    await apiService.setTrackingMode(4);
  } catch (error) {
    console.error('Error stopping tracking after slew to zenith:', error);
  }
}

onMounted(() => {
  if (!settingsStore.flats.altitudeSite) {
    settingsStore.flats.altitudeSite = ALTITUDE_SITE.EAST;
  }
});
</script>
