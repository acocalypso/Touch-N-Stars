<template>
  <div>
    <div class="flex flex-col gap-2 border border-gray-500 p-1 pb-2 rounded-lg">
      <div class="flex flex-col gap-2 items-end">
        <NumberInputPicker
          v-model="store.rotatorMechanicalPosition"
          :label="$t('components.rotator.label')"
          labelKey="components.rotator.label"
          :min="0"
          :max="360"
          :step="1"
          :decimalPlaces="0"
          placeholder="1"
          inputId="position"
        />
        <button
          class="default-button-cyan h-7 md:h-8"
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
      <rotatorReverse />
    </div>
  </div>
</template>

<script setup>
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const store = apiStore();

async function moveRotator() {
  try {
    await apiService.moveMechanicalRotator(store.rotatorMechanicalPosition);
    console.log('Rotator rotating');
  } catch (error) {
    console.log('Error parking mount');
  }
}
</script>
