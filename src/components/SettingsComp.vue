<template>
  <div class="min-h-screen bg-gray-900">
    <SubNav
      v-if="store.isBackendReachable"
      :items="[
        { name: t('components.settings.general'), value: 'general' },
        { name: t('components.settings.equipment.title'), value: 'equipment' },
        { name: t('components.settings.plugins.title'), value: 'plugins' },
        { name: t('components.settings.plate_solver.title'), value: 'plateSolver' },
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
    </div>
  </div>

  <!-- Tutorial Modal -->
  <TutorialModal v-if="showTutorialModal" :steps="tutorialSteps" @close="closeTutorial" />

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
import SettingsGeneralTab from '@/components/settings/SettingsGeneralTab.vue';
import SettingsPluginsTab from '@/components/settings/SettingsPluginsTab.vue';
import SettingsPlateSolverTab from '@/components/settings/SettingsPlateSolverTab.vue';
import SettingsEquipmentTab from '@/components/settings/SettingsEquipmentTab.vue';
import { usePluginStore } from '@/store/pluginStore';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const store = apiStore();
const pluginStore = usePluginStore();

const activeTab = ref('general');
const showTutorialModal = ref(false);
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

function confirmActionHandler() {
  if (confirmAction.value === 'restart') {
    location.reload();
  } else if (confirmAction.value === 'shutdown') {
    location.reload();
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
