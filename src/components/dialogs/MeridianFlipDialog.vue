<template>
  <div class="space-y-2">
      <div
        v-for="(step, index) in meridianFlipSteps"
        :key="step.Id"
        :class="[
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-all border bg-cyan-950',
          step.Finished
            ? 'border-cyan-800 text-white'
            : isStepCurrent(index)
            ? 'border-2 border-cyan-500 text-white'
            : 'border-cyan-900 text-gray-300'
        ]"
      >
        <!-- Step indicator -->
        <div
          :class="[
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors',
            step.Finished ? 'bg-green-600 text-white' : isStepCurrent(index) ? 'bg-cyan-500 text-white' : 'bg-cyan-900 text-gray-400'
          ]"
        >
          <span v-if="step.Finished">✓</span>
          <span v-else>{{ index + 1 }}</span>
        </div>

        <!-- Step text -->
        <span class="flex-1 font-medium">{{ step.Title }}</span>

        <!-- Step status icon and time -->
        <div v-if="isStepCurrent(index) && countdownSeconds > 0" class="flex items-center gap-2">
          <span class="text-cyan-400 text-sm font-semibold">{{ remainingTime }}</span>
          <span class="text-lg animate-pulse text-cyan-400">⏳</span>
        </div>
        <span v-else-if="isStepCurrent(index) && countdownSeconds <= 0" class="text-lg animate-pulse text-cyan-400">⏳</span>
        <span v-else-if="step.Finished" class="text-lg text-green-500">✓</span>
      </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  dialog: {
    type: Object,
    required: true,
  },
  meridianFlipData: {
    type: Object,
    default: null,
  },
});

// Local countdown state
const countdownSeconds = ref(0);
let countdownInterval = null;

// Initialize countdown from API time
const initializeCountdown = () => {
  const timeStr = props.dialog?.Content?.RemainingTime || '00:00:00';
  const [hours, minutes, secondsStr] = timeStr.split(':');
  const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secondsStr);
  countdownSeconds.value = totalSeconds;
};

// Start the countdown interval
const startCountdown = () => {
  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    if (countdownSeconds.value > 0) {
      countdownSeconds.value--;
    }
  }, 1000);
};

// Format seconds to HH:MM:SS
const formatTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Get remaining time formatted
const remainingTime = computed(() => {
  return formatTime(countdownSeconds.value);
});

// Watch for API time changes and reinitialize
watch(() => props.dialog?.Content?.RemainingTime, () => {
  initializeCountdown();
}, { immediate: true });

// Lifecycle hooks
onMounted(() => {
  initializeCountdown();
  startCountdown();
});

onBeforeUnmount(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});

// Get the meridian flip steps - either from prop or from store/dialog
const meridianFlipSteps = computed(() => {
  // Try to get from prop first
  if (props.meridianFlipData?.Steps && Array.isArray(props.meridianFlipData.Steps)) {
    return props.meridianFlipData.Steps;
  }

  // Fallback: return empty array if no data available
  return [];
});

// Find the current step (first one that is not finished)
const currentStepIndex = computed(() => {
  const steps = meridianFlipSteps.value;
  for (let i = 0; i < steps.length; i++) {
    if (!steps[i].Finished) {
      return i;
    }
  }
  // If all finished, return last index
  return steps.length - 1;
});

// Get the current step title
const currentStepTitle = computed(() => {
  const steps = meridianFlipSteps.value;
  if (steps.length > 0 && currentStepIndex.value >= 0) {
    return steps[currentStepIndex.value]?.Title || 'Unknown Step';
  }
  return 'Completed';
});

// Check if step is current
const isStepCurrent = (index) => {
  return index === currentStepIndex.value;
};
</script>
