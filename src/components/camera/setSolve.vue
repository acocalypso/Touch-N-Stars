<template>
  <div
    class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
  >
    <label for="toggle_light" class="text-gray-200">
      {{ $t('components.camera.set_use_platesolve') }}
    </label>
    <div>
      <toggleButton
        @click="toggleSolve"
        :status-value="settingsStore.camera.useSolve"
        class="pr-5 pl-5 justify-center"
      />
    </div>
  </div>
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import toggleButton from '@/components/helpers/toggleButton.vue';

const settingsStore = useSettingsStore();

function toggleSolve() {
  if (settingsStore.camera.useSolve) {
    settingsStore.camera.useSolve = false;
    console.log('Platesolve off');
  } else {
    settingsStore.camera.useSolve = true;
    console.log('Platesolve on');
  }
}
</script>
