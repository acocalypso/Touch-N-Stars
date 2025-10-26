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
          <!-- Status Message (nur wenn nicht leer) -->
          <div v-if="plateSolvingStatus" class="bg-gray-800 p-3 rounded-lg border border-gray-700">
            <p class="text-yellow-400 font-medium">{{ plateSolvingStatus }}</p>
          </div>

          <!-- Parameters Grid (nur wenn echte Daten vorhanden) -->
          <div v-if="plateSolvingHasData" class="grid grid-cols-2 gap-2 text-sm">
            <div v-for="param in plateSolvingDisplayParams" :key="param.key" class="bg-gray-800 p-2 rounded">
              <span class="text-gray-400">{{ param.label }}:</span>
              <span class="text-white ml-2">{{ param.value }}</span>
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
                    {{ getTableValue(row, header) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Normal Dialog -->
        <p v-else class="text-gray-200 whitespace-pre-wrap">{{ dialogMessage }}</p>

        <!-- Buttons (responsiv: untereinander auf schmalen Bildschirmen, nebeneinander sonst) -->
        <div class="flex flex-col sm:flex-row gap-2 mt-6">
          <button
            v-for="(button, index) in visibleCommands"
            :key="index"
            @click="handleButtonClick(button.text)"
            class="default-button-cyan flex-1 px-4 py-3 rounded-lg font-medium transition-all"
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

const plateSolvingAllParams = computed(() => {
  return currentDialog.value?.Content?.Parameters || {};
});

const plateSolvingHasData = computed(() => {
  const params = plateSolvingAllParams.value;
  // Hat echte Daten wenn mehr als nur "Status" vorhanden ist
  const keys = Object.keys(params);
  return keys.length > 1 || (keys.length === 1 && keys[0] !== 'Status');
});

const plateSolvingDisplayParams = computed(() => {
  const params = plateSolvingAllParams.value;
  const paramKeys = Object.keys(params);

  // Verwende feste Indizes für die Parameter
  // Index 8: Errordistance/Fehlerabstand
  // Index 9: RAerror/RAFehler
  // Index 11: Decerror/DecFehler
  const indices = [8, 9, 11];

  return indices.map(index => {
    const key = paramKeys[index];
    return {
      key: key || `param_${index}`,
      label: key || '---', // Verwende den Key-Namen als Label (sprachabhängig)
      value: key ? params[key] : '---',
    };
  });
});

const plateSolvingHeaders = computed(() => {
  // Zeige nur Index 0 (Time/Zeit) und Index 3 (Error distance/Fehlerabstand)
  // Die Namen kommen direkt von der API in der richtigen Sprache
  const allHeaders = currentDialog.value?.Content?.TableHeaders || [];
  const headers = [allHeaders[0], allHeaders[3]].filter(h => h !== undefined);
  return headers;
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

function getTableValue(row, header) {
  // Versuche zuerst den Header direkt
  if (row[header] !== undefined) {
    return row[header];
  }

  // Versuche den Header ohne Leerzeichen (z.B. "Error distance" -> "Errordistance")
  const keyWithoutSpaces = header.replace(/\s+/g, '');
  if (row[keyWithoutSpaces] !== undefined) {
    return row[keyWithoutSpaces];
  }

  // Versuche verschiedene Varianten für Keys mit Klammern
  // z.B. "RA error (px)" -> "RAerrorpx"
  const withoutParens = header.replace(/\s*\([^)]*\)\s*/g, '').replace(/\s+/g, '');
  if (row[withoutParens] !== undefined) {
    return row[withoutParens];
  }

  // Lowercase-Variante: "RA error (px)" -> "raerrorpx" (dann suche case-insensitive)
  const lowerKey = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchingKey = Object.keys(row).find(k => k.toLowerCase() === lowerKey);
  if (matchingKey && row[matchingKey] !== undefined) {
    return row[matchingKey];
  }

  return '';
}

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

</script>