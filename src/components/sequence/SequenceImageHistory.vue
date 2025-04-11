<template>
  <div>
    <div class="mb-4 flex justify-end">
      <button
        @click="toggleSortOrder"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
      >
        <span>{{ sortAscending ? 'Oldest First' : 'Newest First' }}</span>
        <span class="ml-2">
          <i :class="sortAscending ? 'fas fa-sort-amount-up' : 'fas fa-sort-amount-down'"></i>
        </span>
      </button>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-5">
      <div v-for="image in sortedImageHistory" v-bind:key="image.data" class="relative">
        <SequenceImage
          :index="image.index"
          :image="image.data"
          :stats="image.stats"
          :showStats="settingsStore.monitorViewSetting.showImageStats"
        />
      </div>
      <div v-if="isLoadingImages" class="flex items-center justify-center p-5 h-full min-h-[300px]">
        <div
          class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import SequenceImage from '@/components/sequence/SequenceImage.vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import { useSequenceStore } from '@/store/sequenceStore';

const sequenceStore = useSequenceStore();
const imageHistory = ref([]);
const store = apiStore();
const settingsStore = useSettingsStore();
const isLoadingImages = ref(false);

const sortAscending = ref(false);

const sortedImageHistory = computed(() => {
  return [...imageHistory.value].sort((a, b) => {
    const comparison = a.index - b.index;
    return sortAscending.value ? comparison : -comparison;
  });
});

function toggleSortOrder() {
  sortAscending.value = !sortAscending.value;
}

const minQuality = settingsStore.camera.imageQuality <= 40 ? settingsStore.camera.imageQuality : 40;
const minScale = 0.3;

function addImageToHistory(imageIndex, imageData, stats) {
  imageHistory.value.push({
    stats,
    data: imageData,
    index: imageIndex,
  });
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

watch(
  () => store.imageHistoryInfo,
  async (newVal, oldVal) => {
    if (!oldVal || newVal.length > oldVal.length) {
      const latestIndex = newVal.length - 1;
      const isImageLoaded =
        imageHistory.value.some((image) => image.index == latestIndex).length > 0;

      if (!isImageLoaded) {
        await wait(3000); // Wait 3 seconds. The image may not be available yet.
        isLoadingImages.value = true;
        const stats = newVal[latestIndex];

        const image = await sequenceStore.getImageByIndex(latestIndex, minQuality, minScale);
        addImageToHistory(latestIndex, image, stats);
        isLoadingImages.value = false;
      }
    }
  },
  { immediate: false }
);

onMounted(async () => {
  isLoadingImages.value = true;

  for (const imageIndex in store.imageHistoryInfo) {
    const image = await sequenceStore.getThumbnailByIndex(imageIndex);
    const stats = store.imageHistoryInfo[imageIndex];
    addImageToHistory(imageIndex, image, stats);
  }
  isLoadingImages.value = false;
});
</script>
