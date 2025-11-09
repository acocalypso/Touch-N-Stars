<template>
  <div class="relative w-full">
    <!-- Image Container -->
    <div v-if="settingsStore.monitorViewSetting.showImage && imageData" class="relative">
      <SequenceImage
        :index="lastImgIndex"
        :image="imageData"
        :showStats="settingsStore.monitorViewSetting.showImageStats"
        :displayStatusUnderImage="settingsStore.monitorViewSetting.displayStatusUnderImage"
        :stats="{
          Date: dateValue,
          ExposureTime,
          HFR,
          Mean,
          Median,
          StDev,
          RmsText,
          Temperature,
          Filter,
          TargetName,
        }"
      />

      <!-- Loading Spinner Overlay -->
      <div
        v-if="isLoadingImg && imageData"
        class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 z-40"
      >
        <div class="flex flex-col items-center text-white">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-2"></div>
          <p class="text-sm">Loading image...</p>
        </div>
      </div>
    </div>

    <!-- Loading Spinner when no image yet -->
    <div v-else-if="isLoadingImg" class="flex items-center justify-center w-full h-64">
      <div class="flex flex-col items-center text-blue-500">
        <div
          class="w-12 h-12 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"
        ></div>
        <p class="text-sm mt-2">Loading image...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import { useSequenceStore } from '@/store/sequenceStore';
import SequenceImage from '@/components/sequence/SequenceImage.vue';
import { useImagetStore } from '@/store/imageStore';

let isLoadingImg = ref(true);
const store = apiStore();
const settingsStore = useSettingsStore();
const sequenceStore = useSequenceStore();
const imageStore = useImagetStore();
const imageData = ref(null);
const Filter = ref(null);
const HFR = ref(null);
const Mean = ref(null);
const Median = ref(null);
const RmsText = ref(null);
const StDev = ref(null);
const Stars = ref(null);
const Temperature = ref(null);
const ExposureTime = ref(null);
const dateValue = ref(null);
const lastImgIndex = ref(null);
const TargetName = ref(null);

async function loadImage(index) {
  try {
    isLoadingImg.value = true;
    imageData.value = await imageStore.getImageByIndex(index);

    if (imageData.value) {
      setSelectedDataset(index);
      lastImgIndex.value = index;
      console.log('[LastSequneceImg] Image loaded successfully:', index);
    }
  } catch (error) {
    console.error('Error loading image:', error.message);
  } finally {
    isLoadingImg.value = false;
  }
}

function setSelectedDataset(datasetIndex) {
  if (!store.imageHistoryInfo || store.imageHistoryInfo.length === 0) return;

  const selectedData = store.imageHistoryInfo[datasetIndex];
  if (selectedData) {
    Filter.value = selectedData.Filter;
    HFR.value = selectedData.HFR;
    Mean.value = selectedData.Mean;
    Median.value = selectedData.Median;
    RmsText.value = selectedData.RmsText;
    StDev.value = selectedData.StDev;
    Stars.value = selectedData.Stars;
    Temperature.value = selectedData.Temperature;
    ExposureTime.value = selectedData.ExposureTime;
    dateValue.value = selectedData.Date;
    TargetName.value = resolveTargetName(selectedData, datasetIndex);
  }
}

function resolveTargetName(selectedData, imageIndex) {
  if (!Number.isInteger(imageIndex) || imageIndex < 0) {
    return sequenceStore.targetName || sequenceStore.lastTargetName;
  }

  const persistedName = sequenceStore.getImageTargetName(imageIndex);
  if (persistedName) {
    return persistedName;
  }

  const derivedName = extractTargetName(selectedData);
  if (derivedName) {
    sequenceStore.setImageTargetName(imageIndex, derivedName);
    return derivedName;
  }

  const fallback = sequenceStore.targetName || sequenceStore.lastTargetName;
  if (fallback) {
    sequenceStore.setImageTargetName(imageIndex, fallback);
    return fallback;
  }

  return '';
}

function extractTargetName(stats) {
  if (!stats) return '';

  const candidateValues = [
    stats.TargetName,
    stats.Target?.TargetName,
    stats.Target?.Name,
    stats.Target,
    stats.SequenceTargetName,
    stats.Name,
  ];

  for (const candidate of candidateValues) {
    const normalized = normalizePossibleRef(candidate);
    if (typeof normalized === 'string' && normalized.trim().length > 0) {
      return normalized.trim();
    }
  }

  return '';
}

function normalizePossibleRef(value) {
  if (value && typeof value === 'object' && 'value' in value) {
    return value.value;
  }

  return value;
}

watch(
  () => store.imageHistoryInfo,
  async (newVal, oldVal) => {
    if (!oldVal || newVal.length > oldVal.length) {
      const latestIndex = newVal.length - 1;
      console.log('[LastSequenceImg] latestIndex: ', latestIndex);

      loadImage(latestIndex);
    }
  },
  { immediate: false }
);

onMounted(() => {
  const latestIndex = store.imageHistoryInfo.length - 1;
  loadImage(latestIndex);
  console.log('[LastSequenceImg] Mounted');
  console.log('[LastSequenceImg] latestIndex: ', latestIndex);
  //console.log('isLoadingImg: ', isLoadingImg.value);
});
</script>

<style scoped></style>
