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

const settingsStore = useSettingsStore();

async function toggleDebug(value) {
  settingsStore.useBetaFeatures = value;

  // Trigger update check in App.vue via custom event
  // Pass reset flag to clear dismissed version when switching channels
  console.log('[Beta Settings] Update channel switched, triggering update check...');
  window.dispatchEvent(new CustomEvent('check-app-update', { detail: { resetDismissed: true } }));
}
</script>
<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00; /* Grüner Schein */
}
</style>
