<template>
  <!-- The mount seen from behind, facing the meridian (south in the north, north in the south),
       on the west pier side: the tube is west of the pier, the counterweight east. -->
  <figure class="space-y-1">
    <svg
      viewBox="0 0 200 110"
      class="w-full max-w-[260px] mx-auto"
      role="img"
      :aria-label="$t('plugins.coneError.question.title')"
    >
      <g :transform="tubeRight ? 'translate(200 0) scale(-1 1)' : undefined">
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="55"
          stroke="var(--color-content-muted)"
          stroke-width="6"
        />
        <line
          x1="60"
          y1="55"
          x2="140"
          y2="55"
          stroke="var(--color-content-muted)"
          stroke-width="3"
        />
        <rect
          x="40"
          y="25"
          width="36"
          height="20"
          rx="4"
          fill="var(--color-surface-3)"
          stroke="var(--color-accent)"
          stroke-width="2"
        />
        <line
          x1="58"
          y1="45"
          x2="62"
          y2="55"
          stroke="var(--color-content-muted)"
          stroke-width="2"
        />
        <circle
          cx="146"
          cy="55"
          r="9"
          fill="var(--color-surface-3)"
          stroke="var(--color-status-warn)"
          stroke-width="2"
        />
      </g>
      <text
        :x="tubeRight ? 142 : 58"
        y="18"
        text-anchor="middle"
        font-size="10"
        fill="var(--color-accent)"
      >
        {{ $t('plugins.coneError.question.tube') }}
      </text>
      <text
        :x="tubeRight ? 54 : 146"
        y="80"
        text-anchor="middle"
        font-size="10"
        fill="var(--color-status-warn)"
      >
        {{ $t('plugins.coneError.question.counterweight') }}
      </text>
      <text :x="south ? 182 : 12" y="104" font-size="11" fill="var(--color-content-faint)">E</text>
      <text :x="south ? 12 : 182" y="104" font-size="11" fill="var(--color-content-faint)">W</text>
    </svg>
    <figcaption class="text-center text-xs text-content-faint">
      {{ $t('plugins.coneError.question.view') }}
    </figcaption>
  </figure>
</template>

<script setup>
import { computed } from 'vue';
import { useConeErrorStore } from '../store/coneErrorStore';

const store = useConeErrorStore();
// Facing south, east is on the left and the tube (west) on the right; facing north (southern
// hemisphere) the other way round.
const south = computed(() => (store.preconditions?.profile?.latitude ?? 0) < 0);
const tubeRight = computed(() => !south.value);
</script>
