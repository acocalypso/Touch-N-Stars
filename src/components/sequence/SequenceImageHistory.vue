<template>
  <div>
    <div class="mb-4 flex items-center px-4 sm:px-0">
      <button
        @click="toggleSortOrder"
        class="flex items-center gap-2 text-sm sm:text-base text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-150 ease-in-out focus:outline-none group bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2"
        role="button"
        aria-label="Sort images"
      >
        <div class="flex flex-col items-center text-[0.65rem] leading-3 opacity-50 mr-1">
          <ChevronUpIcon class="w-3 h-3 mb-0.5" />
          <ChevronDownIcon class="w-3 h-3" />
        </div>
        <ChevronUpIcon
          v-if="sortAscending"
          class="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5"
        />
        <ChevronDownIcon
          v-else
          class="w-5 h-5 transition-transform duration-200 group-hover:translate-y-0.5"
        />
        <span class="border-b-2 border-transparent group-hover:border-current">
          {{ t('components.sequence.sort.sort') }}:
          {{
            sortAscending
              ? t('components.sequence.sort.oldest')
              : t('components.sequence.sort.newest')
          }}
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
import { useI18n } from 'vue-i18n';
import { ref, watch, onMounted, computed } from 'vue';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';
import SequenceImage from '@/components/sequence/SequenceImage.vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import { useSequenceStore } from '@/store/sequenceStore';

const { t } = useI18n();
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
  for (const imageIndex in store.imageHistoryInfo) {
    const image = await sequenceStore.getThumbnailByIndex(imageIndex);
    const stats = store.imageHistoryInfo[imageIndex];
    addImageToHistory(imageIndex, image, stats);
  }
});
</script>
