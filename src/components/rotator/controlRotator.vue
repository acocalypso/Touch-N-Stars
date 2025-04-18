<template>
  <div>
    <div class="flex flex-col border border-gray-500 p-1 pb-2 rounded-lg">
      <label for="position" class="text-xs mb-1 text-gray-400">{{
        $t('components.rotator.label')
      }}</label>
      <div class="flex gap-2">
        <input
          id="position"
          v-model.number="store.rotatorMechanicalPosition"
          type="number"
          class="text-black px-4 h-10 w-40 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-700"
          placeholder="1"
          step="1"
        />
        <button
          class="default-button-cyan"
          @click="moveRotator"
          :disabled="store.rotatorInfo.IsMoving"
        >
          <label for="rotatorMove">{{ $t('components.rotator.move') }}</label>
          <svg
            v-if="store.rotatorInfo.IsMoving"
            class="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

const store = apiStore();

async function moveRotator() {
  try {
    await apiService.moveMechanicalRotator(store.rotatorMechanicalPosition);
    console.log('Rotator dreht');
  } catch (error) {
    console.log('Fehler beim parken der Montierung');
  }
}
</script>
