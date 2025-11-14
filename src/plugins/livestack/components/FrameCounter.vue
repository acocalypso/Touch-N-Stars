<template>
  <div :class="['counter-wrapper mr-2', { 'counter-wrapper--active': isStacking }]">
    <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700/50">
      {{ currentCounter }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useLivestackStore } from '../store/livestackStore';

const store = useLivestackStore();
const {
  isStacking,
  showFilters,
  availableTargets,
  availableFilters,
  selectedTarget,
  selectedFilter,
} = storeToRefs(store);

// Compute current counter reactively
// By including availableTargets and availableFilters in the dependency, Vue will re-compute when ANY item in those arrays changes
const currentCounter = computed(() => {
  // Access the refs to establish dependencies
  availableTargets.value;
  availableFilters.value;

  const target = selectedTarget.value;
  const filter = selectedFilter.value;

  if (target == null) return 0;
  if (showFilters.value) return filter?.count ?? 0;
  return target?.count ?? 0;
});
</script>

<style scoped>
.counter-wrapper {
  position: relative;
}
.counter-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border: 2px solid;
  border-radius: 9999px;
  opacity: 0;
  border-color: rgba(89, 154, 24, 0.6);
  transform: scale(1);
}
.counter-wrapper--active::before {
  opacity: 1;
  border-top-color: rgba(96, 252, 11, 0.9);
  animation: counter-spin 2s linear infinite;
}
@keyframes counter-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
