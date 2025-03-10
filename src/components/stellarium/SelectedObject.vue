<template>
  <div
    v-if="selectedObject"
    class="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white p-4 rounded-lg shadow-lg min-w-[250px]"
  >
    <h3 class="text-lg font-semibold">{{ $t('components.stellarium.selected_object.title') }}:</h3>
    <ul class="mt-2">
      <li v-for="(name, index) in selectedObject" :key="index" class="text-sm">
        {{ name }}
      </li>
    </ul>
    <p class="mt-2 text-sm">
      {{ $t('components.stellarium.selected_object.ra') }}: {{ selectedObjectRa }}
    </p>
    <p class="text-sm">
      {{ $t('components.stellarium.selected_object.dec') }}: {{ selectedObjectDec }}
    </p>
    <button
      @click="setFramingCoordinates"
      class="mt-3 px-4 py-2 w-full bg-gray-700 hover:bg-gray-600 rounded-lg shadow-md"
    >
      {{ $t('components.stellarium.selected_object.button_framing') }}
    </button>
    <button
      @click="setFramingCoordinates"
      class="mt-3 px-4 py-2 w-full bg-gray-700 hover:bg-gray-600 rounded-lg shadow-md"
    >
      {{ $t('components.stellarium.selected_object.button_slew') }}
    </button>
    <button
      @click="setFramingCoordinates"
      class="mt-3 px-4 py-2 w-full bg-gray-700 hover:bg-gray-600 rounded-lg shadow-md"
    >
      {{ $t('components.stellarium.selected_object.button_slew_and_center') }}
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  selectedObject: Object,
  selectedObjectRa: String,
  selectedObjectDec: String,
  selectedObjectRaDeg: Number,
  selectedObjectDecDeg: Number,
});

const emit = defineEmits(['setFramingCoordinates']);

function setFramingCoordinates() {
  emit('setFramingCoordinates', {
    raString: props.selectedObjectRa,
    decString: props.selectedObjectDec,
    ra: props.selectedObjectRaDeg,
    dec: props.selectedObjectDecDeg,
    item: props.selectedObject,
  });
}
</script>
