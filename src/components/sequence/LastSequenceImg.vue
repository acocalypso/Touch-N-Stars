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
    <div
      v-else-if="settingsStore.monitorViewSetting.showImage"
      ref="imageContainer"
      class="image-container overflow-hidden touch-auto bg-gray-800 shadow-lg shadow-cyan-700/40 rounded-xl border border-cyan-700"
    >
      <img
        v-if="imageData"
        ref="image"
        @click="openModal"
        :src="imageData"
        alt="Aufgenommenes Bild"
        class="block w-full h-auto"
      />
    </div>

    <div
      v-if="!isLoadingImg && settingsStore.monitorViewSetting.showImageStats"
      class="flex flex-col w-full min-w-60 border border-cyan-700 bg-gray-800 shadow-lg shadow-cyan-700/40 rounded-xl p-4 text-sm space-y-2"
    >
      <div v-if="formattedDate" class="flex justify-between border-b border-gray-700">
        <span class="font-bold">{{ $t('components.sequence.date') }}: </span>
        <span>{{ formattedDate }}</span>
      </div>
      <div v-if="ExposureTime" class="flex justify-between border-b border-gray-700">
        <span class="font-bold">{{ $t('components.sequence.exposureTime') }}:</span>
        <span>{{ ExposureTime.toFixed(2) }} s</span>
      </div>
      <div v-if="HFR" class="flex justify-between border-b border-gray-700">
        <span class="font-bold">{{ $t('components.sequence.hfr') }}:</span>
        <span>{{ HFR.toFixed(2) }}</span>
      </div>
      <div v-if="Stars" class="flex justify-between border-b border-gray-700">
        <span class="font-bold">{{ $t('components.sequence.stars') }}:</span>
        <span>{{ Stars }}</span>
      </div>
      <div v-if="Mean" class="flex justify-between border-b border-gray-700">
        <span class="font-bold">{{ $t('components.sequence.mean') }}:</span>
        <span>{{ Mean.toFixed(2) }}</span>
      </div>
      <div v-if="Median" class="flex justify-between border-b border-gray-700">
        <span class="font-bold">{{ $t('components.sequence.median') }}:</span>
        <span>{{ Median }}</span>
      </div>
      <div v-if="StDev" class="flex justify-between border-b border-gray-700">
        <span class="font-bold">{{ $t('components.sequence.stDev') }}:</span>
        <span>{{ StDev.toFixed(2) }}</span>
      </div>
      <div v-if="RmsText" class="flex justify-between border-b border-gray-700">
        <span class="font-bold">{{ $t('components.sequence.rmsText') }}:</span>
        <span>{{ RmsText }}</span>
      </div>
      <div v-if="Temperature !== 'NaN'" class="flex justify-between border-b border-gray-700">
        <span class="font-bold">{{ $t('components.sequence.temperature') }}:</span>
        <span>{{ Temperature }} °C</span>
      </div>
      <div v-if="Filter" class="flex justify-between border-b border-gray-700">
        <span class="font-bold">{{ $t('components.sequence.filter') }}:</span>
        <span>{{ Filter }}</span>
      </div>
    </div>

    <ImageModal
      :showModal="showModal"
      :imageData="imageDataModal"
      :isLoading="isLoadingModal"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import apiService from '@/services/apiService';
import ImageModal from '@/components/helpers/imageModal.vue';

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

// Computed Property für das Formatieren des Datums
const formattedDate = computed(() => {
  if (!dateValue.value) return '';

  const dateObj = new Date(dateValue.value);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
});

// Modal öffnen / schließen
function openModal() {
  showModal.value = true;
  getlastModalImage(lastImgIndex.value, 90, true, 0.8);
  isLoadingModal.value = true;
}
function closeModal() {
  showModal.value = false;
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getlastImage(index, quality, resize, scale) {
  try {
    const result = await apiService.getSequenceImage(index, quality, resize, scale);

    if (result.StatusCode != 200) {
      console.error('Unknown error: Check NINIA Log for more information');
      return;
    }
    const image = result?.Response;
    //console.log('Image Data: ', image);
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

      await wait(3000); // Es kann sein, dass das Bild noch nicht verfügbar ist

      getlastImage(latestIndex, 75, true, 0.5);
      if (showModal.value) {
        getlastModalImage(latestIndex, 90, true, 0.8);
      }
    }
  },
  { immediate: false }
);

onMounted(() => {
  const latestIndex = store.imageHistoryInfo.length - 1;
  getlastImage(latestIndex, 75, true, 0.5);
  console.log('Mounted last LastSequenceImg');
  console.log('latestIndex: ', latestIndex);
  console.log('isLoadingImg: ', isLoadingImg.value);
});
</script>

<style scoped></style>
