<template>
  <div class="p-4 flex flex-col gap-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
    <div
      v-for="(filter, index) in store.profileInfo.FilterWheelSettings.FilterWheelFilters"
      :key="index"
      class="border-t border-gray-700 pt-3 first:border-t-0 first:pt-0"
    >
      <SetFilterName
        v-model="filter.Name"
        :settingKey="`FilterWheelSettings-FilterWheelFilters-${index}-Name`"
        class="mb-2"
      />
      <SettingInput
        labelKey="components.filterwheel.settings.FilterWheelFilters.FocusOffset"
        :settingKey="`FilterWheelSettings-FilterWheelFilters-${index}-FocusOffset`"
        :modelValue="filter.FocusOffset"
        class="mb-2"
      />
      <SettingInput
        labelKey="components.filterwheel.settings.FilterWheelFilters.Position"
        :settingKey="`FilterWheelSettings-FilterWheelFilters-${index}-Position`"
        :modelValue="filter.Position"
        class="mb-2"
      />
      <SettingInput
        labelKey="components.filterwheel.settings.FilterWheelFilters.AutoFocusExposureTime"
        :settingKey="`FilterWheelSettings-FilterWheelFilters-${index}-AutoFocusExposureTime`"
        :modelValue="filter.AutoFocusExposureTime"
        :min="-1"
      />
    </div>
  </div>
</template>
<script setup>
import { apiStore } from '@/store/store';
import SettingInput from '@/components/helpers/settings/UpdatePorfileNumber.vue';
import SetFilterName from './SetFilterName.vue';

const store = apiStore();
</script>
