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
            'w-full text-left px-3 py-2 text-sm rounded transition-colors flex justify-between items-center',
            selectedTarget === target ? 'default-button-blue' : 'default-button-gray',
          ]"
        >
          <span>{{ target }}</span>
          <span class="text-xs opacity-75">{{ getTargetStackCount(target) }}</span>
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
            'w-full text-left px-3 py-2 text-sm rounded transition-colors flex justify-between items-center',
            selectedFilter === filter && selectedTarget === currentTarget
              ? 'default-button-green'
              : 'default-button-gray',
          ]"
        >
          <span>{{ filter === 'No_filter' ? 'No Filter' : filter }}</span>
          <span class="text-xs opacity-75">{{ getStackCountText(selectedTarget, filter) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import apiService from '@/services/apiService';

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
const stackCounts = ref({}); // Speichert Stack-Counts: { 'target-filter': { mono: 2 } oder { red: 2, green: 2, blue: 2 } }

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

  const uniqueFilters = Array.from(new Set(filters));

  // Sortiere so, dass RGB am Ende steht
  const sorted = uniqueFilters.sort((a, b) => {
    if (a === 'RGB') return 1;  // RGB nach hinten
    if (b === 'RGB') return -1;
    return a.localeCompare(b);  // Andere alphabetisch
  });

  return sorted;
});

const selectTarget = (target) => {
  emit('select-target', target);
};

const selectFilter = (filter) => {
  emit('select-filter', filter);
};

const loadStackCount = async (target, filter, forceRefresh = false) => {
  const key = `${target}-${filter}`;

  // Wenn bereits geladen und nicht erzwungen, nicht erneut abrufen
  if (!forceRefresh && stackCounts.value[key] !== undefined) {
    return;
  }

  try {
    const response = await apiService.livestackImageInfo(target, filter);

    // Prüfe ob Response valide ist
    if (!response || typeof response !== 'object') {
      return;
    }

    // Handle sowohl Success flag als auch direkte Response mit IsMonochrome
    const responseData = response.Response || response;
    const { IsMonochrome, StackCount, RedStackCount, GreenStackCount, BlueStackCount } = responseData;

    if (IsMonochrome !== undefined) {
      if (IsMonochrome) {
        stackCounts.value[key] = {
          mono: StackCount || 0,
        };
      } else {
        stackCounts.value[key] = {
          red: RedStackCount || 0,
          green: GreenStackCount || 0,
          blue: BlueStackCount || 0,
        };
      }
    }
  } catch (error) {
    // Nur bei echten Errors loggen, nicht bei fehlgeschlagenen Requests
    if (error.message && !error.message.includes('Network')) {
      console.debug(`Loading stack info for ${target}/${filter} (this is normal if endpoint not ready yet)`);
    }
  }
};

const invalidateStackCountCache = () => {
  // Cache clearen, damit neue Daten geladen werden
  stackCounts.value = {};
};

const getStackCountText = (target, filter) => {
  const key = `${target}-${filter}`;
  const counts = stackCounts.value[key];

  if (!counts) {
    // Versuche zu laden, wenn noch nicht geladen
    if (target && filter) {
      loadStackCount(target, filter);
    }
    return '';
  }

  let countText = '';
  if (counts.mono !== undefined) {
    countText = counts.mono.toString();
  } else if (counts.red !== undefined && counts.green !== undefined && counts.blue !== undefined) {
    countText = `${counts.red}|${counts.green}|${counts.blue}`;
  }

  return countText ? `[${countText}]` : '';
};

const getTargetStackCount = (target) => {
  // Finde den Mono-Filter mit den meisten Stacks für diesen Target
  if (!target) return '';

  let maxMonoCount = 0;

  // Hole alle Filter für diesen Target aus availableImages
  const filtersForThisTarget = props.availableImages
    .filter((img) => img.Target === target)
    .map((img) => img.Filter);

  // Iteriere durch alle Mono-Filter für diesen Target
  filtersForThisTarget.forEach((filter) => {
    const key = `${target}-${filter}`;
    const counts = stackCounts.value[key];

    // Nur Mono-Filter berücksichtigen (RGB ignorieren)
    if (counts && counts.mono !== undefined) {
      maxMonoCount = Math.max(maxMonoCount, counts.mono);
    }
  });

  return maxMonoCount > 0 ? `[${maxMonoCount}]` : '';
};

// Lade Stack-Counts für alle Filter aller Targets beim Init und bei Änderung
watch(
  () => props.availableImages,
  (newImages) => {
    // Lade Stack-Counts für alle verfügbaren Target/Filter-Kombinationen
    newImages.forEach((img) => {
      loadStackCount(img.Target, img.Filter);
    });
  },
  { immediate: true, deep: true }
);

// Lade auch Stack-Counts für den aktuell ausgewählten Target
watch(
  () => props.selectedTarget,
  (newTarget) => {
    if (newTarget) {
      const filtersForSelectedTarget = props.availableImages
        .filter((img) => img.Target === newTarget)
        .map((img) => img.Filter);

      filtersForSelectedTarget.forEach((filter) => {
        loadStackCount(newTarget, filter);
      });
    }
  }
);

// Expose the invalidateStackCountCache method for parent components
defineExpose({
  invalidateStackCountCache,
});
</script>
