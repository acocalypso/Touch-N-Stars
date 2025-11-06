<template>
  <Modal :show="showDialog" :zIndex="'z-60'" :disableClose="isAutoFocusDialog" @close="handleClose">
    <template #header>
      <h2 class="text-xl font-bold text-white">
        {{ currentDialog?.Title || 'Dialog' }}
      </h2>
    </template>
    <template #body>
      <div class="space-y-4">
        <!-- TPPA (Polar Alignment) Dialog -->
        <TppaPage v-if="isTPPADialog" @close="handleClose" />

        <!-- PlateSolving Status Dialog -->
        <PlateSolvingDialog v-else-if="isPlateSolvingDialog" :dialog="currentDialog" :slewAndCenterData="dialogStore.slewAndCenterData" />

        <!-- Manual Rotator Dialog -->
        <ManualRotatorDialog v-else-if="isManualRotatorDialog" :dialog="currentDialog" />

        <!-- AutoFocus Dialog -->
        <AutoFocusDialog v-else-if="isAutoFocusDialog" />

        <!-- Meridian Flip Dialog -->
        <MeridianFlipDialog
          v-else-if="isMeridianFlipDialog"
          :dialog="currentDialog"
          :meridianFlipData="dialogStore.meridianFlipData"
        />

        <!-- Default Dialog -->
        <DefaultDialog v-else :dialog="currentDialog" />

        <!-- Buttons (responsiv: untereinander auf schmalen Bildschirmen, nebeneinander sonst) -->
        <div v-if="!isAutoFocusDialog" class="flex flex-col sm:flex-row gap-2 mt-6">
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
import apiService from '@/services/apiService';
import TppaPage from '@/components/tppa/TppaPage.vue';
import PlateSolvingDialog from '@/components/dialogs/PlateSolvingDialog.vue';
import ManualRotatorDialog from '@/components/dialogs/ManualRotatorDialog.vue';
import AutoFocusDialog from '@/components/dialogs/AutoFocusDialog.vue';
import MeridianFlipDialog from '@/components/dialogs/MeridianFlipDialog.vue';
import DefaultDialog from '@/components/dialogs/DefaultDialog.vue';

const dialogStore = useDialogStore();

const showDialog = computed(() => {
  return dialogStore.dialogs && dialogStore.dialogs.length > 0;
});

const currentDialog = computed(() => {
  if (!dialogStore.dialogs || dialogStore.dialogs.length === 0) return null;

  // Zeige den letzten Dialog aus dem Array (neuester)
  return dialogStore.dialogs[dialogStore.dialogs.length - 1];
});

// TPPA (Polar Alignment) Dialog Detection
const isTPPADialog = computed(() => {
  return currentDialog.value?.ContentType === 'NINA.Plugins.PolarAlignment.TPAPAVM';
});

// PlateSolving Dialog Detection
const isPlateSolvingDialog = computed(() => {
  return currentDialog.value?.ContentType === 'NINA.WPF.Base.ViewModel.PlateSolvingStatusVM';
});

// Manual Rotator Dialog Detection
const isManualRotatorDialog = computed(() => {
  return currentDialog.value?.ContentType === 'NINA.Equipment.Equipment.MyRotator.ManualRotator';
});

// AutoFocus Dialog Detection
const isAutoFocusDialog = computed(() => {
  return currentDialog.value?.ContentType === 'NINA.Joko.Plugins.HocusFocus.AutoFocus.HocusFocusVM';
});

// Meridian Flip Dialog Detection
const isMeridianFlipDialog = computed(() => {
  return currentDialog.value?.ContentType === 'NINA.WPF.Base.ViewModel.MeridianFlipVM';
});

// Filtere PART_* und UnnamedButton Commands heraus
const visibleCommands = computed(() => {
  if (!currentDialog.value?.AvailableCommands) return [];

  return currentDialog.value.AvailableCommands.map((cmd, index) => ({
    text: cmd,
    originalIndex: index,
  })).filter((cmd) => !cmd.text.startsWith('PART_') && cmd.text !== 'UnnamedButton');
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
  // Wenn es ein Plate Solving Dialog ist, sende slewStop
  if (isPlateSolvingDialog.value) {
    try {
      console.log('Closing Plate Solving dialog - sending slewStop');
      await apiService.slewStop();
    } catch (error) {
      console.error('Error sending slewStop:', error);
    }
  }

  const windowTitle = currentDialog.value?.Title;
  const availableCommands = currentDialog.value?.AvailableCommands || [];

  // Filtere PART_* und UnnamedButton heraus um den echten Button zu finden
  const realButtons = availableCommands.filter(
    (cmd) => !cmd.startsWith('PART_') && cmd !== 'UnnamedButton'
  );

  // Wenn es genau einen echten Button gibt, drücke diesen
  if (realButtons.length === 1) {
    const buttonName = realButtons[0];
    console.log('Closing dialog with single button:', buttonName, 'Window Title:', windowTitle);
    await dialogStore.clickButton(buttonName, windowTitle);
  } else {
    // Ansonsten verwende PART_CloseButton (Standard)
    console.log('Closing dialog with PART_CloseButton, Window Title:', windowTitle);
    await dialogStore.clickButton('PART_CloseButton', windowTitle);
  }
}
</script>
