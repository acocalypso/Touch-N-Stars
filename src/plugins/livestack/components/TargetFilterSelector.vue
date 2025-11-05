<template>
  <div class="target-filter-selector">
    <!-- Target Selection -->
    <div class="selector-section">
      <h6 class="text-sm font-semibold text-white mb-2">
        {{ t('plugins.livestack.target') }}
      </h6>
      <div
        class="target-list max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50"
      >
        <button
          v-for="target in uniqueTargets"
          :key="`target-${target}`"
          @click="selectTarget(target)"
          :class="[
            'w-full text-left px-3 py-2 text-sm rounded transition-colors',
            selectedTarget === target ? 'default-button-blue' : 'default-button-gray',
          ]"
        >
          {{ target }}
        </button>
      </div>
    </div>

    <!-- Filter Selection (nur wenn Target ausgewählt) -->
    <div v-if="selectedTarget" class="selector-section mt-3">
      <h6 class="text-sm font-semibold text-white mb-2">
        {{ t('plugins.livestack.available_filters') }}
      </h6>
      <div
        class="filter-list max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50"
      >
        <button
          v-for="(filter, index) in filtersForTarget"
          :key="`filter-${filter}-${index}`"
          @click="selectFilter(filter)"
          :class="[
            'w-full text-left px-3 py-2 text-sm rounded transition-colors',
            selectedFilter === filter && selectedTarget === currentTarget
              ? 'default-button-green'
              : 'default-button-gray',
          ]"
        >
          {{ filter === 'No_filter' ? t('plugins.livestack.no_filter') : filter }}
        </button>
      </div>
    </div>

    <!-- Info Text -->
    <div
      v-if="selectedTarget && filtersForTarget.length === 0"
      class="mt-3 p-2 bg-gray-700/50 rounded text-xs text-gray-400"
    >
      {{ t('plugins.livestack.no_filters_available') }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  availableImages: {
    type: Array,
    required: true,
    default: () => [],
  },
  selectedTarget: {
    type: String,
    default: null,
  },
  selectedFilter: {
    type: String,
    default: null,
  },
  currentTarget: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['select-target', 'select-filter']);

const { t } = useI18n();

// Unique targets from available images
const uniqueTargets = computed(() => {
  const targets = new Set(props.availableImages.map((img) => img.Target));
  return Array.from(targets).sort();
});

// Filters for the selected target
const filtersForTarget = computed(() => {
  if (!props.selectedTarget) return [];
  const filters = props.availableImages
    .filter((img) => img.Target === props.selectedTarget)
    .map((img) => img.Filter);
  return Array.from(new Set(filters)).sort();
});

const selectTarget = (target) => {
  emit('select-target', target);
};

const selectFilter = (filter) => {
  emit('select-filter', filter);
};
</script>
