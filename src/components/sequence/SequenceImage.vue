<template>
  <div
    @click="openModal"
    ref="imageContainer"
    class="image-container relative overflow-hidden touch-auto bg-gray-800 shadow-lg shadow-cyan-700/40 rounded-xl border border-cyan-700 cursor-pointer"
  >
    <div
      v-if="showStats"
      class="flex flex-col absolute w-full min-w-60 bottom-0 shadow-lg shadow-cyan-700/40 rounded-xl p-4 text-xs sm:text-sm space-y-2 position-absolute bg-black bg-opacity-10"
    >
      <div class="grid grid-cols-2 gap-4">
        <div v-if="stats.Date" class="flex justify-between">
          <span class="font-bold">{{ $t('components.sequence.time') }}: </span>
          <span>{{ formatDate(stats.Date) }}</span>
        </div>

        <div v-if="isValidNumber(stats.ExposureTime)" class="flex justify-between">
          <span class="font-bold">{{ $t('components.sequence.duration') }}:</span>
          <span>{{ stats.ExposureTime.toFixed(2) }} s</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div v-if="isValidNumber(stats.HFR)" class="flex justify-between">
          <span class="font-bold">{{ $t('components.sequence.hfr') }}:</span>
          <span>{{ stats.HFR.toFixed(2) }}</span>
        </div>

        <div v-if="isValidNumber(stats.Mean)" class="flex justify-between">
          <span class="font-bold">{{ $t('components.sequence.mean') }}:</span>
          <span>{{ stats.Mean.toFixed(2) }}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div v-if="isValidNumber(stats.Median)" class="flex justify-between">
          <span class="font-bold">{{ $t('components.sequence.median') }}:</span>
          <span>{{ stats.Median.toFixed(2) }}</span>
        </div>

        <div v-if="isValidNumber(stats.StDev)" class="flex justify-between">
          <span class="font-bold">{{ $t('components.sequence.stDev') }}:</span>
          <span>{{ stats.StDev.toFixed(2) }}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div v-if="stats.RmsText" class="flex justify-between">
          <span class="font-bold">{{ $t('components.sequence.rmsText') }}:</span>
          <span>{{ formatRms(stats.RmsText) }}</span>
        </div>

        <div v-if="isValidNumber(stats.Temperature)" class="flex justify-between">
          <span class="font-bold">{{ $t('components.sequence.temperatureShort') }}:</span>
          <span>{{ stats.Temperature }} °C</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div v-if="stats.Filter" class="flex justify-between">
          <span class="font-bold">{{ $t('components.sequence.filter') }}:</span>
          <span>{{ stats.Filter }}</span>
        </div>
      </div>
    </div>
    <img ref="image" :src="image" alt="Sequence Image" class="block w-full h-auto" />
  </div>

  <ImageModal
    :showModal="showModal"
    :imageData="fullResImage"
    :imageDate="stats.Date"
    :isLoading="isLoadingModal"
    @close="closeModal"
  />
</template>

<script setup>
import { ref, defineProps } from 'vue';
import ImageModal from '@/components/helpers/imageModal.vue';
import { useSettingsStore } from '@/store/settingsStore';
import { useSequenceStore } from '@/store/sequenceStore';

const settingsStore = useSettingsStore();
const sequenceStore = useSequenceStore();

const props = defineProps({
  index: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  stats: {
    type: Object,
    required: false,
  },
  showStats: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const isLoadingModal = ref(false);
const showModal = ref(false);
const fullResImage = ref(props.image);

function openModal() {
  isLoadingModal.value = true;
  showModal.value = true;

  sequenceStore
    .getImageByIndex(props.index, settingsStore.camera.imageQuality, 0.5)
    .then((image) => {
      fullResImage.value = image;
    })
    .finally(() => {
      isLoadingModal.value = false;
    });
}

function closeModal() {
  showModal.value = false;
}

function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

function formatDate(dateStr) {
  const dateObject = new Date(dateStr);
  // Return only the time portion of the date string (e.g 12:33:01)
  return dateObject.toLocaleTimeString();
}

function formatRms(rmsText) {
  return rmsText.replace('Tot: ', '');
}
</script>
