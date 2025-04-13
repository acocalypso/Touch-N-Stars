<template>
  <div class="flex gap-2">
    <ButtonOpenShutter />
    <ButtonStopShutter />
    <ButtonCloseShutter />
  </div>
  <div class="flex gap-2 mt-2">
    <ButtonHome />
  </div>
  <div class="flex gap-2 mt-2">
    <ButtonPark />
  </div>
  <div class="flex gap-2 mt-2">
    <ButtonSyncDome />
  </div>
  <div class="flex gap-2 mt-2">
    <ButtonFollow />
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
import ButtonSyncDome from '@/components/dome/ButtonSyncDome.vue';
import ButtonHome from '@/components/dome/ButtonHome.vue';
import ButtonPark from '@/components/dome/ButtonPark.vue';
import ButtonFollow from '@/components/dome/ButtonFollow.vue';
</script>
