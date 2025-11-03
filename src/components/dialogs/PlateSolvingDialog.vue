<template>
  <div class="space-y-3">
    <!-- Status Message (nur wenn nicht leer) -->
    <div v-if="plateSolvingStatus" class="bg-gray-800 p-3 rounded-lg border border-gray-700">
      <p class="text-yellow-400 font-medium">{{ plateSolvingStatus }}</p>
    </div>

    <!-- Parameters Grid (nur wenn echte Daten vorhanden) -->
    <div v-if="plateSolvingHasData" class="grid grid-cols-2 gap-2 text-sm">
      <div
        v-for="param in plateSolvingDisplayParams"
        :key="param.key"
        class="bg-gray-800 p-2 rounded"
      >
        <span class="text-gray-400">{{ param.label }}:</span>
        <span class="text-white ml-2">{{ param.value }}</span>
      </div>
    </div>

    <!-- Table -->
    <div v-if="plateSolvingTable.length > 0" class="overflow-x-auto">
      <table class="w-full text-xs border border-gray-700">
        <thead class="bg-gray-800">
          <tr>
            <th
              v-for="header in plateSolvingHeaders"
              :key="header"
              class="px-2 py-1 text-left border-b border-gray-700"
            >
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in plateSolvingTable"
            :key="idx"
            class="border-b border-gray-700"
          >
            <td v-for="header in plateSolvingHeaders" :key="header" class="px-2 py-1">
              {{ getTableValue(row, header) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  dialog: {
    type: Object,
    required: true,
  },
});

const plateSolvingStatus = computed(() => {
  return props.dialog?.Content?.StatusMessage || '';
});

const plateSolvingAllParams = computed(() => {
  return props.dialog?.Content?.Parameters || {};
});

const plateSolvingHasData = computed(() => {
  const params = plateSolvingAllParams.value;
  const keys = Object.keys(params);
  return keys.length > 1 || (keys.length === 1 && keys[0] !== 'Status');
});

const plateSolvingDisplayParams = computed(() => {
  const params = plateSolvingAllParams.value;
  const paramKeys = Object.keys(params);

  const indices = [8, 9, 11];

  return indices.map((index) => {
    const key = paramKeys[index];
    return {
      key: key || `param_${index}`,
      label: key || '---',
      value: key ? params[key] : '---',
    };
  });
});

const plateSolvingHeaders = computed(() => {
  const allHeaders = props.dialog?.Content?.TableHeaders || [];
  const headers = [allHeaders[0], allHeaders[3]].filter((h) => h !== undefined);
  return headers;
});

const plateSolvingTable = computed(() => {
  return props.dialog?.Content?.Table || [];
});

function getTableValue(row, header) {
  if (row[header] !== undefined) {
    return row[header];
  }

  const keyWithoutSpaces = header.replace(/\s+/g, '');
  if (row[keyWithoutSpaces] !== undefined) {
    return row[keyWithoutSpaces];
  }

  const withoutParens = header.replace(/\s*\([^)]*\)\s*/g, '').replace(/\s+/g, '');
  if (row[withoutParens] !== undefined) {
    return row[withoutParens];
  }

  const lowerKey = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchingKey = Object.keys(row).find((k) => k.toLowerCase() === lowerKey);
  if (matchingKey && row[matchingKey] !== undefined) {
    return row[matchingKey];
  }

  return '';
}
</script>
