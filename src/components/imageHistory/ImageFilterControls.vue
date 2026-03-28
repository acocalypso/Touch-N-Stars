<template>
  <div class="flex flex-wrap items-center gap-2 px-2 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
    <select
      :value="filter.selectedTarget"
      @change="settingsStore.setImageFilterTarget($event.target.value === '' ? null : $event.target.value)"
      class="default-select flex-1 min-w-[110px]"
    >
      <option value="">{{ $t('components.sequence.imageFilter.allTargets') }}</option>
      <option v-for="t in availableTargets" :key="t" :value="t">{{ t }}</option>
    </select>

    <select
      :value="filter.selectedFilter"
      @change="settingsStore.setImageFilterFilter($event.target.value === '' ? null : $event.target.value)"
      class="default-select flex-1 min-w-[110px]"
    >
      <option value="">{{ $t('components.sequence.imageFilter.allFilters') }}</option>
      <option v-for="f in availableFilters" :key="f" :value="f">{{ f }}</option>
    </select>

    <select
      :value="filter.selectedNight"
      @change="settingsStore.setImageFilterNight($event.target.value === '' ? null : $event.target.value)"
      class="default-select flex-1 min-w-[120px]"
    >
      <option value="">{{ $t('components.sequence.imageFilter.allNights') }}</option>
      <option v-for="n in availableNights" :key="n" :value="n">{{ formatNightLabel(n) }}</option>
    </select>

    <select
      :value="filter.selectedImageType"
      @change="settingsStore.setImageFilterImageType($event.target.value === '' ? null : $event.target.value)"
      class="default-select flex-1 min-w-[100px]"
    >
      <option value="">{{ $t('components.sequence.imageFilter.allImageTypes') }}</option>
      <option v-for="type in availableImageTypes" :key="type" :value="type">{{ type }}</option>
    </select>

    <button
      v-if="isAnyFilterActive"
      @click="settingsStore.resetImageFilter()"
      class="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-all duration-150 whitespace-nowrap"
    >
      {{ $t('components.sequence.imageFilter.reset') }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '@/store/settingsStore';
import { useImageFilter } from '@/composables/useImageFilter';

const settingsStore = useSettingsStore();
const { filter, availableTargets, availableFilters, availableNights, availableImageTypes } = useImageFilter();

const isAnyFilterActive = computed(
  () =>
    filter.value.selectedTarget !== null ||
    filter.value.selectedFilter !== null ||
    filter.value.selectedNight !== null ||
    filter.value.selectedImageType !== null
);

function formatNightLabel(nightKey) {
  const date = new Date(nightKey + 'T12:00:00');
  return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}
</script>
