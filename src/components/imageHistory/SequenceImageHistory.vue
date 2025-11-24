<template>
  <div>
    <div class="mb-4 flex items-center gap-3 px-4 sm:px-0">
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
      <button
        @click="toggleShowHistoryStats"
        class="flex items-center gap-2 text-sm sm:text-base transition-all duration-150 ease-in-out focus:outline-none group bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2"
        :class="
          settingsStore.monitorViewSetting.showHistoryImageStats
            ? 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
            : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400'
        "
        role="button"
        aria-label="Toggle image statistics"
      >
        <ChartBarIcon class="w-5 h-5" />
        <span class="border-b-2 border-transparent group-hover:border-current">
          {{ t('components.sequence.stats') }}
        </span>
      </button>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3 xl:gap-4 pt-4 pb-20">
      <div v-for="image in sortedImageHistory" v-bind:key="image.data" class="relative">
        <SequenceImage
          :index="image.index"
          :image="image.data"
          :stats="image.stats"
          :showStats="settingsStore.monitorViewSetting.showHistoryImageStats"
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
import { ChevronUpIcon, ChevronDownIcon, ChartBarIcon } from '@heroicons/vue/24/outline';
import SequenceImage from '@/components/imageHistory/SequenceImage.vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import { useSequenceStore } from '@/store/sequenceStore';
import { useImagetStore } from '@/store/imageStore';

const { t } = useI18n();
const sequenceStore = useSequenceStore();
const imageStore = useImagetStore();
const imageHistory = ref([]);
const store = apiStore();
const settingsStore = useSettingsStore();
const isLoadingImages = ref(false);

const sortAscending = ref(false);

function toggleShowHistoryStats() {
  settingsStore.monitorViewSetting.showHistoryImageStats =
    !settingsStore.monitorViewSetting.showHistoryImageStats;
}

const sortedImageHistory = computed(() => {
  return [...imageHistory.value].sort((a, b) => {
    const comparison = a.index - b.index;
    return sortAscending.value ? comparison : -comparison;
  });
});

function toggleSortOrder() {
  sortAscending.value = !sortAscending.value;
}

function addImageToHistory(imageIndex, imageData, stats) {
  const statsWithTargetName = enrichStatsWithTargetName(stats, imageIndex);

  imageHistory.value.push({
    stats: statsWithTargetName,
    data: imageData,
    index: imageIndex,
  });
}

function enrichStatsWithTargetName(stats, imageIndex) {
  const resolvedTargetName = resolveTargetName(stats, imageIndex);

  if (!stats) {
    if (!resolvedTargetName) {
      return {};
    }

    return {
      TargetName: resolvedTargetName,
    };
  }

  if (!resolvedTargetName) {
    return stats;
  }

  if (stats.TargetName === resolvedTargetName) {
    return stats;
  }

  return {
    ...stats,
    TargetName: resolvedTargetName,
  };
}

function resolveTargetName(stats, imageIndex) {
  const persistedName = sequenceStore.getImageTargetName(imageIndex);
  if (persistedName) {
    return persistedName;
  }

  const derivedName = extractTargetName(stats);
  if (derivedName) {
    sequenceStore.setImageTargetName(imageIndex, derivedName);
    return derivedName;
  }

  const fallback = sequenceStore.targetName?.trim() || sequenceStore.lastTargetName?.trim() || '';
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

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

watch(
  () => store.imageHistoryInfo,
  async (newVal, oldVal) => {
    if (!newVal || newVal.length === 0) {
      return;
    }

    if (!oldVal || newVal.length > oldVal.length) {
      const latestIndex = newVal.length - 1;
      const isImageLoaded = imageHistory.value.some((image) => image.index === latestIndex);

      if (!isImageLoaded) {
        await wait(3000); // Wait 3 seconds. The image may not be available yet.
        isLoadingImages.value = true;
        const stats = newVal[latestIndex];

        const image = await imageStore.getImageByIndex(latestIndex);
        addImageToHistory(latestIndex, image, stats);
        isLoadingImages.value = false;
      }
    }
  },
  { immediate: false }
);

onMounted(async () => {
  for (const imageIndex in store.imageHistoryInfo) {
    const image = await imageStore.getThumbnailByIndex(imageIndex);
    const stats = store.imageHistoryInfo[imageIndex];
    addImageToHistory(Number(imageIndex), image, stats);
  }
});
</script>
