<template>
  <toggleButton @click="toggleNinaCache" :status-value="settingsStore.framing.useNinaCache" />
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import toggleButton from '@/components/helpers/toggleButton.vue';

const settingsStore = useSettingsStore();

function toggleNinaCache() {
  settingsStore.saveUseNinaCache(!settingsStore.framing.useNinaCache);
}
</script>
