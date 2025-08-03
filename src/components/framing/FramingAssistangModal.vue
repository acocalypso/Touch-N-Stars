<template>
  <div class="flex flex-col items-center justify-center">
    <!-- Framing-Komponente ohne Key (bleibt persistent) -->
    <Suspense>
      <template #default>
        <component :is="currentComponent" />
      </template>

      <template #fallback>
        <div>Lade Komponente...</div>
      </template>
    </Suspense>
    
    <!-- Kontrollen bleiben immer sichtbar -->
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

// Asynchrone Definition der Komponente über defineAsyncComponent:
const AsyncFramingTest = defineAsyncComponent(
  () => import('@/components/framing/FramingAssitantImg.vue')
);

const currentComponent = computed(() => {
  return showFraming.value ? AsyncFramingTest : null;
});

// Nur FOV-Validierung ohne Reload
watch(
  () => framingStore.fov,
  (newFov) => {
    if (newFov < 0.1) {
      console.warn('FOV zu klein, wird auf 0.1 gesetzt');
      framingStore.fov = 0.1;
    }
    if (newFov > 180) {
      console.warn('FOV zu groß, wird auf 180 gesetzt');
      framingStore.fov = 180;
    }
  }
);
</script>
