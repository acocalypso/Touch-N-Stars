<template>
  <div class="space-y-6">
    <!-- Equipment Section -->
    <div
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.settings.equipment.title') }}
      </h3>
      <p class="text-gray-300 text-sm">
        {{ $t('components.settings.equipment.description') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
