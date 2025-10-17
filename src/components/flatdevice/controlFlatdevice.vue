<template>
  <div class="flex flex-col gap-2 w-full">
    <div v-if="store.flatdeviceInfo.SupportsOnOff">
      <div
        class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
      >
        <label for="toggle_light" class="text-gray-400">
          {{ $t('components.flat.toggle_light') }}
        </label>
        <div>
          <toggleButton @click="flatdeviceSetLight" :status-value="store.flatdeviceInfo.LightOn" />
        </div>
      </div>
    </div>

    <div
      v-if="store.flatdeviceInfo.LightOn"
      class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
    >
      <label for="SetBrightness" class="text-gray-400">
        {{ $t('components.flat.brightness') }}
      </label>
      <input
        id="SetBrightness"
        v-model="flatStore.brightness"
        type="number"
        class="default-input h-10 w-24"
        placeholder="1"
        step="1"
        @blur="SetBrightness"
      />
    </div>
    <div v-if="store.flatdeviceInfo.SupportsOpenClose">
      <div
        class="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2 w-full border border-gray-500 p-2 rounded-lg"
      >
        <button @click="closeCover" class="default-button-cyan">
          {{ $t('components.flat.cover.close') }}
        </button>
        <button @click="openCover" class="default-button-cyan">
          {{ $t('components.flat.cover.open') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useFlatStore } from '@/store/flatdeviceStore';
import toggleButton from '@/components/helpers/toggleButton.vue';

const store = apiStore();
const flatStore = useFlatStore();

async function flatdeviceSetLight() {
  try {
    if (store.flatdeviceInfo.LightOn) {
      await apiService.flatdeviceSetLight(false);
      console.log('Flat light off');
    } else {
      flatStore.brightness = 100;
      await apiService.flatdeviceSetLight(true);
      console.log('Flat light on');
    }
  } catch (error) {
    console.log('Error controlling flat light');
  }
}

async function closeCover() {
  try {
    await apiService.flatdeviceSetCover(true);
    console.log('Flat cover closed');
  } catch (error) {
    console.log('Error controlling flat cover');
  }
}

async function openCover() {
  try {
    await apiService.flatdeviceSetCover(false);
    console.log('Flat cover open');
  } catch (error) {
    console.log('Error controlling flat cover');
  }
}

async function SetBrightness() {
  try {
    if (store.flatdeviceInfo.LightOn) {
      if (store.flatdeviceInfo.MinBrightness > flatStore.brightness) {
        flatStore.brightness = store.flatdeviceInfo.MinBrightness;
      } else if (store.flatdeviceInfo.MaxBrightness < flatStore.brightness) {
        flatStore.brightness = store.flatdeviceInfo.MaxBrightness;
      }
      await apiService.flatdeviceSetBrightness(flatStore.brightness);
      console.log('Brightness set');
    }
  } catch (error) {
    console.log('Error controlling flat cover');
  }
}
</script>
