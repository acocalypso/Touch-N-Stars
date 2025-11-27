<template>
  <div class="container w-full flex flex-col items-center justify-center">
    <div class="flex space-x-3 items-center w-full">
      <label for="position" class="w-auto">{{ $t('components.focuser.new_position') }} </label>
      <input
        id="position"
        v-model.number="position"
        type="number"
        class="default-input w-full h-10"
        placeholder="1"
        step="50"
        @focus="openPickerOverlay"
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

// Generate picker options for position (0-255 or adjust range as needed)
const pickerOptions = Array.from({ length: 256 }, (_, i) => ({
  name: i.toString(),
  value: i,
}));

function openPickerOverlay() {
  window.openPickerOverlay('Position', pickerOptions, position.value);
  // Watch for value changes from the global picker
  const checkPickerValue = setInterval(() => {
    const newValue = window.getPickerValue();
    if (newValue !== position.value) {
      position.value = newValue;
    }
  }, 100);

  // Stop watching when picker closes
  const checkPickerOpen = setInterval(() => {
    if (!window.showPickerOverlay?.value) {
      clearInterval(checkPickerValue);
      clearInterval(checkPickerOpen);
    }
  }, 100);
}

async function moveFocuser() {
  try {
    loading.value = true;
    await apiService.moveFocuser(position.value);
  } catch (error) {
    console.error('Error moving focuser:', error);
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
