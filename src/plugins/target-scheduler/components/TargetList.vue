<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-200">
        {{ t('plugins.targetScheduler.targetList.title') }}
      </h3>
      <span class="text-xs text-slate-500">
        {{ t('plugins.targetScheduler.targetList.total', { count: localTargets.length }) }}
      </span>
    </div>

    <div
      v-if="!localTargets.length"
      class="rounded-lg border border-dashed border-slate-700 bg-slate-800/40 p-6 text-center text-sm text-slate-500"
    >
      {{ t('plugins.targetScheduler.targetList.empty') }}
    </div>

    <draggable
      v-else
      v-model="localTargets"
      item-key="id"
      handle=".drag-handle"
      ghost-class="opacity-40"
      class="space-y-2"
      @end="emitReorder"
    >
      <template #item="{ element }">
        <div class="flex items-start gap-2">
          <button
            class="drag-handle mt-3 rounded border border-slate-700 px-1.5 py-1 text-slate-500 hover:text-slate-300"
            :title="t('plugins.targetScheduler.targetList.dragToReorder')"
          >
            <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M7 4a1 1 0 11-2 0 1 1 0 012 0zm0 6a1 1 0 11-2 0 1 1 0 012 0zm-1 7a1 1 0 100-2 1 1 0 000 2zm9-13a1 1 0 10-2 0 1 1 0 002 0zm-1 7a1 1 0 100-2 1 1 0 000 2zm1 5a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>
          </button>

          <TargetCard
            class="flex-1"
            :target="element"
            :selected="selectedTargetId === element.id"
            :summary="getSummary(element.id)"
            @select="$emit('select', $event)"
            @edit="$emit('edit', $event)"
            @duplicate="$emit('duplicate', $event)"
            @remove="$emit('remove', $event)"
          />
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';
import TargetCard from './TargetCard.vue';

const props = defineProps({
  targets: {
    type: Array,
    required: true,
  },
  selectedTargetId: {
    type: String,
    default: null,
  },
  targetSummaryById: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['select', 'edit', 'duplicate', 'remove', 'reorder']);
const { t } = useI18n();

const localTargets = ref([...props.targets]);

watch(
  () => props.targets,
  (value) => {
    localTargets.value = [...value];
  },
  { deep: true }
);

function emitReorder() {
  emit('reorder', [...localTargets.value]);
}

function getSummary(targetId) {
  if (!props.targetSummaryById) return null;
  if (typeof props.targetSummaryById.get === 'function') {
    return props.targetSummaryById.get(targetId) || null;
  }
  return props.targetSummaryById[targetId] || null;
}
</script>
