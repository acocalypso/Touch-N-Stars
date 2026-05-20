<template>
  <div class="flex flex-col gap-1">
    <div class="flex items-center justify-between">
      <div class="flex flex-col">
        <span class="text-sm font-medium text-gray-300">
          {{ $t('components.settings.plate_solver.Filter') }}
        </span>
        <span class="text-xs text-gray-500">
          {{ $t('components.settings.plate_solver.FilterHint') }}
        </span>
      </div>
      <select
        v-model="selectedValue"
        @change="updateSetting"
        :class="statusClass"
        class="default-select h-8 w-40 ml-3 shrink-0"
      >
        <option value="null">
          {{ $t('components.settings.plate_solver.FilterCurrent') }}
        </option>
        <option v-if="currentMissing" :value="String(current.Position)">
          {{ current.Name }}
        </option>
        <option v-for="f in filters" :key="f.Position" :value="String(f.Position)">
          {{ f.Name }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

const store = apiStore();
const selectedValue = ref('null');
const statusClass = ref('');

const filters = computed(() => store.profileInfo?.FilterWheelSettings?.FilterWheelFilters ?? []);

const current = computed(() => {
  const f = store.profileInfo?.PlateSolveSettings?.Filter;
  if (f == null) return null;
  if (typeof f === 'object') {
    if (f.Position == null && !f.Name) return null;
    return { Name: f.Name ?? '', Position: f.Position ?? 0 };
  }
  const pos = Number(f);
  if (Number.isNaN(pos)) return null;
  return { Name: String(pos), Position: pos };
});

const currentMissing = computed(() => {
  if (!current.value) return false;
  return !filters.value.some((f) => f.Position === current.value.Position);
});

function readCurrent() {
  return current.value ? String(current.value.Position) : 'null';
}

async function updateSetting() {
  try {
    const res = await apiService.profileChangeValue(
      'PlateSolveSettings-Filter',
      selectedValue.value
    );
    statusClass.value = res?.Success === false ? 'glow-red' : 'glow-green';
  } catch (e) {
    console.log('Error save setting', e);
    statusClass.value = 'glow-red';
  }
  setTimeout(() => (statusClass.value = ''), 1500);
}

onMounted(() => (selectedValue.value = readCurrent()));
watch(
  () => store.profileInfo?.PlateSolveSettings?.Filter,
  () => (selectedValue.value = readCurrent())
);
</script>
