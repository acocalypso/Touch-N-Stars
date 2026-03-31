<template>
  <div
    class="flex flex-col w-full max-w-md space-y-2 mt-4 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
  >
    <setCount />
    <setGain />
    <setOffset />
    <setMinExposureTime />
    <setMaxExposureTime />
    <setHistogramMeanTarget />
    <setHistogramTolerance />
    <selectFilters v-if="store.filterInfo.Connected" v-model="selectedFilters" />
    <setBinning v-if="(store.cameraInfo?.BinningModes?.length || 0) > 1" />
    <div class="flex items-center justify-between">
      <span class="text-sm text-gray-300">{{ $t('components.flatassistant.keep_closed') }}</span>
      <toggleButton
        :statusValue="settingsStore.flats.keepClosed"
        @update:statusValue="settingsStore.flats.keepClosed = $event"
      />
    </div>
    <div v-show="flatsStore.status.State != 'Running'">
      <button @click="startAutoExposure" class="default-button-cyan">
        {{ $t('components.flatassistant.start_sky_flat') }}
      </button>
    </div>
    <div v-show="flatsStore.status.State == 'Running'">
      <button @click="stopFlats" class="default-button-red">
        {{ $t('components.flatassistant.stop') }}
      </button>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useFlatassistantStore } from '@/store/flatassistantStore';
import { useCameraStore } from '@/store/cameraStore';
import { useSettingsStore } from '@/store/settingsStore';
import setBinning from '@/components/flatassistant/setBinning.vue';
import setGain from '@/components/flatassistant/setGain.vue';
import setOffset from './setOffset.vue';
import setCount from '@/components/flatassistant/setCount.vue';
import setMinExposureTime from '@/components/flatassistant/setMinExposureTime.vue';
import setMaxExposureTime from '@/components/flatassistant/setMaxExposureTime.vue';
import setHistogramMeanTarget from '@/components/flatassistant/setHistogramMeanTarget.vue';
import setHistogramTolerance from '@/components/flatassistant/setHistogramTolerance.vue';
import selectFilters from '@/components/flatassistant/selectFilters.vue';
import toggleButton from '@/components/helpers/toggleButton.vue';

const store = apiStore();
const flatsStore = useFlatassistantStore();
const cameraStore = useCameraStore();
const settingsStore = useSettingsStore();

const selectedFilters = ref([]);

onMounted(() => {
  flatsStore.binning = cameraStore.binningMode;
  flatsStore.gain = cameraStore.gain;
  flatsStore.offset = cameraStore.offset;
  const current = store.filterInfo?.SelectedFilter;
  if (current) selectedFilters.value = [{ id: current.Id, name: current.Name }];
});

async function startAutoExposure() {
  const filters =
    store.filterInfo.Connected && selectedFilters.value.length > 0
      ? selectedFilters.value
      : [{ id: null, name: null }];
  try {
    await flatsStore.startFilterQueue(filters, async (filterId) => {
      await apiService.flatSkyflat(
        flatsStore.count,
        flatsStore.minExposureTime,
        flatsStore.maxExposureTime,
        flatsStore.histogramMean,
        flatsStore.meanTolerance,
        flatsStore.binning,
        flatsStore.gain,
        flatsStore.offset,
        filterId,
        settingsStore.flats.keepClosed
      );
    });
  } catch (error) {
    console.error('Error starting sky flat:', error);
  }
}

async function stopFlats() {
  flatsStore.cancelFilterQueue();
  try {
    await apiService.flatassistantAction('stop');
  } catch (error) {
    console.error('Error stopping flats:', error);
  }
}
</script>
