<template>
  <div class="border border-gray-700 rounded overflow-hidden text-sm overflow-x-auto">
    <div class="grid grid-cols-5 bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wide">
      <div class="px-3 py-2">Metric</div>
      <div class="px-3 py-2 text-right">Min</div>
      <div class="px-3 py-2 text-right">Max</div>
      <div class="px-3 py-2 text-right">Mean</div>
      <div class="px-3 py-2 text-right">CV</div>
    </div>
    <template v-for="(row, ri) in rows" :key="row.label">
      <details v-if="row.filterRows?.length" class="border-t border-gray-700/50">
        <summary
          :class="ri % 2 === 1 ? 'bg-gray-900/30' : ''"
          class="grid grid-cols-5 list-none cursor-pointer text-gray-300 hover:bg-gray-700/20"
        >
          <div class="px-3 py-2 font-medium text-cyan-400 flex items-center gap-1">
            {{ row.label }} <span class="opacity-50 text-xs">▾</span>
          </div>
          <div class="px-3 py-2 text-right">{{ row.min }}</div>
          <div class="px-3 py-2 text-right">{{ row.max }}</div>
          <div class="px-3 py-2 text-right">{{ row.mean }}</div>
          <div class="px-3 py-2 text-right">{{ row.cv }}</div>
        </summary>
        <div class="bg-gray-900/60 px-4 py-2 border-t border-gray-700/30">
          <table class="w-full text-xs">
            <thead>
              <tr class="text-gray-500 uppercase">
                <th class="text-left py-1 pr-3">Filter</th>
                <th class="text-right py-1 px-2">Min</th>
                <th class="text-right py-1 px-2">Max</th>
                <th class="text-right py-1 px-2">Mean</th>
                <th class="text-right py-1 px-2">CV</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="fr in row.filterRows"
                :key="fr.filter"
                class="text-gray-400 border-t border-gray-700/20"
              >
                <td class="py-1 pr-3">
                  {{ fr.filter }} <span class="text-gray-600">({{ fr.count }})</span>
                </td>
                <td class="text-right py-1 px-2">{{ fr.min }}</td>
                <td class="text-right py-1 px-2">{{ fr.max }}</td>
                <td class="text-right py-1 px-2">{{ fr.mean }}</td>
                <td class="text-right py-1 px-2">{{ fr.cv }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
      <div
        v-else
        :class="ri % 2 === 1 ? 'bg-gray-900/30' : ''"
        class="grid grid-cols-5 border-t border-gray-700/50 text-gray-300"
      >
        <div class="px-3 py-2 font-medium text-gray-200">{{ row.label }}</div>
        <div class="px-3 py-2 text-right">{{ row.min }}</div>
        <div class="px-3 py-2 text-right">{{ row.max }}</div>
        <div class="px-3 py-2 text-right">{{ row.mean }}</div>
        <div class="px-3 py-2 text-right">{{ row.cv }}</div>
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  rows: {
    type: Array,
    required: true,
  },
});
</script>
