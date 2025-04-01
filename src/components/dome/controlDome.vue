<template>
  <div class="flex gap-x-2">
    <ButtonOpenShutter />
    <ButtonStopShutter />
    <ButtonCloseShutter />

    
  </div>
</template>

<script setup>
import ButtonOpenShutter from '@/components/dome/ButtonOpenShutter.vue';
import ButtonStopShutter from '@/components/dome/ButtonStopShutter.vue';
import ButtonCloseShutter from '@/components/dome/ButtonCloseShutter.vue';
</script>
