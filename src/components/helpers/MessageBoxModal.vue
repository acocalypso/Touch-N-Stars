<template>
  <Modal :show="showMessageBox" :zIndex="'z-[90]'" @close="handleClose">
    <template #header>
      <h2 class="text-xl font-bold text-white">
        {{ currentMessageBox?.title || 'MessageBox' }}
      </h2>
    </template>
    <template #body>
      <div class="space-y-4">
        <!-- MessageBox Text -->
        <div class="text-white">
          {{ currentMessageBox?.text }}
        </div>

        <!-- Button -->
        <div class="flex flex-col sm:flex-row gap-2 mt-6">
          <button
            @click="handleButtonClick"
            class="default-button-cyan flex-1 px-4 py-3 rounded-lg font-medium transition-all"
          >
            {{ currentMessageBox?.button || 'OK' }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { computed } from 'vue';
import { useMessageboxStore } from '@/store/messageboxStore';
import Modal from '@/components/helpers/Modal.vue';

const messageboxStore = useMessageboxStore();

const showMessageBox = computed(() => {
  return messageboxStore.messageboxes && messageboxStore.messageboxes.length > 0;
});

const currentMessageBox = computed(() => {
  if (!messageboxStore.messageboxes || messageboxStore.messageboxes.length === 0) return null;

  // Zeige die letzte MessageBox aus dem Array (neueste)
  return messageboxStore.messageboxes[messageboxStore.messageboxes.length - 1];
});

async function handleButtonClick() {
  const messageBoxId = currentMessageBox.value?.id;
  const result = currentMessageBox.value?.defaultResult || 'OK';

  console.log('[MessageBoxModal] Clicking button:', result, 'MessageBox ID:', messageBoxId);

  if (messageBoxId) {
    await messageboxStore.respondToMessageBox(messageBoxId, result);
    // Remove from local array after responding
    await messageboxStore.closeMessagebox(messageBoxId);
  }
}

async function handleClose() {
  const messageBoxId = currentMessageBox.value?.id;

  console.log('[MessageBoxModal] Closing MessageBox without response:', messageBoxId);

  if (messageBoxId) {
    // Just close without sending a response
    await messageboxStore.closeMessagebox(messageBoxId);
  }
}
</script>
