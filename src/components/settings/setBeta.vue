<template>
  <div>
    <div
      class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
    >
      <label for="landscapesVisible" class="text-gray-400">
        {{ $t('components.settings.beta.title') }}
      </label>
      <div>
        <toggleButton
          @update:statusValue="toggleDebug"
          :statusValue="settingsStore.useBetaFeatures || false"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { checkForManualUpdate } from '@/services/updateService';

const settingsStore = useSettingsStore();

async function toggleDebug(value) {
  settingsStore.useBetaFeatures = value;

  // Check for updates when switching update channel
  try {
    console.log('[Beta Settings] Update channel switched, checking for updates...');
    await checkForManualUpdate();
  } catch (error) {
    console.warn('[Beta Settings] Failed to check for updates:', error);
  }
}
</script>
<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00; /* Grüner Schein */
}
</style>
