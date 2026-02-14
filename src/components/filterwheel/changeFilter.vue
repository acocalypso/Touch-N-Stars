<template>
  <div class="">
    <div class="flex flex-col bg-gray-900/90 border border-gray-500 p-1 pb-2 rounded-lg h-full">
      <label for="filter" class="text-xs mb-1 text-gray-400"
        >{{ $t('components.filterwheel.filter') }}
      </label>

      <select
        id="filter"
        v-model.number="store.filterNr"
        @change="changeFilter"
        class="default-select h-10"
      >
        <!-- Name anzeigen und ID speichern -->
        <template v-if="store.filterInfo?.AvailableFilters">
          <option
            v-for="filter in store.filterInfo.AvailableFilters"
            :key="filter.Id"
            :value="filter.Id"
          >
            {{ filter.Name }}
          </option>
        </template>
        <option v-else :value="null" disabled>
          {{ $t('components.filterwheel.nofilteravailable') }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

// Initialisiere Stores
const store = apiStore();

async function changeFilter() {
  try {
    const data = apiService.changeFilter(store.filterNr);
    console.log('Response:', data);
    console.log('Filter:', store.filterNr);
  } catch (error) {
    console.log('Error:', error);
  }
}

onMounted(async () => {
  if (store.filterInfo?.SelectedFilter) {
    store.filterNr = store.filterInfo.SelectedFilter.Id;
    store.Name = store.filterInfo.SelectedFilter.Name;
  } else {
    store.filterNr = null;
    store.Name = '';
  }
});
</script>
