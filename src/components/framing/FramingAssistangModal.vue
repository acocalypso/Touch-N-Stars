<template>
  <div class="flex flex-col items-center justify-center">
    <Suspense>
      <template #default>
        <component :is="currentComponent" :key="componentKey" />
      </template>

      <template #fallback>
        <div>Lade Komponente...</div>
      </template>
    </Suspense>
    <div
      class="flex-col w-full space-y-2 mt-4 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
    >
      <fovParameter />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent, watch } from 'vue';
import { useFramingStore } from '@/store/framingStore';
import fovParameter from '@/components/framing/fovParameter.vue';

const framingStore = useFramingStore();
const showFraming = ref(true);
const componentKey = ref(0);

// Asynchrone Definition der Komponente über defineAsyncComponent:
const AsyncFramingTest = defineAsyncComponent(
  () => import('@/components/framing/FramingAssitantImg.vue')
);

const currentComponent = computed(() => {
  return showFraming.value ? AsyncFramingTest : null;
});

// FOV-Validierung und intelligenter Reload
function validateAndReload() {
  if (framingStore.fov < 0.1) {
    console.warn('FOV zu klein, wird auf 0.1 gesetzt');
    framingStore.fov = 0.1;
    return;
  }
  if (framingStore.fov > 180) {
    console.warn('FOV zu groß, wird auf 180 gesetzt');
    framingStore.fov = 180;
    return;
  }
  
  // Komponente neu laden für blauen Rahmen/Overlays
  componentKey.value++;
}

let debounceTimeout;
function debouncedReload() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    validateAndReload();
  }, 400); // Etwas schneller als vorher
}

// FOV-Änderungen mit debounced Reload
watch(
  () => framingStore.fov,
  () => {
    debouncedReload();
  }
);
</script>
