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

// Watch for when backend is reachable and redirect to equipment page
watch(
  () => store.isBackendReachable,
  (isReachable) => {
    if (isReachable) {
      // Small delay to show the loading completed state briefly
      setTimeout(() => {
        router.push('/equipment');
      }, 500);
    }
  }
);

onMounted(() => {
  // If backend is already reachable when component mounts, redirect immediately
  if (store.isBackendReachable) {
    setTimeout(() => {
      router.push('/equipment');
    }, 1000);
  }
});
</script>
