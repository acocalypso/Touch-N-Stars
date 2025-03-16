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
    <div
      v-if="store.mountInfo.Connected && !store.sequenceRunning"
      class="flex flex-col gap-1 text-sm mt-2"
    >
      <button
        @click="setFramingCoordinates"
        class="default-button-cyan flex items-center justify-center disabled:opacity-50"
      >
        {{ $t('components.stellarium.selected_object.button_framing') }}
      </button>
      <ButtonSlew :raAngle="props.selectedObjectRaDeg" :decAngle="props.selectedObjectDecDeg" />
      <ButtonSlewAndCenter
        :raAngle="props.selectedObjectRaDeg"
        :decAngle="props.selectedObjectDecDeg"
      />
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { apiStore } from '@/store/store';
import ButtonSlew from '@/components/mount/ButtonSlew.vue';
import ButtonSlewAndCenter from '@/components/mount/ButtonSlewAndCenter.vue';

const store = apiStore();
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
