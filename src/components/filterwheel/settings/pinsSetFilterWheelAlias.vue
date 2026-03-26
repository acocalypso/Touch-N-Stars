<template>
  <div
    v-if="filterStore.filterwheelSettings?.FilterWheelAlias !== undefined"
    class="flex items-center w-full justify-between border border-gray-500 p-1 md:p-2 rounded-lg"
  >
    <label for="setFilterWheelAlias" class="text-xs md:text-sm text-gray-200 font-medium">
      {{ $t('components.filterwheel.settings.FilterWheelAlias') }}
    </label>
    <input
      id="setFilterWheelAlias"
      v-model="alias"
      type="text"
      class="default-input h-7 md:h-8 w-28 md:w-36"
      @blur="setAlias"
      @keyup.enter="setAlias"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import apiService from '@/services/apiService';
import { useFilterStore } from '@/store/filterStore';

const filterStore = useFilterStore();
const alias = ref('');

onMounted(() => {
  alias.value = filterStore.filterwheelSettings?.FilterWheelAlias ?? '';
});

watch(
  () => filterStore.filterwheelSettings?.FilterWheelAlias,
  (val) => {
    if (val !== undefined) alias.value = val;
  }
);

async function setAlias() {
  try {
    await apiService.filterAction(
      `set-setting?settingName=FilterWheelAlias&newValue=${encodeURIComponent(alias.value)}`
    );
  } catch (error) {
    console.log('[pinsSetFilterWheelAlias] Error:', error);
  }
}
</script>
