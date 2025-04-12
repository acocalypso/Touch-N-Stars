<template>
  <div
    class="absolute bottom-3 right-3 bg-black bg-opacity-80 p-2 rounded-lg text-white text-sm font-mono"
  >
    {{ formattedDateTime }}
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useStellariumStore } from '@/store/stellariumStore';

const stellariumStore = useStellariumStore();
const formattedDateTime = ref('');
let animationFrameId = null;

function updateTime() {
  if (!stellariumStore.stel) return;

  const mjd = stellariumStore.stel.core.observer.utc;
  const date = mjdToDate(mjd);
  formattedDateTime.value = formatDate(date);

  // Request next animation frame
  animationFrameId = requestAnimationFrame(updateTime);
}

function mjdToDate(mjd) {
  const mjdBaseDate = new Date(Date.UTC(1858, 10, 17, 0, 0, 0));
  const daysToMilliseconds = 86400000;
  return new Date(mjdBaseDate.getTime() + mjd * daysToMilliseconds);
}

function formatDate(date) {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  return date.toLocaleString(undefined, options);
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
