<template>
  <div class="flex gap-1">
    <button
      @click="syncCoordinates"
      :disabled="
        framingStore.isSlewing ||
        framingStore.isSlewingAndCentering ||
        framingStore.isRotating ||
        store.mountInfo.AtPark ||
        props.disabled
      "
      :class="['default-button-cyan', statusClass]"
    >
      <span
        v-if="isLoading"
        class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
      ></span>
      <p v-else>{{ $t('components.mount.control.sync_coordinates_to_mount') }}</p>
    </button>
  </div>
</template>

<script setup>
import { defineProps, ref } from 'vue';
import { useMountStore } from '@/store/mountStore';
import { useFramingStore } from '@/store/framingStore';
import { apiStore } from '@/store/store';

const store = apiStore();
const mountStore = useMountStore();
const framingStore = useFramingStore();
const statusClass = ref('');
const isLoading = ref(false);

const props = defineProps({
  raAngle: Number,
  decAngle: Number,
  label: String,
  disabled: Boolean,
});

async function syncCoordinates() {
  isLoading.value = true;
  const result = await mountStore.syncCoordinates(props.raAngle, props.decAngle);

  if (result.success) {
    statusClass.value = 'glow-green';
  } else {
    statusClass.value = 'glow-red';
  }

  isLoading.value = false;
  setTimeout(() => {
    statusClass.value = '';
  }, 1000);
}
</script>

<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00; /* Grüner Schein */
}
.glow-red {
  box-shadow: 0 0 10px rgb(255, 0, 0); /* Roter Schein */
}
</style>
