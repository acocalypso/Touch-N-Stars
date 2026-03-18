<template>
  <div
    :class="[
      'fixed flex flex-wrap gap-2 z-10',
      isLandscape ? 'left-36 max-w-[calc(100vw-9rem)]' : 'left-3 max-w-[calc(100vw-0.75rem)]',
    ]"
    style="bottom: calc(env(safe-area-inset-bottom, 0px) + 48px)"
  >
    <button
      :class="[
        'default-button-green h-16 w-14 flex-col gap-0.5',
        { 'opacity-75 cursor-not-allowed': sequenceStore.sequenceRunning },
      ]"
      @click="startSequence"
      :disabled="sequenceStore.sequenceRunning"
    >
      <span v-if="sequenceStore.sequenceRunning" class="animate-spin text-lg">&#9696;</span>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="h-7 w-7"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
          clip-rule="evenodd"
        />
      </svg>
      <span class="text-[9px] leading-none font-medium">{{
        $t('components.sequence.startSequence')
      }}</span>
    </button>

    <button
      v-if="sequenceStore.sequenceRunning"
      class="default-button-cyan h-16 w-14 flex-col gap-0.5"
      @click="stopSequence"
    >
      <PauseIcon class="h-7 w-7" />
      <span class="text-[9px] leading-none font-medium">{{
        $t('components.sequence.pauseSequence')
      }}</span>
    </button>

    <button
      v-if="sequenceStore.sequenceRunning"
      class="default-button-blue h-16 w-14 flex-col gap-0.5"
      @click="skipCurrentItem"
    >
      <ForwardIcon class="h-6 w-6" />
      <span class="text-[9px] leading-none font-medium">{{
        $t('components.sequence.skipCurrentItem')
      }}</span>
    </button>

    <button
      v-if="sequenceStore.sequenceRunning"
      class="default-button-red h-16 w-14 flex-col gap-0.5"
      @click="skipToEnd"
    >
      <FlagIcon class="h-6 w-6" />
      <span class="text-[9px] leading-none font-medium">{{
        $t('components.sequence.skipToEnd')
      }}</span>
    </button>

    <button
      v-if="!sequenceStore.sequenceRunning"
      class="default-button-orange h-16 w-14 flex-col gap-0.5"
      @click="showResetConfirmation = true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-7 w-7"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
          clip-rule="evenodd"
        />
      </svg>
      <span class="text-[9px] leading-none font-medium">{{
        $t('components.sequence.resetSequence')
      }}</span>
    </button>

    <button
      v-if="
        !sequenceStore.sequenceRunning &&
        (store.isPINS || store.checkVersionNewerOrEqual(store.currentTnsPluginVersion, '1.2.8.0'))
      "
      class="default-button-red h-16 w-14 flex-col gap-0.5"
      @click="clearSequence"
    >
      <TrashIcon class="h-7 w-7" />
      <span class="text-[9px] leading-none font-medium">{{
        $t('components.sequence.clearSequence')
      }}</span>
    </button>

    <button
      v-if="
        !sequenceStore.sequenceRunning &&
        (store.isPINS || store.checkVersionNewerOrEqual(store.currentTnsPluginVersion, '1.2.8.0'))
      "
      class="default-button-gray h-16 w-14 flex-col gap-0.5"
      @click="openFileManager"
    >
      <FolderOpenIcon class="h-6 w-6" />
      <span class="text-[9px] leading-none font-medium">{{
        $t('components.sequence.manageSequences')
      }}</span>
    </button>

    <!-- File Manager Modal -->
    <Modal :show="showFileManager" max-width="max-w-lg" @close="showFileManager = false">
      <template #header>
        <h2 class="text-xl font-bold text-cyan-400">
          {{ $t('components.sequence.manageSequences') }}
        </h2>
      </template>
      <template #body>
        <div class="w-full flex flex-col gap-4">
          <!-- File list -->
          <div class="flex flex-col gap-1 max-h-64 overflow-y-auto">
            <div v-if="filesLoading" class="text-slate-400 text-sm text-center py-4">
              {{ $t('components.sequence.sequenceLoading') }}
            </div>
            <div
              v-else-if="sequenceFiles.length === 0"
              class="text-slate-500 text-sm text-center py-4"
            >
              {{ $t('components.sequence.sequenceNoFiles') }}
            </div>
            <div
              v-for="file in sequenceFiles"
              :key="file.FilePath"
              class="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-slate-700/40"
            >
              <span class="text-sm text-gray-200 truncate">{{ file.FileName }}</span>
              <div class="flex gap-1 flex-shrink-0">
                <button
                  v-if="!sequenceStore.sequenceRunning"
                  class="text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-cyan-900/20 transition-colors"
                  @click="loadFile(file.FilePath)"
                >
                  {{ $t('components.sequence.sequenceLoad') }}
                </button>
                <button
                  class="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
                  @click="deleteFile(file.FilePath, file.FileName)"
                >
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Save section -->
          <div class="border-t border-slate-700 pt-3 flex flex-col gap-2">
            <label class="text-xs text-slate-400">{{
              $t('components.sequence.saveSequenceAs')
            }}</label>
            <div class="flex gap-2">
              <input
                v-model="saveFileName"
                type="text"
                :placeholder="$t('components.sequence.sequenceFileName')"
                class="flex-1 bg-slate-700/60 border border-slate-600 rounded px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-cyan-500/50"
                @keydown.enter="saveFile"
              />
              <button
                class="text-xs text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded border border-cyan-500/40 hover:bg-cyan-900/20 flex-shrink-0 transition-colors"
                :disabled="!saveFileName.trim() || saveLoading"
                @click="saveFile"
              >
                {{ saveLoading ? '...' : $t('components.sequence.sequenceSave') }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation Dialog -->
    <Modal
      :show="showDeleteConfirmation"
      max-width="max-w-md"
      @close="showDeleteConfirmation = false"
    >
      <template #header>
        <h2 class="text-xl font-bold">{{ $t('components.sequence.deleteConfirmationTitle') }}</h2>
      </template>
      <template #body>
        <div class="w-full flex flex-col gap-6">
          <p>
            {{ $t('components.sequence.deleteConfirmationMessage') }}
            <span class="text-gray-200 font-medium">{{ fileToDelete?.name }}</span
            >?
          </p>
          <div class="flex justify-end space-x-4">
            <button class="btn-secondary" @click="showDeleteConfirmation = false">
              {{ $t('general.cancel') }}
            </button>
            <button class="btn-danger" @click="confirmDeleteFile">
              {{ $t('general.confirm') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Reset Confirmation Dialog -->
    <Modal
      :show="showResetConfirmation"
      max-width="max-w-md"
      @close="showResetConfirmation = false"
    >
      <template #header>
        <h2 class="text-xl font-bold">{{ $t('components.sequence.resetConfirmationTitle') }}</h2>
      </template>
      <template #body>
        <div class="w-full flex flex-col gap-6">
          <p>{{ $t('components.sequence.resetConfirmationMessage') }}</p>
          <div class="flex justify-end space-x-4">
            <button class="btn-secondary" @click="showResetConfirmation = false">
              {{ $t('general.cancel') }}
            </button>
            <button class="btn-danger" @click="confirmReset">
              {{ $t('general.confirm') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import apiService from '@/services/apiService';
import { useSequenceStore } from '@/store/sequenceStore';
import { useOrientation } from '@/composables/useOrientation';
import { apiStore } from '@/store/store';
import {
  FolderOpenIcon,
  FlagIcon,
  ForwardIcon,
  PauseIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline';
import Modal from '@/components/helpers/Modal.vue';

const sequenceStore = useSequenceStore();
const store = apiStore();
const showResetConfirmation = ref(false);
const isLoading = computed(() => sequenceStore.sequenceRunning);
const { isLandscape } = useOrientation();

// File manager state
const showFileManager = ref(false);
const sequenceFiles = ref([]);
const filesLoading = ref(false);
const saveFileName = ref('');
const saveLoading = ref(false);
const showDeleteConfirmation = ref(false);
const fileToDelete = ref(null);

async function skipToEnd() {
  try {
    await apiService.sequenceSkipToEnd();
  } catch (e) {
    console.error('Error skipping to end:', e);
  }
}

async function skipCurrentItem() {
  try {
    await apiService.sequenceSkipCurrentItem();
  } catch (e) {
    console.error('Error skipping current item:', e);
  }
}

async function openFileManager() {
  showFileManager.value = true;
  filesLoading.value = true;
  try {
    const defaultFolder = store.profileInfo?.SequenceSettings?.DefaultSequenceFolder;
    const result = await apiService.sequenceFetchFiles(defaultFolder);
    sequenceFiles.value = result?.Sequences ?? [];
  } catch (e) {
    sequenceFiles.value = [];
  } finally {
    filesLoading.value = false;
  }
}

function deleteFile(filePath, fileName) {
  fileToDelete.value = { path: filePath, name: fileName };
  showDeleteConfirmation.value = true;
}

async function confirmDeleteFile() {
  if (!fileToDelete.value) return;
  showDeleteConfirmation.value = false;
  try {
    await apiService.sequenceDeleteFile(fileToDelete.value.path);
    const defaultFolder = store.profileInfo?.SequenceSettings?.DefaultSequenceFolder;
    const result = await apiService.sequenceFetchFiles(defaultFolder);
    sequenceFiles.value = result?.Sequences ?? [];
  } catch (e) {
    console.error('Error deleting sequence file:', e);
  } finally {
    fileToDelete.value = null;
  }
}

async function loadFile(filePath) {
  try {
    await apiService.sequenceLoadFile(filePath);
    await sequenceStore.getSequenceInfo();
    showFileManager.value = false;
  } catch (e) {
    console.error('Error loading sequence file:', e);
  }
}

async function saveFile() {
  if (!saveFileName.value.trim()) return;
  saveLoading.value = true;
  try {
    const defaultFolder = store.profileInfo?.SequenceSettings?.DefaultSequenceFolder ?? '';
    const sep =
      defaultFolder.endsWith('\\') || defaultFolder.endsWith('/')
        ? ''
        : defaultFolder.includes('/')
          ? '/'
          : '\\';
    const name = saveFileName.value.trim().endsWith('.json')
      ? saveFileName.value.trim()
      : saveFileName.value.trim() + '.json';
    const filePath = defaultFolder ? defaultFolder + sep + name : name;
    await apiService.sequenceSaveFile(filePath);
    saveFileName.value = '';
    // Refresh file list
    const result = await apiService.sequenceFetchFiles(defaultFolder || undefined);
    sequenceFiles.value = result?.Sequences ?? [];
  } catch (e) {
    console.error('Error saving sequence file:', e);
  } finally {
    saveLoading.value = false;
  }
}

async function startSequence() {
  console.log('Starting sequence');
  sequenceStore.setSequenceRunning(true);
  try {
    const data = await apiService.sequenceAction('start');
    console.log('Response:', data);
    await sequenceStore.getSequenceInfo();
  } catch (error) {
    console.log('Error:', error);
    sequenceStore.setSequenceRunning(false);
  }
}

async function stopSequence() {
  try {
    const data = await apiService.sequenceAction('stop');
    console.log('Response:', data);

    // Only stop if the API confirms success
    if (data.Success) {
      await sequenceStore.getSequenceInfo();
      sequenceStore.setSequenceRunning(false);
    } else {
      console.error('Failed to stop sequence:', data.Error);
    }
  } catch (error) {
    console.log('Error:', error);
    sequenceStore.setSequenceRunning(false);
  }
}

async function confirmReset() {
  isLoading.value = true;
  showResetConfirmation.value = false;
  try {
    const success = await sequenceStore.resetSequence();

    if (success) {
      await sequenceStore.getSequenceInfo();
      isLoading.value = false;
    } else {
      console.error('Failed to reset sequence');
      isLoading.value = false;
    }
  } catch (error) {
    console.log('Error:', error);
    isLoading.value = false;
  }
}

async function clearSequence() {
  try {
    const response = await apiService.sequenceClear();
    if (response) {
      await sequenceStore.getSequenceInfo();
    } else {
      console.error('Failed to clear sequence');
    }
  } catch (error) {
    console.error('Error clearing sequence:', error);
  }
}
</script>
