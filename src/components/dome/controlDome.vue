<template>
  <div class="grid grid-cols-1 landscape:grid-cols-3 gap-1">
    <ButtonOpenShutter />
    <ButtonStopShutter />
    <ButtonCloseShutter />
  </div>
  <div class="flex gap-2 mt-2">
    <ButtonSyncDome />
  </div>
  <div class="flex gap-2 mt-2">
    <ButtonSlew />
  </div>

</template>

<script setup>
import ButtonOpenShutter from '@/components/dome/ButtonOpenShutter.vue';
import ButtonStopShutter from '@/components/dome/ButtonStopShutter.vue';
import ButtonCloseShutter from '@/components/dome/ButtonCloseShutter.vue';
import ButtonSlew from '@/components/dome/ButtonSlewDome.vue';
import ButtonSyncDome from './ButtonSyncDome.vue';

</script>
