<template>
  <div>
    <div class="space-y-1 border border-gray-500 p-1 md:p-2 pb-2 rounded-lg">
      <label for="Cooler" class="text-xs mb-1 text-gray-200"
        >{{ $t('components.camera.chip_settings.title') }}
      </label>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <!-- Pixel Size -->
        <div
          class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 md:p-2 rounded-lg"
        >
          <label for="pixel-size" class="text-xs md:text-sm mr-3 mb-1 text-gray-200">
            {{ $t('components.camera.chip_settings.pixel_size') }}
          </label>
          <input
            @blur="updatePixelSize"
            @change="updatePixelSize"
            id="pixel-size"
            v-model.number="pixelSize"
            type="number"
            class="default-input ml-auto h-7 md:h-8 w-20 md:w-28"
            :class="statusClassPixelSize"
            step="0.01"
          />
        </div>

        <!-- Chip Height -->
        <div
          class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 md:p-2 rounded-lg"
        >
          <label for="chip-high" class="text-xs md:text-sm mr-3 mb-1 text-gray-200">
            {{ $t('components.camera.chip_settings.height') }}
          </label>
          <input
            @blur="updateChipHigh"
            @change="updateChipHigh"
            id="chip-high"
            v-model.number="chipHigh"
            type="number"
            class="default-input ml-auto h-7 md:h-8 w-20 md:w-28"
            :class="statusClassChipHigh"
            step="1"
          />
        </div>

        <!-- Chip Width -->
        <div
          class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 md:p-2 rounded-lg"
        >
          <label for="chip-width" class="text-xs md:text-sm mr-3 mb-1 text-gray-200">
            {{ $t('components.camera.chip_settings.width') }}
          </label>
          <input
            @blur="updateChipWidth"
            @change="updateChipWidth"
            id="chip-width"
            v-model.number="chipWidth"
            type="number"
            class="default-input ml-auto h-7 md:h-8 w-20 md:w-28"
            :class="statusClassChipWidth"
            step="1"
          />
        </div>

        <!-- Focal Length -->
        <div
          class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 md:p-2 rounded-lg"
        >
          <label for="focal-length" class="text-xs md:text-sm mr-3 mb-1 text-gray-200">
            {{ $t('components.camera.chip_settings.focal_length') }}
          </label>
          <input
            @blur="updateFocalLength"
            @change="updateFocalLength"
            id="focal-length"
            v-model.number="focalLength"
            type="number"
            class="default-input ml-auto h-7 md:h-8 w-20 md:w-28"
            :class="statusClassFocalLength"
            step="1"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

const store = apiStore();

const pixelSize = ref(0);
const focalLength = ref(0);
const chipHigh = ref(0);
const chipWidth = ref(0);

const statusClassPixelSize = ref('');
const statusClassFocalLength = ref('');
const statusClassChipHigh = ref('');
const statusClassChipWidth = ref('');

async function updateValue(key, value, statusClassRef) {
  try {
    const response = await apiService.profileChangeValue(key, value);
    console.log(`Response [${key}]:`, response);
    statusClassRef.value = 'glow-green';
  } catch (error) {
    console.error(`Error updating ${key}:`, error);
  } finally {
    setTimeout(() => {
      statusClassRef.value = '';
    }, 1000);
  }
}

const updatePixelSize = () =>
  updateValue('CameraSettings-PixelSize', pixelSize.value, statusClassPixelSize);
const updateFocalLength = () =>
  updateValue('TelescopeSettings-FocalLength', focalLength.value, statusClassFocalLength);
const updateChipHigh = () =>
  updateValue('FramingAssistantSettings-CameraHeight', chipHigh.value, statusClassChipHigh);
const updateChipWidth = () =>
  updateValue('FramingAssistantSettings-CameraWidth', chipWidth.value, statusClassChipWidth);

onMounted(() => {
  const profile = store.profileInfo;
  pixelSize.value = profile?.CameraSettings?.PixelSize || 5.0;
  focalLength.value = profile?.TelescopeSettings?.FocalLength || 500;
  chipHigh.value = profile?.FramingAssistantSettings?.CameraHeight || 1501;
  chipWidth.value = profile?.FramingAssistantSettings?.CameraWidth || 3001;
});
</script>
