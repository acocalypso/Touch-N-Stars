<template>
  <div class="space-y-6">
    <PlateSolverSettingsPanel v-if="store.isBackendReachable" />
  </div>
</template>

<script setup>
import { apiStore } from '@/store/store';
import PlateSolverSettingsPanel from '@/components/settings/PlateSolverSettingsPanel.vue';

const store = apiStore();
</script>
