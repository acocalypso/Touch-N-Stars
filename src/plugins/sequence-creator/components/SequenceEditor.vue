<template>
  <div class="sequence-editor h-full flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div
      class="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4"
    >
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('plugins.sequenceCreator.title') }}
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ t('plugins.sequenceCreator.subtitle') }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Undo/Redo -->
          <button
            @click="store.undo()"
            :disabled="!store.canUndo"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :title="t('plugins.sequenceCreator.toolbar.undo')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          </button>

          <button
            @click="store.redo()"
            :disabled="!store.canRedo"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :title="t('plugins.sequenceCreator.toolbar.redo')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
              />
            </svg>
          </button>

          <!-- Load Basic Sequence -->
          <button @click="store.loadBasicSequence()" class="default-button-cyan text-sm">
            {{ t('plugins.sequenceCreator.toolbar.loadBasicSequence') }}
          </button>

          <!-- Save as Default -->
          <button
            @click="handleSaveAsDefault"
            :disabled="!store.sequenceIsValid"
            class="default-button-blue text-sm"
          >
            {{ t('plugins.sequenceCreator.toolbar.saveAsDefault') }}
          </button>

          <!-- Clear All -->
          <button @click="handleClearSequence" class="default-button-red text-sm">
            {{ t('plugins.sequenceCreator.toolbar.clearSequence') }}
          </button>

          <!-- Export -->
          <button
            @click="showExportModal = true"
            :disabled="!store.sequenceIsValid"
            class="default-button-green text-sm"
          >
            {{ t('plugins.sequenceCreator.toolbar.exportSequence') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-hidden">
      <div class="h-full overflow-y-auto">
        <!-- Sequence Builder -->
        <div class="p-4">
          <div class="max-w-4xl mx-auto space-y-6">
            <!-- Sequence Validation Status -->
            <div class="mb-6">
              <div
                v-if="store.sequenceIsValid"
                class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <svg
                  class="w-5 h-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-green-800 dark:text-green-200 font-medium">
                  {{ t('plugins.sequenceCreator.toolbar.validSequence') }}
                </span>
              </div>
              <div
                v-else
                class="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
              >
                <svg
                  class="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span class="text-yellow-800 dark:text-yellow-200">
                  {{ t('plugins.sequenceCreator.toolbar.invalidSequence') }}
                </span>
              </div>
            </div>

            <!-- Sequence Settings -->
            <div class="mb-6">
              <div
                class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  {{ t('plugins.sequenceCreator.settings.title') }}
                </h3>
                <div class="flex items-center">
                  <input
                    id="meridian-flip-enabled"
                    type="checkbox"
                    v-model="store.enableMeridianFlip"
                    class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    for="meridian-flip-enabled"
                    class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {{ t('plugins.sequenceCreator.settings.enableMeridianFlip') }}
                  </label>
                </div>
              </div>
            </div>

            <!-- Start Container -->
            <SequenceContainer
              :title="t('plugins.sequenceCreator.containers.startSequence.title')"
              :description="t('plugins.sequenceCreator.containers.startSequence.description')"
              :actions="store.startSequence"
              container-type="start"
              icon="rocket"
              color="blue"
              @add-action="handleAddAction"
              @remove-action="handleRemoveAction"
              @duplicate-action="handleDuplicateAction"
              @move-action="handleMoveAction"
            />

            <!-- Target Container -->
            <SequenceContainer
              :title="t('plugins.sequenceCreator.containers.targetSequence.title')"
              :description="t('plugins.sequenceCreator.containers.targetSequence.description')"
              :actions="store.targetSequence"
              container-type="target"
              icon="crosshairs"
              color="green"
              @add-action="handleAddAction"
              @remove-action="handleRemoveAction"
              @duplicate-action="handleDuplicateAction"
              @move-action="handleMoveAction"
            />

            <!-- End Container -->
            <SequenceContainer
              :title="t('plugins.sequenceCreator.containers.endSequence.title')"
              :description="t('plugins.sequenceCreator.containers.endSequence.description')"
              :actions="store.endSequence"
              container-type="end"
              icon="flag"
              color="red"
              @add-action="handleAddAction"
              @remove-action="handleRemoveAction"
              @duplicate-action="handleDuplicateAction"
              @move-action="handleMoveAction"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Export Modal -->
    <ExportModal v-if="showExportModal" @close="showExportModal = false" />

    <!-- Clear Sequence Confirmation Modal -->
    <Modal :show="showClearModal" @close="cancelClear">
      <template #header>
        <h2 class="text-xl font-bold text-white">
          {{ t('plugins.sequenceCreator.confirmations.title') }}
        </h2>
      </template>
      <template #body>
        <div class="text-center">
          <p class="text-gray-300 mb-6">
            {{ t('plugins.sequenceCreator.confirmations.clearSequence') }}
          </p>
          <div class="flex justify-center gap-4">
            <button @click="cancelClear" class="default-button-gray text-sm">
              {{ t('general.cancel') }}
            </button>
            <button @click="confirmClear" class="default-button-red text-sm">
              {{ t('general.confirm') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Save as Default Confirmation Modal -->
    <Modal :show="showSaveAsDefaultModal" @close="cancelSaveAsDefault">
      <template #header>
        <h2 class="text-xl font-bold text-white">
          {{ t('plugins.sequenceCreator.confirmations.title') }}
        </h2>
      </template>
      <template #body>
        <div class="text-center">
          <p class="text-gray-300 mb-6">
            {{ t('plugins.sequenceCreator.confirmations.saveAsDefault') }}
          </p>
          <div class="flex justify-center gap-4">
            <button @click="cancelSaveAsDefault" class="default-button-gray text-sm">
              {{ t('general.cancel') }}
            </button>
            <button @click="confirmSaveAsDefault" class="default-button-blue text-sm">
              {{ t('general.confirm') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Success Toast -->
    <div
      v-if="saveAsDefaultSuccess"
      class="fixed top-4 right-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out"
    >
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        {{ t('plugins.sequenceCreator.toolbar.saveAsDefaultSuccess') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSequenceStore } from '../stores/sequenceStore.js';
import SequenceContainer from './SequenceContainer.vue';
import ExportModal from './ExportModal.vue';
import Modal from '@/components/helpers/Modal.vue';

const { t } = useI18n();
const store = useSequenceStore();

const showExportModal = ref(false);
const showClearModal = ref(false);
const showSaveAsDefaultModal = ref(false);
const saveAsDefaultSuccess = ref(false);

function handleAddAction(template, containerType, index = null) {
  store.addAction(template, containerType, index);
}

function handleRemoveAction(actionId, containerType) {
  store.removeAction(actionId, containerType);
}

function handleDuplicateAction(actionId, containerType) {
  store.duplicateAction(actionId, containerType);
}

function handleMoveAction(oldIndex, newIndex, containerType) {
  store.moveAction(oldIndex, newIndex, containerType);
}

function handleClearSequence() {
  showClearModal.value = true;
}

function confirmClear() {
  store.clearSequence();
  showClearModal.value = false;
}

function cancelClear() {
  showClearModal.value = false;
}

function handleSaveAsDefault() {
  showSaveAsDefaultModal.value = true;
}

function confirmSaveAsDefault() {
  store.saveAsDefaultSequence();
  showSaveAsDefaultModal.value = false;

  // Show success feedback
  saveAsDefaultSuccess.value = true;

  // Hide success message after 3 seconds
  setTimeout(() => {
    saveAsDefaultSuccess.value = false;
  }, 3000);
}

function cancelSaveAsDefault() {
  showSaveAsDefaultModal.value = false;
}
</script>

<style scoped>
.sequence-editor {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.animate-fade-in-out {
  animation: fadeInOut 3s ease-in-out;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translate(-50%, 4px);
  }

  10%,
  90% {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -4px);
  }
}
</style>
