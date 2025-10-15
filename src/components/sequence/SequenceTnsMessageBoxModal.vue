<template>
  <Modal :show="sequenceStore.showTnsModal" @close="handleStopSequence">
    <template #header>
      <h2 class="text-xl font-bold text-cyan-400">
        {{ $t('components.sequence.tnsMessageBox.title') }}
      </h2>
    </template>
    <template #body>
      <div class="space-y-4">
        <p class="text-gray-200">{{ sequenceStore.tnsModalMessage }}</p>
        <div class="flex gap-4 justify-center mt-6">
          <button @click="handleStopSequence" class="default-button-red">
            {{ $t('components.sequence.tnsMessageBox.stopSequence') }}
          </button>
          <button @click="handleContinueSequence" class="default-button-cyan">
            {{ $t('components.sequence.tnsMessageBox.continueSequence') }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { useSequenceStore } from '@/store/sequenceStore';
import Modal from '@/components/helpers/Modal.vue';

const sequenceStore = useSequenceStore();

async function handleStopSequence() {
  await sequenceStore.closeTnsMessageBox(false);
}

async function handleContinueSequence() {
  await sequenceStore.closeTnsMessageBox(true);
}
</script>
