<template>
  <div v-if="store.domeInfo.CanSetShutter" class="flex gap-2">
    <ButtonOpenShutter />
    <ButtonStopShutter />
    <ButtonCloseShutter />
  </div>
  <div v-if="store.domeInfo.CanFindHome" class="flex gap-2 mt-2">
    <ButtonHome />
  </div>
  <div v-if="store.domeInfo.CanPark" class="flex gap-2 mt-2">
    <ButtonPark />
  </div>
  <div v-if="store.domeInfo.CanSyncAzimuth" class="flex gap-2 mt-2">
    <ButtonSyncDome />
  </div>
  <div class="flex gap-2 mt-2">
    <ButtonFollow />
  </div>
  <div v-if="store.domeInfo.CanSetAzimuth" class="flex gap-2 mt-2">
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
import { apiStore } from '@/store/store';

const store = apiStore();
</script>
