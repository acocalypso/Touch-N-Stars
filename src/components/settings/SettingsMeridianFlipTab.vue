<template>
  <MeridianFlipSettings v-if="store.isBackendReachable" />
</template>

<script setup>
import { apiStore } from '@/store/store';
import MeridianFlipSettings from '@/components/mount/settings/MeridianFlipSettings.vue';

const store = apiStore();
</script>
