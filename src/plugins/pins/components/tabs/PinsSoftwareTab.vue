<template>
  <div class="flex flex-col space-y-6">
    <div v-if="availableUpdateCount > 0" class="text-center">
      <button
        @click="$emit('open-updates')"
        class="text-amber-300 hover:text-amber-200 underline underline-offset-4 transition-colors"
      >
        {{ $t('plugins.pins.updatesAvailable', { count: availableUpdateCount }) }}
      </button>
    </div>

    <PinsIndi3rdpartyCard
      :drivers="drivers"
      :loading="loading"
      :installing="installing"
      :search-query="searchQuery"
      :selected-asset="selectedAsset"
      :disabled="disabled"
      @refresh="$emit('refresh')"
      @search="$emit('search')"
      @install="$emit('install')"
      @update:search-query="$emit('update:search-query', $event)"
      @update:selected-asset="$emit('update:selected-asset', $event)"
    />
  </div>
</template>

<script setup>
import PinsIndi3rdpartyCard from '../PinsIndi3rdpartyCard.vue';

defineProps({
  availableUpdateCount: {
    type: Number,
    required: true,
  },
  drivers: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
  installing: {
    type: Boolean,
    required: true,
  },
  searchQuery: {
    type: String,
    required: true,
  },
  selectedAsset: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    required: true,
  },
});

defineEmits([
  'open-updates',
  'refresh',
  'search',
  'install',
  'update:search-query',
  'update:selected-asset',
]);
</script>
