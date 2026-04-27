<template>
  <div class="flex flex-col w-full gap-1">
    <p class="text-xs sm:text-sm min-w-24 sm:min-w-32 font-medium text-gray-500">
      {{ $t('components.mount.control.slewRate') }}
    </p>

    <div class="relative pt-3 pb-5">
      <div
        class="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 rounded-full -translate-y-1/2"
      ></div>

      <div
        class="absolute top-1/2 left-0 h-1 bg-cyan-800 rounded-full -translate-y-1/2 pointer-events-none"
        :style="{ width: `${(currentIndex / 9) * 100}%` }"
      ></div>

      <div
        v-for="i in 10"
        :key="`tick-${i}`"
        class="absolute top-1/2 w-px h-2 bg-gray-500 -translate-y-1/2 pointer-events-none"
        :style="{ left: `${((i - 1) / 9) * 100}%` }"
      ></div>

      <span
        class="absolute bottom-0 left-0 text-[10px] text-gray-500 pointer-events-none select-none leading-none"
      >
        min
      </span>
      <span
        class="absolute bottom-0 right-0 text-[10px] text-gray-500 pointer-events-none select-none leading-none"
      >
        max
      </span>

      <div
        class="absolute top-1/2 w-2 h-6 rounded-md bg-cyan-500 -translate-y-1/2 -translate-x-1/2 pointer-events-none shadow-lg"
        :style="{ left: `${(currentIndex / 9) * 100}%` }"
      ></div>

      <input
        type="range"
        min="0"
        max="9"
        step="1"
        :value="currentIndex"
        @input="onInput"
        class="absolute w-full top-1/2 -translate-y-1/2 h-8 appearance-none bg-transparent cursor-pointer slider-input"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '@/store/settingsStore';

const SNAP_VALUES = [0.01, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const settingsStore = useSettingsStore();

const currentIndex = computed(() => {
  const v = settingsStore.mount.slewRate;
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < SNAP_VALUES.length; i++) {
    const d = Math.abs(SNAP_VALUES[i] - v);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
});

function onInput(event) {
  const idx = parseInt(event.target.value, 10);
  settingsStore.mount.slewRate = SNAP_VALUES[idx];
  settingsStore.saveMountSettings();
}
</script>

<style scoped>
.slider-input {
  -webkit-appearance: none;
  appearance: none;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.slider-input::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  border: none;
}

.slider-input::-webkit-slider-runnable-track {
  background: transparent;
  height: 8px;
  border: none;
}

.slider-input::-moz-range-track {
  background: transparent;
  border: none;
}
</style>
