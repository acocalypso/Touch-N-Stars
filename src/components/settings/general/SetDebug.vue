<template>
  <div>
    <div
      class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
    >
      <label for="landscapesVisible" class="text-gray-400">
        {{ $t('components.settings.debug.activate') }}
      </label>
      <div>
        <toggleButton @click="toggleDebug" :status-value="settingsStore.showDebugConsole" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import toggleButton from '@/components/helpers/toggleButton.vue';

const settingsStore = useSettingsStore();

function toggleDebug() {
  settingsStore.showDebugConsole = !settingsStore.showDebugConsole;
  if (settingsStore.showDebugConsole) location.reload(); //Neu laden damit log gerendert wird
}
</script>
<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00; /* Grüner Schein */
}
</style>
