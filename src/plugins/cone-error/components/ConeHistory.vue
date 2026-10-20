<template>
  <section class="tns-card space-y-3">
    <h2 class="font-semibold text-content">{{ $t('plugins.coneError.history.title') }}</h2>
    <p v-if="!store.results.length" class="text-sm text-content-muted">
      {{ $t('plugins.coneError.history.empty') }}
    </p>
    <ul v-else class="divide-y divide-line">
      <li v-for="result in store.results" :key="result.id" class="py-2 space-y-0.5">
        <div class="flex items-center justify-between gap-2 text-sm">
          <span class="text-content">{{ new Date(result.timestampUtc).toLocaleString() }}</span>
          <span class="font-semibold text-content">{{ signed(result.coneArcmin) }}′</span>
        </div>
        <div class="flex items-center justify-between gap-2 text-xs text-content-muted">
          <span>{{ mountName(result.mountName) }}</span>
          <span>{{ shim(result) }}</span>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConeErrorStore } from '../store/coneErrorStore';

const { t } = useI18n();
const store = useConeErrorStore();

onMounted(() => store.loadResults());

function signed(value) {
  if (typeof value !== 'number') return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
}

// The backend keys results by "profile|mount"; show the mount part.
function mountName(key) {
  return (key ?? '').split('|').pop() || '—';
}

function shim(result) {
  if (result.shimEnd === 'None' || typeof result.shimMm !== 'number') {
    return t('plugins.coneError.history.noShim');
  }
  return t(`plugins.coneError.history.shim${result.shimEnd}`, {
    mm: (Math.round(result.shimMm * 20) / 20).toFixed(2),
  });
}
</script>
