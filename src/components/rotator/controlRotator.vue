<template>
  <div>
    <div class="flex flex-col gap-2 border border-line-strong p-1 pb-2 rounded-control">
      <div class="flex flex-col gap-2 items-end">
        <NumberInputPicker
          v-model="rotatorPosition"
          :label="$t('components.rotator.label')"
          labelKey="components.rotator.label"
          :min="-360"
          :max="360"
          :step="0.1"
          :decimalPlaces="1"
          placeholder="1"
          inputId="position"
        />
        <button
          :class="store.rotatorInfo.IsMoving ? 'tns-btn-danger' : 'tns-btn-primary'"
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
import { useHaptics } from '@/composables/useHaptics';
const { tapLight, tapMedium } = useHaptics();

const store = apiStore();
const rotatorPosition = ref(0);

async function moveRotator() {
  tapLight();
  try {
    await apiService.moveMechanicalRotator(rotatorPosition.value);
    console.log('Rotator rotating');
  } catch (error) {
    console.log('Error parking mount');
  }
}

async function moveStop() {
  tapMedium();
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
