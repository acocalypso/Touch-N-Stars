<template>
  <div class="flex flex-col w-full justify-center gap-4">
    <div v-if="isLoadingImg">
      <!--Spinner-->
      <div class="flex items-center justify-center">
        <div
          class="w-12 h-12 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"
        ></div>
      </div>
    </div>
    <SequenceImage
      v-else-if="settingsStore.monitorViewSetting.showImage && imageData"
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import { useSequenceStore } from '@/store/sequenceStore';
import SequenceImage from '@/components/sequence/SequenceImage.vue';

let isLoadingImg = ref(true);

const store = apiStore();
const settingsStore = useSettingsStore();
const sequenceStore = useSequenceStore();
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

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getlastImage(index, quality, scale) {
  if (
    sequenceStore.lastImage.image &&
    index === sequenceStore.lastImage.index &&
    quality <= sequenceStore.lastImage.quality &&
    scale <= sequenceStore.lastImage.scale
  ) {
    lastImgIndex.value = index;
    imageData.value = sequenceStore.lastImage.image;
    isLoadingImg.value = false;
    setSelectedDataset(index);
    console.log('aus cache');
    return;
  }
  try {
    imageData.value = await sequenceStore.getImageByIndex(index, quality, scale);
    if (imageData.value) {
      setSelectedDataset(index);
      sequenceStore.lastImage.scale = scale;
      sequenceStore.lastImage.quality = quality;
      sequenceStore.lastImage.index = index;
      sequenceStore.lastImage.image = imageData.value;
      lastImgIndex.value = index;
      isLoadingImg.value = false;
      console.log('isLoadingImg: ', isLoadingImg.value, 'lastImgIndex', lastImgIndex.value);
    }
  } catch (error) {
    console.error('Error fetching image:', error.message);
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
      console.log('Watch imageHistoryInfo');
      console.log('latestIndex: ', latestIndex);

      await wait(3000); // Wait 3 seconds. The image may not be available yet.

      getlastImage(latestIndex, settingsStore.camera.imageQuality, 0.5);
    }
  },
  { immediate: false }
);

onMounted(() => {
  const latestIndex = store.imageHistoryInfo.length - 1;
  getlastImage(latestIndex, settingsStore.camera.imageQuality, 0.5);
  console.log('Mounted last LastSequenceImg');
  console.log('latestIndex: ', latestIndex);
  console.log('isLoadingImg: ', isLoadingImg.value);
});
</script>

<style scoped></style>
