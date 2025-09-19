<template>
  <div v-if="runningConditions.length > 0" class="space-y-1">
    <div
      v-for="(condition, index) in runningConditions"
      :key="index"
      class="text-sm text-gray-300"
    >
      {{ removeSuffix(condition.Name) }}
      <span v-if="getConditionDetails(condition)" class="text-gray-500">
        - {{ getConditionDetails(condition) }}
      </span>
    </div>
  </div>
  <div v-else class="text-gray-500 italic text-sm">No conditions</div>
</template>
<script setup>
import { computed } from 'vue';
import { useSequenceStore } from '@/store/sequenceStore';
import { removeSuffix } from '@/utils/sequenceUtils.js';

const sequenceStore = useSequenceStore();

const runningConditions = computed(() => {
  if (!sequenceStore.sequenceInfo || sequenceStore.sequenceInfo.length === 0) {
    return [];
  }

  const conditions = [];

  function extractConditionsFromContainer(container) {
    // Nur Conditions sammeln wenn der Container RUNNING ist
    if (container.Status === 'RUNNING' && container.Conditions && container.Conditions.length > 0) {
      conditions.push(...container.Conditions);
    }

    if (container.Items) {
      container.Items.forEach(item => {
        extractConditionsFromContainer(item);
      });
    }
  }

  sequenceStore.sequenceInfo.forEach(container => {
    extractConditionsFromContainer(container);
  });

  return conditions;
});

function statusColor(status) {
  switch (status) {
    case 'FINISHED':
      return 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 shadow-emerald-400/20 shadow-sm';
    case 'RUNNING':
      return 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-cyan-400/20 shadow-sm';
    case 'CREATED':
      return 'bg-amber-500/30 text-amber-200 border border-amber-400/50 shadow-amber-400/20 shadow-sm';
    case 'SKIPPED':
      return 'bg-gray-500/30 text-gray-300 border border-gray-400/50';
    case 'DISABLED':
      return 'bg-red-500/30 text-red-300 border border-red-400/50';
    default:
      return 'bg-gray-600/30 text-gray-300 border border-gray-500/50';
  }
}

function getConditionDetails(condition) {
  const details = [];

  if (condition.Hours !== undefined && condition.Minutes !== undefined && condition.Seconds !== undefined) {
    details.push(`Time: ${condition.Hours.toString().padStart(2, '0')}:${condition.Minutes.toString().padStart(2, '0')}:${condition.Seconds.toString().padStart(2, '0')}`);
  }

  if (condition.Iterations !== undefined) {
    const completed = condition.CompletedIterations || 0;
    details.push(`Iterations: ${completed}/${condition.Iterations}`);
  }

  if (condition.CurrentMoonIllumination !== undefined && condition.UserMoonIllumination !== undefined) {
    details.push(`Moon: ${condition.CurrentMoonIllumination.toFixed(1)}% / ${condition.UserMoonIllumination}%`);
  }

  if (condition.InterruptReason) {
    details.push(`Reason: ${condition.InterruptReason}`);
  }

  if (condition.RolloverTime) {
    details.push(`Rollover: ${condition.RolloverTime}`);
  }

  return details.join(' | ');
}
</script>
