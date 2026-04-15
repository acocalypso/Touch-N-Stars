<template>
  <div class="min-h-screen bg-gray-900">
    <SubNav
      v-if="store.isBackendReachable"
      :items="[
        { name: t('components.settings.general'), value: 'general' },
        { name: t('components.settings.image.title'), value: 'image' },
        { name: t('components.settings.equipment.title'), value: 'equipment' },
        { name: t('components.settings.plugins.title'), value: 'plugins' },
        { name: t('components.settings.plate_solver.title'), value: 'plateSolver' },
        { name: t('components.mount.settings.meridian_flip_settings'), value: 'meridianFlip' },
      ]"
      v-model:activeItem="activeTab"
    />

    <div class="p-4 max-w-xl mx-auto space-y-6">
      <!-- General Tab -->
      <SettingsGeneralTab
        v-if="activeTab === 'general'"
        @show-tutorial="showTutorial"
        @restart-system="restartSystem"
        @shutdown-system="shutdownSystem"
      />
      <!-- Equipment Tab -->
      <SettingsEquipmentTab v-if="activeTab === 'equipment'" />

      <!-- Plugins Tab -->
      <SettingsPluginsTab v-if="activeTab === 'plugins'" />

      <!-- Plate Solver Tab -->
      <SettingsPlateSolverTab v-if="activeTab === 'plateSolver'" />

      <!-- Image Tab -->
      <SettingsImageTab v-if="activeTab === 'image'" />

      <!-- Meridian Flip Tab -->
      <SettingsMeridianFlipTab v-if="activeTab === 'meridianFlip'" />
    </div>
  </div>

  <!-- Tutorial Modal -->
  <TutorialModal v-if="showTutorialModal" :steps="tutorialSteps" @close="closeTutorial" />

  <!-- Restart Info Modal -->
  <Modal :show="showRestartInfo" :disableClose="true" maxWidth="max-w-sm">
    <template #header>
      <h2 class="text-xl font-bold text-white">
        {{ $t('components.settings.system.restartInfoTitle') }}
      </h2>
    </template>
    <template #body>
      <div class="text-center space-y-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-12 w-12 mx-auto text-yellow-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <p class="text-gray-300">
          {{ $t('components.settings.system.restartInfoMessage') }}
        </p>
      </div>
    </template>
  </Modal>

  <!-- Shutdown Info Modal -->
  <Modal :show="showShutdownInfo" :disableClose="true" maxWidth="max-w-sm">
    <template #header>
      <h2 class="text-xl font-bold text-white">
        {{ $t('components.settings.system.shutdownInfoTitle') }}
      </h2>
    </template>
    <template #body>
      <div class="text-center space-y-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-12 w-12 mx-auto text-red-400"
          viewBox="0 0 325.214 325.214"
          fill="currentColor"
        >
          <path
            d="M288.777,93.565c-15.313-23.641-36.837-42.476-62.243-54.472c-1.616-0.763-3.109-1.134-4.564-1.134
          c-1.969,0-8.392,0.833-8.392,11.541v17.75c0,8.998,5.479,13.113,7.159,14.16c32.613,20.33,52.083,55.317,52.083,93.59
          c0,60.772-49.442,110.214-110.214,110.214S52.393,235.772,52.393,175c0-38.872,19.942-74.144,53.346-94.353
          c4.475-2.707,6.839-7.426,6.839-13.647V49c0-7.959-5.077-10.783-9.424-10.783c-1.714,0-3.542,0.422-5.144,1.188
          C72.781,51.471,51.42,70.305,36.237,93.872C20.638,118.084,12.393,146.137,12.393,175c0,82.828,67.386,150.214,150.214,150.214
          S312.821,257.828,312.821,175C312.821,146.008,304.507,117.848,288.777,93.565z"
          />
          <path
            d="M152.579,117h21c5.514,0,10-4.486,10-10V10c0-5.514-4.486-10-10-10h-21c-5.514,0-10,4.486-10,10v97
          C142.579,112.514,147.064,117,152.579,117z"
          />
        </svg>
        <p class="text-gray-300">
          {{ $t('components.settings.system.shutdownInfoMessage') }}
        </p>
      </div>
    </template>
  </Modal>

  <!-- Confirmation Modal -->
  <div
    v-if="confirmAction"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
  >
    <div class="bg-gray-800 rounded-lg p-6 max-w-sm w-full border border-gray-700">
      <h3 class="text-lg font-semibold text-white mb-4">
        {{ $t('components.settings.system.confirmation') }}
      </h3>
      <p class="text-gray-300 mb-6">
        {{
          confirmAction === 'shutdown'
            ? $t('components.settings.system.confirmShutdown')
            : $t('components.settings.system.confirmRestart')
        }}
      </p>
      <div class="flex justify-end gap-3">
        <button @click="cancelConfirmation" class="default-button-gray">
          {{ $t('common.cancel') }}
        </button>
        <button @click="confirmActionHandler" class="default-button-cyan">
          {{ $t('common.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import TutorialModal from '@/components/TutorialModal.vue';
import SubNav from '@/components/SubNav.vue';
import apiService from '@/services/apiService';
import SettingsGeneralTab from '@/components/settings/SettingsGeneralTab.vue';
import SettingsPluginsTab from '@/components/settings/SettingsPluginsTab.vue';
import SettingsPlateSolverTab from '@/components/settings/SettingsPlateSolverTab.vue';
import SettingsEquipmentTab from '@/components/settings/SettingsEquipmentTab.vue';
import SettingsImageTab from '@/components/settings/SettingsImageTab.vue';
import SettingsMeridianFlipTab from '@/components/settings/SettingsMeridianFlipTab.vue';
import { usePluginStore } from '@/store/pluginStore';
import Modal from '@/components/helpers/Modal.vue';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const store = apiStore();
const pluginStore = usePluginStore();

const activeTab = ref('general');
const showTutorialModal = ref(false);
const showRestartInfo = ref(false);
const showShutdownInfo = ref(false);
const restartCountdown = ref(10);
const tutorialSteps = computed(() => settingsStore.tutorial.steps);
const confirmAction = ref(null);

onMounted(async () => {
  await pluginStore.loadAndRegisterPlugins(true);
});

function showTutorial() {
  showTutorialModal.value = true;
  settingsStore.resetTutorial();
}

function closeTutorial() {
  showTutorialModal.value = false;
  settingsStore.completeTutorial();
}

function cancelConfirmation() {
  confirmAction.value = null;
}

async function confirmActionHandler() {
  if (confirmAction.value === 'restart') {
    apiService.restart();
    console.log('[SettingsComp] System restarting...');
    restartCountdown.value = 10;
    showRestartInfo.value = true;
    const interval = setInterval(() => {
      restartCountdown.value--;
      if (restartCountdown.value <= 0) {
        clearInterval(interval);
        showRestartInfo.value = false;
        location.reload();
      }
    }, 1000);
  } else if (confirmAction.value === 'shutdown') {
    apiService.shutdown();
    console.log('[SettingsComp] System shutting down...');
    showShutdownInfo.value = true;
  }
  confirmAction.value = null;
}

function restartSystem() {
  confirmAction.value = 'restart';
}

function shutdownSystem() {
  confirmAction.value = 'shutdown';
}
</script>
