<template>
  <AfFnishGraph v-if="!store.focuserAfInfo.autofocus_running" />
  <AfGraphHocusFocus v-else />
</template>

<script setup>
import AfGraphHocusFocus from '@components/focuser/AfGraphHocusFocus.vue';
import AfFnishGraph from '@components/focuser//AfFnishGraph.vue';
import { apiStore } from '@/store/store';

const store = apiStore();
</script>
