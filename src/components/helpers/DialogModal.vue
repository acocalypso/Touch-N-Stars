<template>
  <Modal :show="showDialog" :zIndex="'z-50'" @close="handleClose">
    <template #header>
      <h2 class="text-xl font-bold text-white">
        {{ currentDialog?.Title || 'Dialog' }}
      </h2>
    </template>
    <template #body>
      <div class="space-y-4">
        <!-- PlateSolving Status Dialog -->
        <div v-if="isPlateSolvingDialog" class="space-y-3">
          <!-- Status Message -->
          <div class="bg-gray-800 p-3 rounded-lg border border-gray-700">
            <p class="text-yellow-400 font-medium">{{ plateSolvingStatus }}</p>
          </div>

          <!-- Parameters Grid -->
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div v-for="(value, key) in plateSolvingParams" :key="key" class="bg-gray-800 p-2 rounded">
              <span class="text-gray-400">{{ formatParamKey(key) }}:</span>
              <span class="text-white ml-2">{{ value }}</span>
            </div>
          </div>

          <!-- Table -->
          <div v-if="plateSolvingTable.length > 0" class="overflow-x-auto">
            <table class="w-full text-xs border border-gray-700">
              <thead class="bg-gray-800">
                <tr>
                  <th v-for="header in plateSolvingHeaders" :key="header" class="px-2 py-1 text-left border-b border-gray-700">
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in plateSolvingTable" :key="idx" class="border-b border-gray-700">
                  <td v-for="header in plateSolvingHeaders" :key="header" class="px-2 py-1">
                    {{ row[header] }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Normal Dialog -->
        <p v-else class="text-gray-200 whitespace-pre-wrap">{{ dialogMessage }}</p>

        <!-- Buttons -->
        <div class="flex flex-col gap-2 mt-6">
          <button
            v-for="(button, index) in visibleCommands"
            :key="index"
            @click="handleButtonClick(button.text)"
            :class="getButtonClass(index)"
            class="w-full px-4 py-3 rounded-lg font-medium transition-all"
          >
            {{ button.text }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { computed } from 'vue';
import { useDialogStore } from '@/store/dialogStore';
import Modal from '@/components/helpers/Modal.vue';

const dialogStore = useDialogStore();

const showDialog = computed(() => {
  return dialogStore.dialogs && dialogStore.dialogs.length > 0;
});

const currentDialog = computed(() => {
  return dialogStore.dialogs && dialogStore.dialogs.length > 0 ? dialogStore.dialogs[0] : null;
});

const dialogMessage = computed(() => {
  // Alle Dialoge haben jetzt einheitlich Content.Message
  return currentDialog.value?.Content?.Message || '';
});

// PlateSolving Dialog Detection
const isPlateSolvingDialog = computed(() => {
  return currentDialog.value?.ContentType === 'NINA.WPF.Base.ViewModel.PlateSolvingStatusVM';
});

const plateSolvingStatus = computed(() => {
  return currentDialog.value?.Content?.StatusMessage || '';
});

const plateSolvingParams = computed(() => {
  return currentDialog.value?.Content?.Parameters || {};
});

const plateSolvingHeaders = computed(() => {
  return currentDialog.value?.Content?.TableHeaders || [];
});

const plateSolvingTable = computed(() => {
  return currentDialog.value?.Content?.Table || [];
});

// Filtere PART_* und UnnamedButton Commands heraus
const visibleCommands = computed(() => {
  if (!currentDialog.value?.AvailableCommands) return [];

  return currentDialog.value.AvailableCommands
    .map((cmd, index) => ({ text: cmd, originalIndex: index }))
    .filter(cmd => !cmd.text.startsWith('PART_') && cmd.text !== 'UnnamedButton');
});

async function handleButtonClick(buttonName) {
  // Verwende den Titel als window-Parameter
  const windowTitle = currentDialog.value?.Title;
  console.log('Clicking button:', buttonName, 'Window Title:', windowTitle);
  console.log('Current dialog:', currentDialog.value);
  console.log('Available commands:', currentDialog.value?.AvailableCommands);
  await dialogStore.clickButton(buttonName, windowTitle);
}

async function handleClose() {
  // Schließe über PART_CloseButton mit Titel
  const windowTitle = currentDialog.value?.Title;
  console.log('Closing dialog with PART_CloseButton, Window Title:', windowTitle);
  await dialogStore.clickButton('PART_CloseButton', windowTitle);
}

function getButtonClass(index) {
  const visibleCount = visibleCommands.value.length;

  // Letzter sichtbarer Button (meist "Stop Sequence") = rot
  if (index === visibleCount - 1 && visibleCount > 1) {
    return 'default-button-red';
  }

  // Erster sichtbarer Button (meist "Continue") = cyan/primär
  if (index === 0) {
    return 'default-button-cyan';
  }

  // Mittlere Buttons = neutral
  return 'default-button';
}
</script>