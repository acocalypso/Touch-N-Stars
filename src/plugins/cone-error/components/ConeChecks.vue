<template>
  <section class="tns-card space-y-2">
    <div class="flex items-center gap-2">
      <span class="tns-dot" :class="blockers.length ? 'bg-status-danger' : 'bg-status-ok'"></span>
      <h2 class="font-semibold text-content">
        {{
          blockers.length
            ? $t('plugins.coneError.checks.blocked')
            : $t('plugins.coneError.checks.ready')
        }}
      </h2>
    </div>

    <ul v-if="blockers.length" class="space-y-1 text-sm text-status-danger">
      <li v-for="item in blockers" :key="item" class="flex gap-2">
        <XCircleIcon class="w-5 h-5 shrink-0" />
        <span>{{ item }}</span>
      </li>
    </ul>

    <ul v-if="warnings.length" class="space-y-1 text-sm text-status-warn">
      <li v-for="item in warnings" :key="item" class="flex gap-2">
        <ExclamationTriangleIcon class="w-5 h-5 shrink-0" />
        <span>{{ item }}</span>
      </li>
    </ul>

    <dl v-if="pre" class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-content-muted">
      <dt>{{ $t('plugins.coneError.checks.mount') }}</dt>
      <dd class="text-content">
        {{ pre.mount?.name || '—' }}
        <span v-if="pre.mount?.side">({{ pre.mount.side }})</span>
      </dd>
      <dt>{{ $t('plugins.coneError.checks.solver') }}</dt>
      <dd class="text-content">{{ pre.profile?.solverDescription || '—' }}</dd>
      <dt>{{ $t('plugins.coneError.checks.site') }}</dt>
      <dd class="text-content">
        {{ formatNumber(pre.profile?.latitude) }}°, {{ formatNumber(pre.profile?.longitude) }}°
      </dd>
      <dt>{{ $t('plugins.coneError.checks.sun') }}</dt>
      <dd class="text-content">{{ sunText }}</dd>
    </dl>

    <label class="flex items-start gap-3 min-h-touch text-sm text-content">
      <input
        type="checkbox"
        class="w-5 h-5 mt-0.5"
        :checked="store.settings?.ignoreSunCheck === true"
        :disabled="store.pending || store.active"
        @change="toggleSunCheck($event.target.checked)"
      />
      <span>
        {{ $t('plugins.coneError.checks.ignoreSun') }}
        <span class="block text-xs text-content-muted">
          {{ $t('plugins.coneError.checks.ignoreSunHelp') }}
        </span>
      </span>
    </label>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/vue/24/outline';
import { useConeErrorStore } from '../store/coneErrorStore';

const store = useConeErrorStore();
const pre = computed(() => store.preconditions);
const blockers = computed(() => pre.value?.blockers ?? []);
const warnings = computed(() => pre.value?.warnings ?? []);

const sunText = computed(() => {
  const altitude = pre.value?.time?.sunAltitudeDegrees;
  return typeof altitude === 'number' ? `${altitude.toFixed(0)}°` : '—';
});

async function toggleSunCheck(ignore) {
  try {
    await store.saveSettings({ ignoreSunCheck: ignore });
    await store.loadPreconditions();
  } catch {
    // shown through store.error
  }
}

function formatNumber(value) {
  return typeof value === 'number' ? value.toFixed(3) : '—';
}
</script>
