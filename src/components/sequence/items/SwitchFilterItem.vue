<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 flex-shrink-0">{{ item.ComboBoxText }}</span>
    </template>

    <template #editor="{ save }">
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.switchFilter.filter')
        }}</label>
        <select
          class="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          :value="item.SelectedFilter"
          @change="save('SelectedFilter', Number($event.target.value))"
        >
          <option v-for="(name, i) in item.FilterNames" :key="i" :value="i + 1">
            {{ name }}
          </option>
        </select>
      </div>
    </template>
  </ItemShell>
</template>

<script setup>
import ItemShell from './ItemShell.vue';

defineProps({
  item: { type: Object, required: true },
});
</script>
