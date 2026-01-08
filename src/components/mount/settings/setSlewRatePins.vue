<template>
  <div class="flex flex-col w-full gap-1">
    <!-- Select Field für SlewRate -->
    <div class="flex flex-row w-full items-center justify-between gap-2">
      <label class="text-gray-300 text-sm">
        {{ $t('components.mount.control.slewRateINDI') }}
      </label>
      <div>
        <select v-model="settingsStore.mount.slewRate" class="default-select">
          <option :value="1">0.25x</option>
          <option :value="2">0.5x</option>
          <option :value="3">1x</option>
          <option :value="4">2x</option>
          <option :value="5">4x</option>
          <option :value="6">8x</option>
          <option :value="7">20x</option>
          <option :value="8">48x</option>
          <option :value="9">Max</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSettingsStore } from '@/store/settingsStore';

const settingsStore = useSettingsStore();
</script>
