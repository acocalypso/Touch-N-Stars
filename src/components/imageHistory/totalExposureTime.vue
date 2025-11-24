<template>
  <div class="flex flex-col gap-3">
    <!-- Selected Target Display -->
    <div v-if="selectedTargetData" class="bg-gray-100 dark:bg-gray-800 p-4 rounded">
      <div class="flex justify-between items-center">
        <select id="targetSelect" v-model="selectedTarget" class="default-select">
          <option v-for="target in exposureTimeByTarget" :key="target.targetName" :value="target.targetName">
            {{ target.targetName }}
          </option>
        </select>
        <span class="text-right">
          <div class="text-sm text-gray-600 dark:text-gray-400">{{ selectedTargetData.imageCount }} {{ $t('components.sequence.totalExposureTime.Pictures') }}</div>
          <div class="font-mono text-lg text-gray-300 font-bold">{{ formatExposureTime(selectedTargetData.totalTime) }}</div>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { apiStore } from '@/store/store';

const store = apiStore();
const selectedTarget = ref(null);
let previousLength = 0;

watch(
  () => store.imageHistoryInfo,
  (newVal) => {
    if (newVal && newVal.length > 0) {
      // Only auto-select the latest target if new images have been added
      if (newVal.length > previousLength) {
        const latestTarget = newVal[newVal.length - 1].TargetName;
        selectedTarget.value = latestTarget;
      }
      previousLength = newVal.length;
    }
  },
  { immediate: true }
);

const exposureTimeByTarget = computed(() => {
  if (!store.imageHistoryInfo || !Array.isArray(store.imageHistoryInfo)) {
    return [];
  }

  const targetMap = {};

  store.imageHistoryInfo.forEach(image => {
    const targetName = image.TargetName || '?';

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

const selectedTargetData = computed(() => {
  return exposureTimeByTarget.value.find(target => target.targetName === selectedTarget.value);
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
