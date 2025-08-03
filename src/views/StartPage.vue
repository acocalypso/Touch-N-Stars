<template>
  <div class="container text-center">
    <div class="flex flex-col font-mono font-bold justify-center items-center h-full">
      <h1 class="text-5xl pt-6 text-yellow-50">{{ $t('app.title') }}</h1>
      <img class="mt-5" src="../assets/Logo_TouchNStars_600x600.png" alt="" />
      <div v-if="!store.isBackendReachable" class="mt-8">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-400 mx-auto"></div>
        <p class="mt-4 text-gray-300">Loading...</p>
      </div>
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
      // Mark as visited
      sessionStorage.setItem('hasVisited', 'true');
      // Show loading overlay and delay before redirect
      store.isRedirecting = true;
      setTimeout(() => {
        store.isRedirecting = false;
        router.push('/equipment');
      }, 500);
    }
  }
);

onMounted(() => {
  // If backend is already reachable when component mounts, redirect immediately
  // Only redirect if this is the first visit
  if (store.isBackendReachable && isFirstVisit) {
    sessionStorage.setItem('hasVisited', 'true');
    store.isRedirecting = true;
    setTimeout(() => {
      store.isRedirecting = false;
      router.push('/equipment');
    }, 500);
  }
});
</script>
