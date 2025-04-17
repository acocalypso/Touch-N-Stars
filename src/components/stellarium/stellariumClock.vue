<template>
  <div
    class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 p-1 rounded-lg text-gray-200 font-mono"
  >
    <div class="text-lg text-center">{{ formattedTime }}</div>
    <div class="text-sm text-center">{{ formattedDate }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useStellariumStore } from '@/store/stellariumStore';

const stellariumStore = useStellariumStore();
const formattedTime = ref('');
const formattedDate = ref('');
let animationFrameId = null;

function updateTime() {
  if (!stellariumStore.stel) return;

  const mjd = stellariumStore.stel.core.observer.utc;
  const date = mjdToDate(mjd);
  formatDateTime(date);

  // Request next animation frame
  animationFrameId = requestAnimationFrame(updateTime);
}

function mjdToDate(mjd) {
  const mjdBaseDate = new Date(Date.UTC(1858, 10, 17, 0, 0, 0));
  const daysToMilliseconds = 86400000;
  return new Date(mjdBaseDate.getTime() + mjd * daysToMilliseconds);
}

function formatDateTime(date) {
  // Time format
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  formattedTime.value = date.toLocaleString(undefined, timeOptions);

  // Date format
  const dateOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  formattedDate.value = date.toLocaleString(undefined, dateOptions);
}

onMounted(() => {
  updateTime();
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>
