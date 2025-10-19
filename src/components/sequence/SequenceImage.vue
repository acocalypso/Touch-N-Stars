<template>
  <div
    @click="openModal"
    ref="imageContainer"
    class="image-container relative overflow-hidden touch-auto bg-gray-800 shadow-lg shadow-cyan-700/40 rounded-xl border border-cyan-700 cursor-pointer"
  >
    <img ref="image" :src="image" alt="Sequence Image" class="block w-full h-auto" />
    <div
      v-if="showStats"
      :class="[
        'flex flex-col w-full bottom-0 shadow-lg shadow-cyan-700/40 rounded-xl p-2 text-xs bg-black bg-opacity-10',
        { absolute: !displayStatusUnderImage },
      ]"
    >
      <div class="grid grid-cols-2 gap-x-1 gap-y-0.5">
        <div v-if="stats.Date" class="flex gap-1 min-w-0">
          <span class="font-bold whitespace-nowrap">{{ $t('components.sequence.time') }}:</span>
          <span class="truncate">{{ formatDate(stats.Date) }}</span>
        </div>

        <div v-if="isValidNumber(stats.ExposureTime)" class="flex gap-1 min-w-0">
          <span class="font-bold whitespace-nowrap">{{ $t('components.sequence.duration') }}:</span>
          <span class="truncate">{{ stats.ExposureTime.toFixed(2) }}s</span>
        </div>

        <div v-if="isValidNumber(stats.HFR)" class="flex gap-1 min-w-0">
          <span class="font-bold whitespace-nowrap">{{ $t('components.sequence.hfr') }}:</span>
          <span class="truncate">{{ stats.HFR.toFixed(2) }}</span>
        </div>

        <div v-if="isValidNumber(stats.Mean)" class="flex gap-1 min-w-0">
          <span class="font-bold whitespace-nowrap">{{ $t('components.sequence.mean') }}:</span>
          <span class="truncate">{{ stats.Mean.toFixed(2) }}</span>
        </div>

        <div v-if="isValidNumber(stats.Median)" class="flex gap-1 min-w-0">
          <span class="font-bold whitespace-nowrap">{{ $t('components.sequence.median') }}:</span>
          <span class="truncate">{{ stats.Median.toFixed(2) }}</span>
        </div>

        <div v-if="isValidNumber(stats.StDev)" class="flex gap-1 min-w-0">
          <span class="font-bold whitespace-nowrap">{{ $t('components.sequence.stDev') }}:</span>
          <span class="truncate">{{ stats.StDev.toFixed(2) }}</span>
        </div>

        <div v-if="stats.RmsText" class="flex gap-1 min-w-0">
          <span class="font-bold whitespace-nowrap">{{ $t('components.sequence.rmsText') }}:</span>
          <span class="truncate">{{ formatRms(stats.RmsText) }}</span>
        </div>

        <div v-if="isValidNumber(stats.Temperature)" class="flex gap-1 min-w-0">
          <span class="font-bold whitespace-nowrap">{{ $t('components.sequence.temperatureShort') }}:</span>
          <span class="truncate">{{ stats.Temperature.toFixed(1) }}°C</span>
        </div>

        <div v-if="stats.Filter" class="flex gap-1 col-span-2 min-w-0">
          <span class="font-bold whitespace-nowrap">{{ $t('components.sequence.filter') }}:</span>
          <span class="truncate">{{ stats.Filter }}</span>
        </div>
      </div>
    </div>
  </div>

  <ImageModal
    :showModal="showModal"
    :imageData="fullResImage"
    :imageDate="stats.Date"
    :isLoading="isLoadingModal"
    :index="index"
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
  displayStatusUnderImage: {
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
