<template>
  <div
    class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg"
    v-if="minMove !== null"
  >
    <label for="pixel-size" class="text-sm mr-3 mb-1 text-gray-200">
      {{ $t('components.guider.phd2.ra.MinMove') }}
    </label>
    <input
      @change="debouncedUpdateMinMove"
      id="pixel-size"
      v-model.number="minMove"
      type="number"
      class="ml-auto bg-gray-200 text-black px-3 h-8 w-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-700"
      :class="statusClassMinMove"
      step="0.01"
    />
  </div>

  <div
    class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg"
    v-if="maxMove !== null"
  >
    <label for="pixel-size" class="text-sm mr-3 mb-1 text-gray-200">
      {{ $t('components.guider.phd2.ra.MaxMove') }}
    </label>
    <input
      @change="debouncedUpdateMaxMove"
      id="pixel-size"
      v-model.number="maxMove"
      type="number"
      class="ml-auto bg-gray-200 text-black px-3 h-8 w-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-700"
      :class="statusClassMaxMove"
      step="0.01"
    />
  </div>

  <div
    class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg"
    v-if="aggression !== null"
  >
    <label for="pixel-size" class="text-sm mr-3 mb-1 text-gray-200">
      {{ $t('components.guider.phd2.ra.aggression') }}
    </label>
    <input
      @change="debouncedUpdateAggression"
      id="pixel-size"
      v-model.number="aggression"
      type="number"
      class="ml-auto bg-gray-200 text-black px-3 h-8 w-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-700"
      :class="statusClassAggression"
      step="1"
    />
  </div>

  <div
    class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg"
    v-if="hysteresis !== null"
  >
    <label for="pixel-size" class="text-sm mr-3 mb-1 text-gray-200">
      {{ $t('components.guider.phd2.ra.hysteresis') }}
    </label>
    <input
      @input="debouncedUpdateHysteresis"
      id="pixel-size"
      v-model.number="hysteresis"
      type="number"
      class="ml-auto bg-gray-200 text-black px-3 h-8 w-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-700"
      :class="statusClassHysteresis"
      step="1"
    />
  </div>
</template>

<script setup>
import apiService from '@/services/apiService';
import { onMounted, ref } from 'vue';

const minMove = ref(null);
const maxMove = ref(null);
const aggression = ref(null);
const hysteresis = ref(null);

const statusClassMinMove = ref('');
const statusClassMaxMove = ref('');
const statusClassAggression = ref('');
const statusClassHysteresis = ref('');

const axis = 'ra';

const debouncedUpdateMinMove = debounce(setMinMove, 1000);
async function setMinMove() {
  minMove.value = validatePositiveInput(minMove.value);
  try {
    await apiService.setPHD2AlgoParam(axis, 'minMove', minMove.value);
    statusClassMinMove.value = 'glow-green';
  } catch (error) {
    statusClassMinMove.value = 'glow-red';
    fetchPrameter();
  } finally {
    setTimeout(() => {
      statusClassMinMove.value = '';
    }, 1000);
  }
}

const debouncedUpdateMaxMove = debounce(setMaxMove, 1000);
async function setMaxMove() {
  maxMove.value = validatePositiveInput(maxMove.value);
  try {
    await apiService.setPHD2AlgoParam(axis, 'maxMove', maxMove.value);
    statusClassMaxMove.value = 'glow-green';
  } catch (error) {
    statusClassMaxMove.value = 'glow-red';
    fetchPrameter();
  } finally {
    setTimeout(() => {
      statusClassMaxMove.value = '';
    }, 1000);
  }
}

const debouncedUpdateAggression = debounce(setAggression, 1000);
async function setAggression() {
  aggression.value = validatePositiveInput(aggression.value);
  try {
    await apiService.setPHD2AlgoParam(axis, 'aggression', aggression.value / 100);
    statusClassAggression.value = 'glow-green';
  } catch (error) {
    statusClassAggression.value = 'glow-red';
    fetchPrameter();
  } finally {
    setTimeout(() => {
      statusClassAggression.value = '';
    }, 1000);
  }
}

const debouncedUpdateHysteresis = debounce(setHysteresis, 1000);
async function setHysteresis() {
  hysteresis.value = validatePositiveInput(hysteresis.value);
  try {
    await apiService.setPHD2AlgoParam(axis, 'hysteresis', hysteresis.value / 100);
    statusClassHysteresis.value = 'glow-green';
  } catch (error) {
    statusClassHysteresis.value = 'glow-red';
    fetchPrameter();
  } finally {
    setTimeout(() => {
      statusClassHysteresis.value = '';
    }, 1000);
  }
}

function validatePositiveInput(value) {
  const numericValue = Number(value);
  return numericValue > 0 ? numericValue : 0.01;
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

async function fetchPrameter() {
  // 1. Namen der Parameter holen
  const namesResponse = await apiService.getPhd2AlgoParaName(axis);
  const paramNames = namesResponse.Response.ParameterNames;

  // 2. Für jeden Namen API-Abfrage machen
  for (const name of paramNames) {
    if (name === 'algorithmName') continue;
    const response = await apiService.getPhd2AlgoPara(axis, name);
    const value = response.Response.Value;

    // 3. Abhängig vom Namen in die passende ref speichern
    switch (name) {
      case 'minMove':
        minMove.value = value;
        minMove.value = Math.round( minMove.value * 100) / 100
        break;
      case 'maxMove':
        maxMove.value = value;
        maxMove.value = Math.round( maxMove.value * 100) / 100
        break;
      case 'aggression':
        aggression.value = value * 100;
        aggression.value = Math.round( aggression.value)
        break;
      case 'hysteresis':
        hysteresis.value = value * 100;
        hysteresis.value = Math.round( hysteresis.value)
        break;
      default:
        console.warn('Unbekannter Parameter:', name);
    }
  }

  console.log('minMove:', minMove.value);
  console.log('maxMove:', maxMove.value);
  console.log('aggression:', aggression.value);
  console.log('hysteresis:', hysteresis.value);
}

onMounted(async () => {
  await fetchPrameter();
});
</script>
