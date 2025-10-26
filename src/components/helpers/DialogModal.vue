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

        <!-- Manual Rotator Dialog -->
        <div v-else-if="isManualRotatorDialog" class="space-y-4">
          <!-- Current and Target Position -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Current Position -->
            <div class="bg-gray-800 p-4 rounded-lg text-center">
              <p class="text-gray-400 text-sm mb-2">{{ rotatorContent.Text1 }}</p>
              <p class="text-4xl font-bold text-white">{{ rotatorContent.Text2 }}{{ rotatorContent.Text3 }}</p>
            </div>
            <!-- Target Position -->
            <div class="bg-gray-800 p-4 rounded-lg text-center">
              <p class="text-gray-400 text-sm mb-2">{{ rotatorContent.Text4 }}</p>
              <p class="text-4xl font-bold text-white">{{ rotatorContent.Text5 }}{{ rotatorContent.Text6 }}</p>
            </div>
          </div>

          <!-- Rotation Visualization (Clock-style) -->
          <div class="bg-gray-800 p-6 rounded-lg flex flex-col items-center">
            <!-- Clock Display -->
            <svg width="200" height="200" viewBox="0 0 200 200" class="mb-4">
              <!-- Clock Circle -->
              <circle cx="100" cy="100" r="80" fill="none" stroke="#4B5563" stroke-width="2"/>

              <!-- Degree Markers -->
              <text v-for="angle in [0, 90, 180, 270]" :key="angle"
                :x="100 + Math.sin(angle * Math.PI / 180) * 70"
                :y="100 - Math.cos(angle * Math.PI / 180) * 70"
                text-anchor="middle" dominant-baseline="middle"
                class="fill-gray-400 text-xs">
                {{ angle }}°
              </text>

              <!-- Current Position (blue line) -->
              <line
                x1="100" y1="100"
                :x2="100 + Math.sin(parseFloat(rotatorContent.Text2 || 0) * Math.PI / 180) * 60"
                :y2="100 - Math.cos(parseFloat(rotatorContent.Text2 || 0) * Math.PI / 180) * 60"
                stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>

              <!-- Target Position (green line) -->
              <line
                x1="100" y1="100"
                :x2="100 + Math.sin(parseFloat(rotatorContent.Text5 || 0) * Math.PI / 180) * 60"
                :y2="100 - Math.cos(parseFloat(rotatorContent.Text5 || 0) * Math.PI / 180) * 60"
                stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-dasharray="5,5"/>

              <!-- Rotation Arc -->
              <path
                :d="getRotationArc(parseFloat(rotatorContent.Text2 || 0), parseFloat(rotatorContent.Text5 || 0))"
                fill="none" stroke="#F59E0B" stroke-width="2"
                :marker-end="rotatorContent.Text9?.toLowerCase().includes('clock') ? 'url(#arrowhead)' : ''"
              />

              <!-- Arrow marker definition -->
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                  <polygon points="0,0 10,5 0,10" fill="#F59E0B"/>
                </marker>
              </defs>

              <!-- Center dot -->
              <circle cx="100" cy="100" r="4" fill="white"/>
            </svg>

            <!-- Legend -->
            <div class="flex gap-4 mb-3 text-xs">
              <div class="flex items-center gap-1">
                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span class="text-gray-400">{{ rotatorContent.Text1 }}</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-3 h-3 border-2 border-green-500 border-dashed rounded-full"></div>
                <span class="text-gray-400">{{ rotatorContent.Text4 }}</span>
              </div>
            </div>

            <!-- Rotation Info -->
            <p class="text-2xl font-bold text-yellow-500 mb-1">{{ rotatorContent.Text7 }}{{ rotatorContent.Text8 }}</p>
            <p class="text-gray-400 text-sm">{{ rotatorContent.Text9 }}</p>
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
  if (!dialogStore.dialogs || dialogStore.dialogs.length === 0) return null;

  // Zeige den letzten Dialog aus dem Array (neuester)
  return dialogStore.dialogs[dialogStore.dialogs.length - 1];
});

const dialogMessage = computed(() => {
  // Alle Dialoge haben jetzt einheitlich Content.Message
  return currentDialog.value?.Content?.Message || '';
});

// PlateSolving Dialog Detection
const isPlateSolvingDialog = computed(() => {
  return currentDialog.value?.ContentType === 'NINA.WPF.Base.ViewModel.PlateSolvingStatusVM';
});

// Manual Rotator Dialog Detection
const isManualRotatorDialog = computed(() => {
  return currentDialog.value?.ContentType === 'NINA.Equipment.Equipment.MyRotator.ManualRotator';
});

const rotatorContent = computed(() => {
  return currentDialog.value?.Content || {};
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

function getRotationArc(currentAngle, targetAngle) {
  // Zeichne einen Bogen von currentAngle zu targetAngle
  const cx = 100;
  const cy = 100;
  const radius = 50;

  const startRad = (currentAngle * Math.PI) / 180;
  const endRad = (targetAngle * Math.PI) / 180;

  const startX = cx + radius * Math.sin(startRad);
  const startY = cy - radius * Math.cos(startRad);
  const endX = cx + radius * Math.sin(endRad);
  const endY = cy - radius * Math.cos(endRad);

  // Berechne ob großer oder kleiner Bogen
  let angleDiff = targetAngle - currentAngle;
  if (angleDiff > 180) angleDiff -= 360;
  if (angleDiff < -180) angleDiff += 360;

  const largeArc = Math.abs(angleDiff) > 180 ? 1 : 0;
  const sweepFlag = angleDiff > 0 ? 1 : 0;

  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${endX} ${endY}`;
}

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