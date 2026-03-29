<template>
  <div class="flex flex-col gap-3">
    <div v-if="displayData" class="bg-gray-100 dark:bg-gray-800 p-4 rounded">
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-400">{{ displayLabel }}</span>
        <span class="text-right">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {{ displayData.imageCount }}
            {{ $t('components.sequence.totalExposureTime.Pictures') }}
          </div>
          <div class="font-mono text-lg text-gray-300 font-bold">
            {{ formatExposureTime(displayData.totalTime) }}
          </div>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useImageFilter } from '@/composables/useImageFilter';

const { t } = useI18n();
const { filter, filteredImages } = useImageFilter();

const lightFilteredImages = computed(() =>
  filteredImages.value.filter((img) => img.ImageType === 'LIGHT' || img.ImageType === 'SNAPSHOT')
);

const displayData = computed(() => {
  const images = lightFilteredImages.value;
  if (!images || images.length === 0) return null;
  return {
    imageCount: images.length,
    totalTime: images.reduce((sum, img) => sum + (img.ExposureTime || 0), 0),
  };
});

const displayLabel = computed(() => {
  const parts = [];
  if (filter.value.selectedTarget) parts.push(filter.value.selectedTarget);
  if (filter.value.selectedFilter) parts.push(filter.value.selectedFilter);
  return parts.length > 0 ? parts.join(' / ') : t('components.sequence.imageFilter.allTargets');
});

const formatExposureTime = (seconds) => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m ${remainingSeconds.toFixed(1)}s`;
};
</script>

<style scoped></style>
