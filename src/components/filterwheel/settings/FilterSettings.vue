<template>
  <div class="p-4 flex flex-col gap-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
    <SettingInput labelKey="" settingKey="" storeKey="" :min="0" :max="1" step="0.1" />
  </div>
</template>
<script setup>
import SettingInput from '@/components/helpers/settings/SettingInput.vue';
import SettingSelect from '@/components/helpers/settings/SettingSelect.vue';
</script>
