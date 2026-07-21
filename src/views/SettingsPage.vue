<template>
  <div class="min-h-screen">
    <!-- Titel -->
    <div class="text-left mb-2">
      <h1 class="text-xl text-center font-bold">{{ $t('components.settings.title') }}</h1>
    </div>
    <SettingsComp />
  </div>
</template>

<script setup>
import SettingsComp from '@/components/SettingsComp.vue';
</script>
