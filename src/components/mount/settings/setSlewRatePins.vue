<template>
  <div class="flex flex-col w-full gap-2">
    <div>
      <p class="text-xs sm:text-sm font-medium text-gray-500">
        {{ $t('components.mount.control.slewRateINDI') }} 
      </p>
    </div>

    <!-- Select Field für SlewRate -->
    <div class="flex flex-row w-full items-center gap-2">
      <select
        v-model="settingsStore.mount.slewRate"
        class="default-select w-full"
      >
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
</template>

<script setup>
import { useSettingsStore } from '@/store/settingsStore';

const settingsStore = useSettingsStore();
</script>

<style scoped>
select {
  cursor: pointer;
  transition: all 0.2s;
}

select:hover {
  background-color: #1f2937;
}
</style>
