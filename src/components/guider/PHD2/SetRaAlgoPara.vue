<template>
  <NumberInputPicker
    v-if="minMove !== null"
    v-model="minMove"
    :label="$t('components.guider.phd2.ra.MinMove')"
    labelKey="components.guider.phd2.ra.MinMove"
    :min="0"
    :max="1"
    :step="0.01"
    :decimalPlaces="2"
    inputId="min-move"
    @change="debouncedUpdateMinMove"
  />

  <NumberInputPicker
    v-if="maxMove !== null"
    v-model="maxMove"
    :label="$t('components.guider.phd2.ra.MaxMove')"
    labelKey="components.guider.phd2.ra.MaxMove"
    :min="0"
    :max="10"
    :step="0.01"
    :decimalPlaces="2"
    inputId="max-move"
    @change="debouncedUpdateMaxMove"
  />

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
      class="default-input ml-auto h-8 w-28"
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
      class="default-input ml-auto h-8 w-28"
      :class="statusClassHysteresis"
      step="1"
    />
  </div>

  <div
    class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg"
    v-if="predictiveWeight !== null"
  >
    <label for="predictive-weight" class="text-sm mr-3 mb-1 text-gray-200">
      {{ $t('components.guider.phd2.ra.predictive_weight') }}
    </label>
    <input
      @input="debouncedUpdatePredictiveWeight"
      id="predictive-weight"
      v-model.number="predictiveWeight"
      type="number"
      class="default-input ml-auto h-8 w-28"
      :class="statusClassPredictiveWeight"
      step="1"
    />
  </div>

  <div
    class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg"
    v-if="reactiveWeight !== null"
  >
    <label for="reactive-weight" class="text-sm mr-3 mb-1 text-gray-200">
      {{ $t('components.guider.phd2.ra.reactive_weight') }}
    </label>
    <input
      @input="debouncedUpdateReactiveWeight"
      id="reactive-weight"
      v-model.number="reactiveWeight"
      type="number"
      class="default-input ml-auto h-8 w-28"
      :class="statusClassReactiveWeight"
      step="1"
    />
  </div>

  <NumberInputPicker
    v-if="slopeWeight !== null"
    v-model="slopeWeight"
    :label="$t('components.guider.phd2.ra.slope_weight')"
    labelKey="components.guider.phd2.ra.slope_weight"
    :min="0"
    :max="1"
    :step="0.01"
    :decimalPlaces="2"
    inputId="slope-weight"
    @change="debouncedUpdateSlopeWeight"
  />
  <NumberInputPicker
    v-if="expFactor !== null"
    v-model="expFactor"
    :label="$t('components.guider.phd2.ra.exp_factor')"
    labelKey="components.guider.phd2.ra.exp_factor"
    :min="0"
    :max="5"
    :step="0.1"
    :decimalPlaces="1"
    inputId="exp-factor"
    @change="debouncedUpdateExpFactor"
  />
</template>

<script setup>
import apiService from '@/services/apiService';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import { onMounted, ref } from 'vue';

const minMove = ref(null);
const maxMove = ref(null);
const aggression = ref(null);
const hysteresis = ref(null);
const predictiveWeight = ref(null);
const reactiveWeight = ref(null);
const periodLength = ref(null);
const slopeWeight = ref(null);
const expFactor = ref(null);

const axis = 'ra';

const debouncedUpdateExpFactor = debounce(setExpFactor, 1000);
async function setExpFactor() {
  expFactor.value = validatePositiveInput(expFactor.value);
  try {
    await apiService.setPHD2AlgoParam(axis, 'expFactor', expFactor.value);
  } catch (error) {
    fetchPrameter();
  }
}

const debouncedUpdateSlopeWeight = debounce(setSlopeWeight, 1000);
async function setSlopeWeight() {
  slopeWeight.value = validatePositiveInput(slopeWeight.value);
  try {
    await apiService.setPHD2AlgoParam(axis, 'slopeWeight', slopeWeight.value);
  } catch (error) {
    fetchPrameter();
  }
}

const debouncedUpdatePredictiveWeight = debounce(setPredictiveWeight, 1000);
async function setPredictiveWeight() {
  predictiveWeight.value = validatePositiveInput(predictiveWeight.value);
  try {
    await apiService.setPHD2AlgoParam(axis, 'predictiveWeight', predictiveWeight.value / 100);
  } catch (error) {
    fetchPrameter();
  }
}

const debouncedUpdateReactiveWeight = debounce(setReactiveWeight, 1000);
async function setReactiveWeight() {
  reactiveWeight.value = validatePositiveInput(reactiveWeight.value);
  try {
    await apiService.setPHD2AlgoParam(axis, 'reactiveWeight', reactiveWeight.value / 100);
  } catch (error) {
    fetchPrameter();
  }
}

const debouncedUpdateMinMove = debounce(setMinMove, 1000);
async function setMinMove() {
  minMove.value = validatePositiveInput(minMove.value);
  try {
    await apiService.setPHD2AlgoParam(axis, 'minMove', minMove.value);
  } catch (error) {
    fetchPrameter();
  }
}

const debouncedUpdateMaxMove = debounce(setMaxMove, 1000);
async function setMaxMove() {
  maxMove.value = validatePositiveInput(maxMove.value);
  try {
    await apiService.setPHD2AlgoParam(axis, 'maxMove', maxMove.value);
  } catch (error) {
    fetchPrameter();
  }
}

const debouncedUpdateAggression = debounce(setAggression, 1000);
async function setAggression() {
  aggression.value = validatePositiveInput(aggression.value);
  try {
    await apiService.setPHD2AlgoParam(axis, 'aggression', aggression.value / 100);
  } catch (error) {
    fetchPrameter();
  }
}

const debouncedUpdateHysteresis = debounce(setHysteresis, 1000);
async function setHysteresis() {
  hysteresis.value = validatePositiveInput(hysteresis.value);
  try {
    await apiService.setPHD2AlgoParam(axis, 'hysteresis', hysteresis.value / 100);
  } catch (error) {
    fetchPrameter();
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
        minMove.value = Math.round(minMove.value * 100) / 100;
        break;
      case 'maxMove':
        maxMove.value = value;
        maxMove.value = Math.round(maxMove.value * 100) / 100;
        break;
      case 'aggression':
        aggression.value = value * 100;
        aggression.value = Math.round(aggression.value);
        break;
      case 'hysteresis':
        hysteresis.value = value * 100;
        hysteresis.value = Math.round(hysteresis.value);
        break;
      case 'predictiveWeight':
        predictiveWeight.value = value * 100;
        predictiveWeight.value = Math.round(predictiveWeight.value);
        break;
      case 'reactiveWeight':
        reactiveWeight.value = value * 100;
        reactiveWeight.value = Math.round(reactiveWeight.value);
        break;
      case 'periodLength':
        periodLength.value = value * 100;
        periodLength.value = Math.round(periodLength.value);
        break;
      case 'slopeWeight':
        slopeWeight.value = value;
        slopeWeight.value = Math.round(slopeWeight.value * 100) / 100;
        break;
      case 'expFactor':
        expFactor.value = value;
        expFactor.value = Math.round(expFactor.value * 100) / 100;
        break;
      default:
        console.warn('Unbekannter Parameter:', name);
    }
  }

  console.log('minMove:', minMove.value);
  console.log('maxMove:', maxMove.value);
  console.log('aggression:', aggression.value);
  console.log('hysteresis:', hysteresis.value);
  console.log('predictiveWeight:', predictiveWeight.value);
  console.log('reactiveWeight:', reactiveWeight.value);
  console.log('periodLength:', periodLength.value);
  console.log('slopeWeight:', slopeWeight.value);
  console.log('expFactor:', expFactor.value);
}

onMounted(async () => {
  await fetchPrameter();
});
</script>
