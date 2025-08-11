<template>
  <div class="flex gap-1">
    <button class="default-button-cyan" @click="changeBigMinus" :disabled="isMoving">
      <div
        v-if="loadingButton === 'changeBigMinus'"
        class="ml-2 w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
      ></div>
      <label v-else><ChevronDoubleLeftIcon class="w-7 h-7" /></label>
    </button>
    <button class="default-button-cyan" @click="changeSmallMinus" :disabled="isMoving">
      <div
        v-if="loadingButton === 'changeSmallMinus'"
        class="ml-2 w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
      ></div>
      <label v-else><ChevronLeftIcon class="w-7 h-7" /></label>
    </button>
    <button class="default-button-cyan" @click="changeSmallPlus" :disabled="isMoving">
      <div
        v-if="loadingButton === 'changeSmallPlus'"
        class="ml-2 w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
      ></div>
      <label v-else><ChevronRightIcon class="w-7 h-7" /></label>
    </button>
    <button class="default-button-cyan" @click="changeBigPlus" :disabled="isMoving">
      <div
        v-if="loadingButton === 'changeBigPlus'"
        class="ml-2 w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
      ></div>
      <label v-else><ChevronDoubleRightIcon class="w-7 h-7" /></label>
    </button>
  </div>
</template>
<script setup>
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import { ref, watch } from 'vue';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/vue/24/outline';

const store = apiStore();
const afStepsize = store.profileInfo.FocuserSettings.AutoFocusStepSize;
const isMoving = ref(false);
const loadingButton = ref(null);
const timeoutId = ref(null); // ID für den Timeout

async function moveFocuser(newPosiont) {
  const currentPosition = store.focuserInfo.Position;
  newPosiont = Math.max(0, newPosiont);
  try {
    console.log('Change focuser positon from', currentPosition, 'to', newPosiont);
    const response = await apiService.moveFocuser(newPosiont);
    isMoving.value = true;

    if (timeoutId.value) clearTimeout(timeoutId.value);
    timeoutId.value = setTimeout(() => {
      console.warn('Timeout reached – resetting loading state');
      loadingButton.value = null;
      isMoving.value = false;
    }, 5000); //  5 Sekunden
  } catch (error) {
    console.error(`Error updating:`, error);
  }
}

async function changeBigMinus() {
  loadingButton.value = 'changeBigMinus';
  const currentPosition = store.focuserInfo.Position;
  let newPosiont = currentPosition - afStepsize * 5;
  moveFocuser(newPosiont);
}

async function changeSmallMinus() {
  loadingButton.value = 'changeSmallMinus';
  const currentPosition = store.focuserInfo.Position;
  let newPosiont = currentPosition - afStepsize / 2;
  moveFocuser(newPosiont);
}

async function changeBigPlus() {
  loadingButton.value = 'changeBigPlus';
  const currentPosition = store.focuserInfo.Position;
  let newPosiont = currentPosition + afStepsize * 5;
  moveFocuser(newPosiont);
}

async function changeSmallPlus() {
  loadingButton.value = 'changeSmallPlus';
  const currentPosition = store.focuserInfo.Position;
  let newPosiont = currentPosition + afStepsize / 2;
  moveFocuser(newPosiont);
}

watch(
  () => store.focuserInfo.IsMoving,
  (newVal) => {
    isMoving.value = newVal;
    if (newVal === false) {
      loadingButton.value = null;
    }
  }
);
</script>
