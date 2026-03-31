<template>
  <div class="flex flex-col bg-gray-900/90 border border-gray-500 p-2 rounded-lg gap-1">
    <label class="text-xs text-gray-400">{{ $t('components.filterwheel.filter') }}</label>
    <div
      v-for="filter in store.filterInfo.AvailableFilters"
      :key="filter.Id"
      class="flex items-center gap-2 cursor-pointer select-none py-1 px-1 rounded hover:bg-gray-700 transition-colors"
      @click="toggle(filter)"
    >
      <div
        class="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors"
        :class="
          isSelected(filter.Id) ? 'bg-cyan-500 border-cyan-400' : 'border-gray-500 bg-gray-800'
        "
      >
        <svg
          v-if="isSelected(filter.Id)"
          class="w-3 h-3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="3"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span class="text-sm text-gray-200">{{ filter.Name }}</span>
    </div>
    <p v-if="!store.filterInfo.AvailableFilters?.length" class="text-xs text-gray-500 italic">
      {{ $t('components.flatassistant.no_filters_available') }}
    </p>
  </div>
</template>

<script setup>
import { apiStore } from '@/store/store';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

const store = apiStore();

function isSelected(id) {
  return props.modelValue.some((f) => f.id === id);
}

function toggle(filter) {
  if (isSelected(filter.Id)) {
    emit(
      'update:modelValue',
      props.modelValue.filter((f) => f.id !== filter.Id)
    );
  } else {
    emit('update:modelValue', [...props.modelValue, { id: filter.Id, name: filter.Name }]);
  }
}
</script>
