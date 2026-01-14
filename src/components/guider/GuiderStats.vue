<template>
  <p class="font-bold">{{ $t('components.guider.rms_error') }}:</p>
  <p>
    RA: {{ store.guiderInfo?.RMSError?.RA.Pixel.toFixed(2) }} ({{
      store.guiderInfo?.RMSError?.RA.Arcseconds.toFixed(2)
    }}")
  </p>
  <p>
    DEC: {{ store.guiderInfo.RMSError?.Dec.Pixel.toFixed(2) }} ({{
      store.guiderInfo?.RMSError?.Dec.Arcseconds.toFixed(2)
    }}")
  </p>
  <p>
    Total: {{ store.guiderInfo.RMSError?.Total.Pixel.toFixed(2) }} ({{
      store.guiderInfo.RMSError?.Total.Arcseconds.toFixed(2)
    }}")
  </p>
</template>

<script setup>
import { apiStore } from '@/store/store';

const store = apiStore();
</script>

<style scoped></style>
