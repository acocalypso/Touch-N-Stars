<template>
  <div class="container w-full flex items-center justify-center">
    <div class="flex space-x-3 items-center w-full">
      <label for="position" class="w-auto">{{ $t('components.focuser.new_position') }} </label>
      <input
        id="position"
        v-model.number="position"
        type="number"
        class="default-input w-full h-10"
        placeholder="1"
        step="50"
      />
      <button class="default-button-cyan" @click="moveFocuser">
        {{ $t('components.focuser.move') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

const store = apiStore();
const position = ref(0);
const loading = ref(false);

async function moveFocuser() {
  try {
    loading.value = true;
    await apiService.moveFocuser(position.value);
  } catch (error) {
    console.error('Fehler beim Bewegen des Fokussierers:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  position.value = store.focuserInfo.Position || 100;
});
watch(
  () => store.focuserInfo.Position,
  (newPosition) => {
    if (newPosition !== position.value) {
      position.value = newPosition;
    }
  }
);
</script>

<style scoped></style>
