<template>
  <div class="container text-center">
    <div class="flex flex-col font-mono font-bold justify-center items-center h-full">
      <h1 class="text-5xl pt-6 text-yellow-50">{{ $t('app.title') }}</h1>
      <img class="mt-5" src="../assets/Logo_TouchNStars_600x600.png" alt="" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { apiStore } from '@/store/store';

const router = useRouter();
const store = apiStore();

// Check if this is the first visit by checking sessionStorage
const isFirstVisit = !sessionStorage.getItem('hasVisited');

// Watch for when backend is reachable and redirect to equipment page
watch(
  () => store.isBackendReachable,
  (isReachable) => {
    if (isReachable && isFirstVisit) {
      // Mark as visited and redirect immediately without loading overlay
      sessionStorage.setItem('hasVisited', 'true');
      router.push('/equipment');
    }
  }
);

onMounted(() => {
  // If backend is already reachable when component mounts, redirect immediately
  // Only redirect if this is the first visit
  if (store.isBackendReachable && isFirstVisit) {
    sessionStorage.setItem('hasVisited', 'true');
    router.push('/equipment');
  }
});
</script>
