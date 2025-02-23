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
      :image="imageData"
      :showStats="settingsStore.monitorViewSetting.showImageStats"
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
      }"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import apiService from '@/services/apiService';
import SequenceImage from '@/components/sequence/SequenceImage.vue';

let isLoadingImg = ref(true);
let isLoadingModal = ref(false);

const store = apiStore();
const settingsStore = useSettingsStore();
const imageData = ref(null);
const imageDataModal = ref(null);
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
const showModal = ref(false);
const lastImgIndex = ref(null);

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getlastImage(index, quality, resize, scale) {
  try {
    const result = await apiService.getSequenceImage(index, quality, resize, scale);
    console.log(result);
    if (result.StatusCode != 200) {
      isLoadingImg.value = false;
      console.error('Unknown error: Check NINIA Log for more information');
      return;
    }
    const image = result?.Response;
    if (image) {
      imageData.value = `data:image/jpeg;base64,${image}`;
      setSelectedDataset(index);
      lastImgIndex.value = index;
      isLoadingImg.value = false;
      console.log('isLoadingImg: ', isLoadingImg.value, 'lastImgIndex', lastImgIndex.value);
    }
  } catch (error) {
    console.error('Fehler beim Abrufen des Bildes:', error.message);
  }
}

async function getlastModalImage(index, quality, resize, scale) {
  console.log(
    'getlastModalImage: Index ',
    index,
    'Quality: ',
    quality,
    'Resize: ',
    resize,
    'Scale: ',
    scale
  );
  try {
    const resultModal = await apiService.getSequenceImage(index, quality, false, scale);
    const imageModal = resultModal?.Response;
    if (imageModal) {
      imageDataModal.value = `data:image/jpeg;base64,${imageModal}`;
      isLoadingModal.value = false;
    }
  } catch (error) {
    console.error('Fehler beim Abrufen des Bildes:', error.message);
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
  }
}

watch(
  () => store.imageHistoryInfo,
  async (newVal, oldVal) => {
    if (!oldVal || newVal.length > oldVal.length) {
      const latestIndex = newVal.length - 1;
      console.log('Watch imageHistoryInfo');
      console.log('latestIndex: ', latestIndex);

      await wait(3000); // Wait 3 seconds. The image may not be available yet.

      getlastImage(latestIndex, settingsStore.camera.imageQuality, true, 0.5);
      if (showModal.value) {
        getlastModalImage(latestIndex, 90, true, 0.8);
      }
    }
  },
  { immediate: false }
);

onMounted(() => {
  const latestIndex = store.imageHistoryInfo.length - 1;
  getlastImage(latestIndex, settingsStore.camera.imageQuality, true, 0.5);
  console.log('Mounted last LastSequenceImg');
  console.log('latestIndex: ', latestIndex);
  console.log('isLoadingImg: ', isLoadingImg.value);
});
</script>

<style scoped></style>
