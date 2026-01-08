<template>
  <div class="flex flex-col w-full gap-2">
    <div>
      <p class="text-xs sm:text-sm font-medium text-gray-500">
        {{ $t('components.mount.control.slewRate') }} (INDI)
      </p>
    </div>

    <!-- Select Field für SlewRate -->
    <div class="flex flex-row w-full items-center gap-2">
      <select
        v-model="settingsStore.mount.slewRate"
        class="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
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

      <!-- Optionale Anzeige des aktuellen Index -->
      <span class="text-xs text-gray-400 min-w-fit">
        Index: <span class="text-cyan-400 font-semibold">{{ settingsStore.mount.slewRate }}</span>
      </span>
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
