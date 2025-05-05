<template>
  <div
    v-if="selectedObject"
    class="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white p-4 rounded-lg shadow-lg min-w-[300px]"
  >
    <!-- Overlay mit Spinner um eine versehntliches drücken der Button zu verhindern -->
    <div
      v-if="!buttonsEnabled"
      class="absolute inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center rounded-lg"
    >
      <span class="spinner"></span>
    </div>

    <ul class="mt-2">
      <li v-for="(value, key) in selectedObject" :key="key" class="text-sm">
        {{ key }}: {{ value }}
      </li>
    </ul>

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
      class="flex flex-col gap-2 mt-2"
    >
      <div class="flex gap-1">
        <button @click="setFramingCoordinates" class="default-button-cyan max-w-56">
          {{ $t('components.stellarium.selected_object.button_framing') }}
        </button>
        <SaveFavTargets
          class="w-5 h-5"
          :name="selectedObject[0]"
          :ra="selectedObjectRaDeg"
          :dec="selectedObjectDecDeg"
          :ra-string="selectedObjectRa"
          :dec-string="selectedObjectDec"
        />
      </div>
      <ButtonSlew :raAngle="props.selectedObjectRaDeg" :decAngle="props.selectedObjectDecDeg" />
      <ButtonSlewAndCenter
        :raAngle="props.selectedObjectRaDeg"
        :decAngle="props.selectedObjectDecDeg"
      />
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import ButtonSlew from '@/components/mount/ButtonSlew.vue';
import ButtonSlewAndCenter from '@/components/mount/ButtonSlewAndCenter.vue';
import SaveFavTargets from '@/components/favTargets/SaveFavTargets.vue';

const store = apiStore();
const props = defineProps({
  selectedObject: Object,
  selectedObjectRa: String,
  selectedObjectDec: String,
  selectedObjectRaDeg: Number,
  selectedObjectDecDeg: Number,
});

const emit = defineEmits(['setFramingCoordinates']);
const buttonsEnabled = ref(false);

function setFramingCoordinates() {
  emit('setFramingCoordinates', {
    raString: props.selectedObjectRa,
    decString: props.selectedObjectDec,
    ra: props.selectedObjectRaDeg,
    dec: props.selectedObjectDecDeg,
    item: props.selectedObject,
  });
}
onMounted(() => {
  buttonsEnabled.value = false;
  setTimeout(() => {
    buttonsEnabled.value = true;
  }, 500);
});
</script>
<style scoped>
.spinner {
  display: inline-block;
  width: 3em;
  height: 3em;
  border: 2px solid #bbb;
  border-top-color: #333;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
