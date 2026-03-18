<template>
  <div class="flex flex-col bg-gray-900/90 border border-gray-500 p-1 pb-2 rounded-lg">
    <label for="flat-filter" class="text-xs mb-1 text-gray-400">
      {{ $t('components.filterwheel.filter') }}
    </label>
    <select
      id="flat-filter"
      :value="modelValue"
      @change="$emit('update:modelValue', Number($event.target.value))"
      class="default-select h-10"
    >
      <option
        v-for="filter in store.filterInfo.AvailableFilters"
        :key="filter.Id"
        :value="filter.Id"
      >
        {{ filter.Name }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { apiStore } from '@/store/store';

defineProps({ modelValue: Number });
defineEmits(['update:modelValue']);

const store = apiStore();
</script>
