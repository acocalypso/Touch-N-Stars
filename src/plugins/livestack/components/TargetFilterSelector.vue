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
</script>
