<template>
  <div class="flex flex-col space-y-6">
    <PinsUpgradeCard
      :status="status"
      :active-operation="activeOperation"
      :upgrade-exit-code="upgradeExitCode"
      @start-upgrade="$emit('start-upgrade')"
    />

    <PinsTerminalOutput :logs="logs" @clear="$emit('clear-logs')" />
  </div>
</template>

<script setup>
import PinsUpgradeCard from '../PinsUpgradeCard.vue';
import PinsTerminalOutput from '../PinsTerminalOutput.vue';

defineProps({
  status: {
    type: String,
    required: true,
  },
  activeOperation: {
    type: String,
    default: null,
  },
  upgradeExitCode: {
    type: [Number, String],
    default: null,
  },
  logs: {
    type: Array,
    required: true,
  },
});

defineEmits(['start-upgrade', 'clear-logs']);
</script>
