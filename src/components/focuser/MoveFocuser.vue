<template>
  <div class="container flex items-center justify-center">
    <div class="border border-gray-400/50 bg-gray-900/90 p-3 rounded-md">
      <div class="flex space-x-3 items-center">
        <label for="position" class="w-auto">{{ $t('components.focuser.new_position') }}</label>
        <input
          id="position"
          v-model.number="position"
          type="number"
          class="text-black px-4 h-10 w-full border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-700"
          placeholder="1"
          step="50"
        />
        <button class="default-button-cyan" @click="moveFocuser">
          {{ $t('components.focuser.move') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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
</script>

<style scoped></style>
