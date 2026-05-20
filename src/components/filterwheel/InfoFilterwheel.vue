<template>
  <div v-if="!store.filterInfo.Connected" class="text-red-500">
    <p>{{ $t('components.filterwheel.please_connect_filterwheel') }}</p>
  </div>
  <div v-else class="gap-2 grid grid-cols-2 landscape:grid-cols-3">
    <StatusString
      :isEnabled="store.filterInfo.SelectedFilter && store.filterInfo.SelectedFilter.Name"
      :Name="$t('components.filterwheel.currentFilter')"
      :Value="store.filterInfo.SelectedFilter ? store.filterInfo.SelectedFilter.Name : ''"
    />
    <StatusString
      :isEnabled="
        store.filterInfo.SelectedFilter && store.filterInfo.SelectedFilter.Position !== undefined
      "
      :Name="$t('components.filterwheel.position')"
      :Value="
        store.filterInfo.SelectedFilter && store.filterInfo.SelectedFilter.Position !== undefined
          ? store.filterInfo.SelectedFilter.Position
          : ''
      "
    />
    <StatusString
      :isEnabled="store.filterInfo.AvailableFilters && store.filterInfo.AvailableFilters.length > 0"
      :Name="$t('components.filterwheel.availableFilters')"
      :Value="store.filterInfo.AvailableFilters ? store.filterInfo.AvailableFilters.length : 0"
    />
    <template
      v-if="
        store.isPINS &&
        filterStore.filterwheelSettings &&
        Object.keys(filterStore.filterwheelSettings).length > 0
      "
    >
      <StatusString
        v-if="filterStore.filterwheelSettings.BoardTemperature !== undefined"
        :isEnabled="true"
        :Name="$t('components.filterwheel.BoardTemperature')"
        :Value="filterStore.filterwheelSettings.BoardTemperature + ' °C'"
      />
      <StatusString
        v-if="
          filterStore.filterwheelSettings.States !== undefined &&
          filterStore.filterwheelSettings.State !== undefined
        "
        :isEnabled="true"
        :Name="$t('components.filterwheel.State')"
        :Value="
          filterStore.filterwheelSettings.States[filterStore.filterwheelSettings.State] ??
          filterStore.filterwheelSettings.State
        "
      />
      <StatusString
        v-if="filterStore.filterwheelSettings.Counter !== undefined"
        :isEnabled="true"
        :Name="$t('components.filterwheel.Counter')"
        :Value="filterStore.filterwheelSettings.Counter"
      />
    </template>
  </div>
</template>

<script setup>
import StatusString from '@/components/helpers/StatusString.vue';
import { apiStore } from '@/store/store';
import { useFilterStore } from '@/store/filterStore';

const store = apiStore();
const filterStore = useFilterStore();
</script>
