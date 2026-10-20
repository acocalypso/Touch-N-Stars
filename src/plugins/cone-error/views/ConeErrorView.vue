<template>
  <div class="container mx-auto p-2 sm:p-4 max-w-3xl space-y-3">
    <div class="flex items-center justify-between gap-2">
      <h1 class="text-xl sm:text-2xl font-bold text-content">
        {{ $t('plugins.coneError.title') }}
      </h1>
      <button
        class="tns-btn-secondary w-auto! min-h-touch"
        :disabled="store.loading"
        @click="store.loadAll()"
      >
        <ArrowPathIcon class="w-5 h-5" :class="{ 'animate-spin': store.loading }" />
        <span class="sr-only">{{ $t('plugins.coneError.refresh') }}</span>
      </button>
    </div>

    <nav class="grid grid-cols-2 gap-1 rounded-control bg-surface-1 border border-line p-1">
      <button
        v-for="tab in TABS"
        :key="tab"
        class="min-h-touch rounded-chip px-1 text-sm font-semibold transition-colors"
        :class="
          activeTab === tab
            ? 'bg-accent-action text-white'
            : 'text-content-muted hover:bg-surface-2'
        "
        @click="activeTab = tab"
      >
        {{ $t(`plugins.coneError.tabs.${tab}`) }}
      </button>
    </nav>

    <p
      v-if="store.error"
      class="rounded-control border border-status-danger/50 bg-status-danger/10 p-3 text-sm text-status-danger"
    >
      {{ store.error.message }}
    </p>

    <AutoWizard v-if="activeTab === 'measure'" />
    <ConeHistory v-else />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { ArrowPathIcon } from '@heroicons/vue/24/outline';
import { useBackgroundAwarePolling } from '@/utils/appLifecycle';
import { useConeErrorStore } from '../store/coneErrorStore';
import AutoWizard from '../components/AutoWizard.vue';
import ConeHistory from '../components/ConeHistory.vue';

const TABS = ['measure', 'history'];

const store = useConeErrorStore();
const activeTab = ref('measure');

// The measurement runs on the Pi; leaving the panel does not stop it, and it is shown again on return.
let polls = 0;
useBackgroundAwarePolling(
  async () => {
    await store.loadStatus();
    polls++;
    if (!store.active && polls % 5 === 0) await store.loadPreconditions();
  },
  2000,
  ref(true)
);

onMounted(() => store.loadAll());

// A measurement that just finished: refresh preconditions and history.
watch(
  () => store.active,
  (active, was) => {
    if (was && !active) {
      store.loadPreconditions();
      store.loadResults();
    }
  }
);
</script>
