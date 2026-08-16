<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-6">
    <LoadingOverlay
      :show="sequenceStore.sequenceLoading"
      :message="$t('components.sequence.loadingSequence')"
    />

    <div class="max-w-6xl mx-auto">
      <div class="backdrop-blur-sm bg-surface-1/60 rounded-card p-4 shadow-xl">
        <SequenceCurrentView />
      </div>
    </div>
  </div>
</template>

<script setup>
import SequenceCurrentView from '@/components/sequence/SequenceCurrentView.vue';
import LoadingOverlay from '@/components/helpers/LoadingOverlay.vue';
import { useSequenceStore } from '@/store/sequenceStore';

const sequenceStore = useSequenceStore();
</script>
