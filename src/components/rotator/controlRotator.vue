<template>
  <div>
    <div class="flex flex-col gap-2 border border-gray-500 p-1 pb-2 rounded-lg">
      <div class="flex flex-col gap-2 items-end">
        <NumberInputPicker
          v-model="rotatorPosition"
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
          :class="
            store.rotatorInfo.IsMoving
              ? 'default-button-red h-7 md:h-8'
              : 'default-button-cyan h-7 md:h-8'
          "
          @click="store.rotatorInfo.IsMoving ? moveStop() : moveRotator()"
        >
          <StopIcon v-if="store.rotatorInfo.IsMoving" class="h-5 w-5 text-white" />
          <label v-else for="rotatorMove">{{ $t('components.rotator.move') }}</label>
        </button>
      </div>
      <rotatorReverse />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { StopIcon } from '@heroicons/vue/24/outline';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const store = apiStore();
const rotatorPosition = ref(0);

async function moveRotator() {
  try {
    await apiService.moveMechanicalRotator(rotatorPosition.value);
    console.log('Rotator rotating');
  } catch (error) {
    console.log('Error parking mount');
  }
}

async function moveStop() {
  try {
    await apiService.rotatorAction('stop-move');
    console.log('Rotator stopped');
  } catch (error) {
    console.log('Error parking mount');
  }
}

onMounted(() => {
  rotatorPosition.value = store.rotatorInfo.MechanicalPosition;
});
</script>
