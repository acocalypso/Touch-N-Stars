<template>
  <nav class="celestia-atlas-toolbar" :aria-label="$t('components.celestiaAtlas.toolbar.label')">
    <div class="celestia-atlas-toolbar-group">
      <button
        class="celestia-atlas-toolbar-button"
        type="button"
        :disabled="!mountConnected"
        :title="$t('components.celestiaAtlas.toolbar.mount_center')"
        :aria-label="$t('components.celestiaAtlas.toolbar.mount_center')"
        @click="$emit('focus-mount')"
      >
        <ViewfinderCircleIcon class="h-6 w-6" />
        <span class="celestia-atlas-toolbar-label">
          {{ $t('components.celestiaAtlas.toolbar.mount_center_short') }}
        </span>
      </button>
      <button
        class="celestia-atlas-toolbar-button"
        :class="{ 'is-active': mountFollow }"
        type="button"
        :disabled="!mountConnected"
        :aria-pressed="mountFollow"
        :title="$t('components.celestiaAtlas.toolbar.mount_follow')"
        :aria-label="$t('components.celestiaAtlas.toolbar.mount_follow')"
        @click="$emit('toggle-follow')"
      >
        <ArrowPathIcon class="h-6 w-6" />
        <span class="celestia-atlas-toolbar-label">
          {{ $t('components.celestiaAtlas.toolbar.mount_follow_short') }}
        </span>
      </button>
    </div>

    <button
      class="celestia-atlas-toolbar-button celestia-atlas-toolbar-clock"
      :class="{ 'is-active': activeSheet === 'clock' }"
      type="button"
      :aria-pressed="activeSheet === 'clock'"
      :title="$t('components.celestiaAtlas.datetime.title')"
      @click="$emit('toggle-sheet', 'clock')"
    >
      <PauseIcon v-if="clockPaused" class="h-6 w-6 shrink-0 text-status-warn" />
      <ClockIcon v-else class="h-6 w-6 shrink-0" />
      <span class="celestia-atlas-toolbar-clock-label celestia-atlas-toolbar-clock-long">
        {{ clockLabel }}
      </span>
      <span class="celestia-atlas-toolbar-clock-label celestia-atlas-toolbar-clock-short">
        {{ clockLabelShort }}
      </span>
    </button>

    <div class="celestia-atlas-toolbar-group">
      <button
        class="celestia-atlas-toolbar-button"
        :class="{ 'is-active': activeSheet === 'layers' }"
        type="button"
        :aria-pressed="activeSheet === 'layers'"
        :title="$t('components.celestiaAtlas.toolbar.layers')"
        @click="$emit('toggle-sheet', 'layers')"
      >
        <Square3Stack3DIcon class="h-6 w-6" />
        <span class="celestia-atlas-toolbar-label">
          {{ $t('components.celestiaAtlas.toolbar.layers') }}
        </span>
      </button>
      <button
        class="celestia-atlas-toolbar-button relative"
        :class="{ 'is-active': activeSheet === 'target' }"
        type="button"
        :aria-pressed="activeSheet === 'target'"
        :title="$t('components.celestiaAtlas.toolbar.framing')"
        @click="$emit('toggle-sheet', 'target')"
      >
        <CameraFramingIcon class="h-6 w-6" />
        <span class="celestia-atlas-toolbar-label">
          {{ $t('components.celestiaAtlas.toolbar.framing') }}
        </span>
        <span v-if="hasSelection" class="celestia-atlas-toolbar-badge" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>

<script setup>
import {
  ArrowPathIcon,
  ClockIcon,
  PauseIcon,
  Square3Stack3DIcon,
  ViewfinderCircleIcon,
} from '@heroicons/vue/24/outline';
import CameraFramingIcon from '@/components/icons/CameraFramingIcon.vue';

// Bottom toolbar of the Atlas. Mount buttons stay in place and only disable without a
// mount, so the row never shifts. The three right-hand controls toggle the single sheet.
defineProps({
  mountConnected: { type: Boolean, default: false },
  mountFollow: { type: Boolean, default: false },
  clockPaused: { type: Boolean, default: false },
  clockLabel: { type: String, default: '' },
  // Same time without seconds; shown instead of clockLabel on narrow phones, where five
  // touch-sized buttons plus a full time string do not fit in one row.
  clockLabelShort: { type: String, default: '' },
  activeSheet: { type: String, default: null },
  hasSelection: { type: Boolean, default: false },
});
defineEmits(['focus-mount', 'toggle-follow', 'toggle-sheet']);
</script>

<style scoped>
.celestia-atlas-toolbar {
  position: absolute;
  z-index: 20;
  left: calc(0.5rem + env(safe-area-inset-left, 0px));
  /* --atlas-side-inset keeps the bar clear of the landscape sheet column. */
  right: calc(0.5rem + env(safe-area-inset-right, 0px) + var(--atlas-side-inset, 0px));
  bottom: var(--above-statusbar);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  height: var(--atlas-toolbar-height);
  padding: 0.25rem;
  color: var(--color-content);
  background: rgb(17 24 39 / 92%);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-card);
}
/* Every button gets an equal share of the row and shrinks with it, so the toolbar never
   grows past the screen; labels ellipsize inside their button instead of pushing it out. */
.celestia-atlas-toolbar-group {
  display: flex;
  flex: 2 1 0;
  min-width: 0;
  gap: 0.25rem;
}
/* Icon above a one-word label, like a tab bar: the label says what a tap does, the
   fixed height keeps every button the same size whether or not the label wraps. */
.celestia-atlas-toolbar-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  padding: 0 0.25rem;
  color: var(--color-content-muted);
  border-radius: var(--radius-control);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}
/* Two lines at most: "Montierung zeigen" and friends do not fit one 50-60 px line on a
   phone, and an ellipsis would leave both mount buttons reading "Montierun…". A single
   word longer than the button still breaks rather than clips (overflow-wrap). */
.celestia-atlas-toolbar-label {
  max-width: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-size: 0.625rem;
  line-height: 1.1;
  text-align: center;
  overflow-wrap: anywhere;
}
.celestia-atlas-toolbar-button:hover:not(:disabled) {
  background: var(--color-surface-2);
}
.celestia-atlas-toolbar-button:disabled {
  opacity: 0.35;
}
.celestia-atlas-toolbar-button.is-active {
  color: var(--color-accent);
  background: rgb(34 211 238 / 14%);
}
.celestia-atlas-toolbar-clock-label {
  max-width: 100%;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.6875rem;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.celestia-atlas-toolbar-clock-short {
  display: none;
}
@media (max-width: 400px) {
  .celestia-atlas-toolbar {
    gap: 0.125rem;
  }
  .celestia-atlas-toolbar-group {
    gap: 0.125rem;
  }
  .celestia-atlas-toolbar-clock-long {
    display: none;
  }
  .celestia-atlas-toolbar-clock-short {
    display: inline;
  }
}
.celestia-atlas-toolbar-badge {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: var(--color-accent);
}
</style>
