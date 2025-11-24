<template>
  <div class="flex flex-col gap-3">
    <div v-if="exposureTimeByTarget.length > 0" class="flex flex-col gap-2">
      <div v-for="target in exposureTimeByTarget" :key="target.targetName" class="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-3 rounded">
        <span class="font-semibold">{{ target.targetName }}</span>
        <span class="text-right">
          <div class="text-sm text-gray-600 dark:text-gray-400">{{ target.imageCount }} Bilder</div>
          <div class="font-mono">{{ formatExposureTime(target.totalTime) }}</div>
        </span>
      </div>
    </div>
    <div v-else class="text-gray-500 dark:text-gray-400 text-center py-4">
      Keine Bilddaten verfügbar
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import { useSequenceStore } from '@/store/sequenceStore';

const store = apiStore();


const exposureTimeByTarget = computed(() => {
  if (!store.imageHistoryInfo || !Array.isArray(store.imageHistoryInfo)) {
    return [];
  }

  const targetMap = {};

  store.imageHistoryInfo.forEach(image => {
    const targetName = image.TargetName || 'Unbekannt';

    if (!targetMap[targetName]) {
      targetMap[targetName] = {
        targetName,
        totalTime: 0,
        imageCount: 0
      };
    }

    targetMap[targetName].totalTime += image.ExposureTime || 0;
    targetMap[targetName].imageCount += 1;
  });

  return Object.values(targetMap).sort((a, b) => a.targetName.localeCompare(b.targetName));
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

onMounted(() => {
  // Component will automatically update via computed property
});

watch(
  () => store.imageHistoryInfo,
  (newVal, oldVal) => {
    if (!oldVal || newVal.length > oldVal.length) {
      console.log('[totalExposureTime] New image data available');
    }
  }
);

</script>

<style scoped></style>
