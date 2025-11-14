<template>
  <div :class="[isPortrait ? 'flex-col space-y-2' : 'flex']">
    <ButtonWithOptions
      ref="targetButtonRef"
      :availableOptions="availableTargets"
      :currentOption="selectedTarget"
      :placeholder="'No target'"
      :fullWidth="isPortrait"
      @optionSelected="selectTarget($event)"
      @open="handleTargetOpen"
      @close="handleTargetClose"
    />

    <ButtonWithOptions
      v-show="showFilters"
      ref="filterButtonRef"
      :availableOptions="availableFilters"
      :currentOption="selectedFilter"
      :placeholder="'No filter'"
      :fullWidth="isPortrait"
      @optionSelected="selectFilter($event)"
      @open="handleFilterOpen"
      @close="handleFilterClose"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import ButtonWithOptions from './ButtonWithOptions.vue';
import { useLivestackStore } from '../store/livestackStore.js';

const store = useLivestackStore();
const { availableTargets, selectedTarget, availableFilters, selectedFilter, showFilters } =
  storeToRefs(store);

const props = defineProps({
  isPortrait: {
    type: Boolean,
    default: false,
  },
});

// State variables
const targetButtonRef = ref(null);
const filterButtonRef = ref(null);
const targetDropdownOpen = ref(false);
const filterDropdownOpen = ref(false);

const selectTarget = (item) => {
  targetDropdownOpen.value = false;
  store.selectTarget(item.label);
};

const selectFilter = (item) => {
  filterDropdownOpen.value = false;
  store.selectFilter(item.label);
};

const handleTargetOpen = () => {
  targetDropdownOpen.value = true;
  filterDropdownOpen.value = false;
  filterButtonRef.value?.closeList();
};

const handleTargetClose = () => {
  targetDropdownOpen.value = false;
};

const handleFilterOpen = () => {
  filterDropdownOpen.value = true;
  targetDropdownOpen.value = false;
  targetButtonRef.value?.closeList();
};

const handleFilterClose = () => {
  filterDropdownOpen.value = false;
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
    const { IsMonochrome, StackCount, RedStackCount, GreenStackCount, BlueStackCount } =
      responseData;

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
      console.debug(
        `Loading stack info for ${target}/${filter} (this is normal if endpoint not ready yet)`
      );
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
