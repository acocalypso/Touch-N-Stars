<template>
  <toggleButton @click="toggleNinaCache" :status-value="settingsStore.framing.useNinaCache" />
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import toggleButton from '@/components/helpers/toggleButton.vue';

const settingsStore = useSettingsStore();

function toggleNinaCache() {
  if (settingsStore.framing.useNinaCache) {
    settingsStore.framing.useNinaCache = false;
    console.log('Hipps nutzen');
  } else {
    settingsStore.framing.useNinaCache = true;
    console.log('cache nutzen');
  }
}
</script>
