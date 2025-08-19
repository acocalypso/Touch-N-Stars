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
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed h-10 lg:min-h-[3.5rem] w-10 flex items-center justify-center"
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
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed h-10 lg:min-h-[3.5rem] w-10 flex items-center justify-center"
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
          <button
            @click="handleLoadBasicSequence"
            class="default-button-cyan p-2 lg:px-3 lg:py-2 flex items-center justify-center lg:justify-start gap-1 w-10 lg:w-auto h-10 lg:min-h-[3.5rem]"
            :title="t('plugins.sequenceCreator.toolbar.loadBasicSequence')"
          >
            <svg
              class="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <span class="hidden lg:inline text-sm leading-tight button-text-2-lines">{{
              t('plugins.sequenceCreator.toolbar.loadBasicSequence')
            }}</span>
          </button>

          <!-- Save as Default -->
          <button
            @click="handleSaveAsDefault"
            :disabled="!store.sequenceIsValid"
            class="default-button-blue p-2 lg:px-3 lg:py-2 flex items-center justify-center lg:justify-start gap-1 w-10 lg:w-auto h-10 lg:min-h-[3.5rem]"
            :title="t('plugins.sequenceCreator.toolbar.saveAsDefault')"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M17 3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3M19 19H5V5H16.17L19 7.83V19M12 12C13.66 12 15 13.34 15 15C15 16.66 13.66 18 12 18C10.34 18 9 16.66 9 15C9 13.34 10.34 12 12 12M6 6H15V10H6V6Z"
              />
            </svg>
            <span class="hidden lg:inline text-sm leading-tight button-text-2-lines">{{
              t('plugins.sequenceCreator.toolbar.saveAsDefault')
            }}</span>
          </button>

          <!-- Clear All -->
          <button
            @click="handleClearSequence"
            class="default-button-red p-2 lg:px-3 lg:py-2 flex items-center justify-center lg:justify-start gap-1 w-10 lg:w-auto h-10 lg:min-h-[3.5rem]"
            :title="t('plugins.sequenceCreator.toolbar.clearSequence')"
          >
            <svg
              class="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span class="hidden lg:inline text-sm leading-tight button-text-2-lines">{{
              t('plugins.sequenceCreator.toolbar.clearSequence')
            }}</span>
          </button>

          <!-- Send to Nina -->
          <button
            @click="sendToNina"
            :disabled="!store.sequenceIsValid || isSendingToNina"
            :class="[
              'p-2 lg:px-3 lg:py-2 flex items-center justify-center lg:justify-start gap-1 w-10 lg:w-auto h-10 lg:min-h-[3.5rem] transition-colors',
              isSendingToNina
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'default-button-green',
            ]"
            :title="t('plugins.sequenceCreator.toolbar.sendToNina')"
          >
            <svg
              v-if="isSendingToNina"
              class="w-5 h-5 flex-shrink-0 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <svg
              v-else
              class="w-5 h-5 flex-shrink-0"
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
            <span class="hidden lg:inline text-sm leading-tight button-text-2-lines">{{
              isSendingToNina
                ? t('plugins.sequenceCreator.toolbar.sending')
                : t('plugins.sequenceCreator.toolbar.sendToNina')
            }}</span>
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

    <!-- Load Basic Sequence Confirmation Modal -->
    <Modal :show="showLoadBasicModal" @close="cancelLoadBasic">
      <template #header>
        <h2 class="text-xl font-bold text-white">
          {{ t('plugins.sequenceCreator.confirmations.title') }}
        </h2>
      </template>
      <template #body>
        <div class="text-center">
          <p class="text-gray-300 mb-6">
            {{ t('plugins.sequenceCreator.confirmations.loadBasicSequence') }}
          </p>
          <div class="flex justify-center gap-4">
            <button @click="cancelLoadBasic" class="default-button-gray text-sm">
              {{ t('general.cancel') }}
            </button>
            <button @click="confirmLoadBasic" class="default-button-cyan text-sm">
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
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSequenceStore } from '../stores/sequenceStore.js';
import { useToastStore } from '@/store/toastStore.js';
import SequenceContainer from './SequenceContainer.vue';
import Modal from '@/components/helpers/Modal.vue';
import apiService from '@/services/apiService.js';

const { t } = useI18n();
const store = useSequenceStore();
const toastStore = useToastStore();

const showClearModal = ref(false);
const showSaveAsDefaultModal = ref(false);
const showLoadBasicModal = ref(false);
const saveAsDefaultSuccess = ref(false);

// Send to Nina states
const isSendingToNina = ref(false);

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

function handleLoadBasicSequence() {
  showLoadBasicModal.value = true;
}

function confirmLoadBasic() {
  store.loadBasicSequence();
  showLoadBasicModal.value = false;
}

function cancelLoadBasic() {
  showLoadBasicModal.value = false;
}

async function sendToNina() {
  isSendingToNina.value = true;

  try {
    // Send the JSON content to N.I.N.A
    const response = await apiService.sequenceLoadJson(store.ninaSequenceJSON);

    if (response && response.Success !== false) {
      // Show success toast
      toastStore.showToast({
        type: 'success',
        title: t('plugins.sequenceCreator.toolbar.sent'),
        message: t('plugins.sequenceCreator.toolbar.sendSuccessMessage'),
        autoClose: true,
        autoCloseDelay: 1000
      });
      console.log('Sequence successfully sent to N.I.N.A:', response);
    } else {
      // Show error toast
      toastStore.showToast({
        type: 'error',
        title: t('plugins.sequenceCreator.toolbar.sendErrorTitle'),
        message: response?.Response || 'Unknown error occurred',
        autoClose: true,
        autoCloseDelay: 5000
      });
    }
  } catch (error) {
    // Show error toast
    toastStore.showToast({
      type: 'error',
      title: t('plugins.sequenceCreator.toolbar.sendErrorTitle'),
      message: error.message || 'Failed to send sequence to N.I.N.A',
      autoClose: true,
      autoCloseDelay: 5000
    });
    console.error('Error sending sequence to N.I.N.A:', error);
  } finally {
    isSendingToNina.value = false;
  }
}

// Check if sequences are empty on mount and load basic sequence
onMounted(() => {
  const isEmpty =
    store.startSequence.length === 0 &&
    store.targetSequence.length === 0 &&
    store.endSequence.length === 0;

  if (isEmpty) {
    store.loadBasicSequence();
  }
});
</script>

<style scoped>
.sequence-editor {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.button-text-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 2.5em; /* Approximately 2 lines with text-sm */
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
