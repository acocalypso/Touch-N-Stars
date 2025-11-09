<template>
  <div>
    <label class="block text-sm font-medium text-gray-300 mb-2">{{
      $t('components.settings.image.maxDimension')
    }}</label>
    <select
      :value="String(settingsStore.camera.maxDimension)"
      @change="(e) => {
        settingsStore.camera.maxDimension = parseInt(e.target.value);
        updateSetting();
      }"
      :class="[statusClass]"
      class="default-input w-full py-2"
    >
      <option v-for="option in resolutionOptions" :key="option.value" :value="String(option.value)">
        {{ option.label }} ({{ option.value }}px)
      </option>
    </select>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useSettingsStore } from '@/store/settingsStore';

const settingsStore = useSettingsStore();
const statusClass = ref('');

const resolutionOptions = [
  { label: 'Full', value: 4096 },
  { label: 'High', value: 2048 },
  { label: 'Medium', value: 1024 },
  { label: 'Low', value: 512 },
];

async function updateSetting() {
  statusClass.value = 'glow-green';
  console.log(
    `Set max image dimension to ${settingsStore.camera.maxDimension}px`
  );
  setTimeout(() => {
    statusClass.value = '';
  }, 1000);
}
</script>

