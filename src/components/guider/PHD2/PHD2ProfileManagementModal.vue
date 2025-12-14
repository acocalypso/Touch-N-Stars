<template>
  <Modal :show="show" @close="$emit('close')" max-width="max-w-2xl">
    <template #header>
      <h2 class="text-xl font-bold text-cyan-400">
        {{ $t('components.guider.phd2.profileManagement.title') }}
      </h2>
    </template>

    <template #body>
      <div class="w-full flex flex-col gap-4">
        <!-- Create New Profile Section -->
        <div class="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <h3 class="text-sm font-semibold text-gray-300 mb-3">
            {{ $t('components.guider.phd2.profileManagement.createNew') }}
          </h3>
          <div class="flex gap-2">
            <input
              v-model="newProfileName"
              type="text"
              :placeholder="$t('components.guider.phd2.profileManagement.profileNamePlaceholder')"
              class="default-input flex-1"
              :disabled="operationInProgress"
              @keyup.enter="handleCreate"
            />
            <button
              @click="handleCreate"
              class="default-button-cyan px-4 max-w-28"
              :disabled="!canCreate || operationInProgress"
            >
              {{ $t('components.guider.phd2.profileManagement.create') }}
            </button>
          </div>
          <p v-if="newProfileNameError" class="text-xs text-red-400 mt-2">
            {{ newProfileNameError }}
          </p>
        </div>

        <!-- Profiles List -->
        <div class="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <h3 class="text-sm font-semibold text-gray-300 mb-3">
            {{ $t('components.guider.phd2.profileManagement.profilesList') }}
          </h3>

          <!-- Loading Spinner -->
          <div v-if="operationInProgress" class="flex justify-center py-8">
            <svg
              class="animate-spin h-8 w-8 text-cyan-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>

          <!-- Profiles -->
          <div v-else class="space-y-2">
            <div
              v-for="(profile, index) in profiles"
              :key="profile"
              class="flex items-center gap-2 p-3 bg-gray-800 rounded border border-gray-700"
            >
              <!-- Profile Name (editable if editing) -->
              <input
                v-if="editingProfileName === profile"
                v-model="renameValue"
                type="text"
                class="default-input flex-1"
                @keyup.enter="handleRename(profile)"
                @keyup.escape="cancelEdit"
                ref="renameInput"
              />
              <span v-else class="flex-1 text-gray-200">
                {{ profile }}
              </span>

              <!-- Action Buttons -->
              <div class="flex gap-1">
                <!-- Rename Button / Confirm -->
                <button
                  v-if="editingProfileName === profile"
                  @click="handleRename(profile, index)"
                  class="default-button-cyan w-10 h-10 flex items-center justify-center"
                  :disabled="!canRename"
                  :title="$t('common.confirm')"
                >
                  <CheckIcon class="w-5 h-5" />
                </button>
                <button
                  v-else
                  @click="startEdit(profile)"
                  class="default-button-cyan w-10 h-10 flex items-center justify-center"
                  :title="$t('components.guider.phd2.profileManagement.rename')"
                >
                  <PencilIcon class="w-5 h-5" />
                </button>

                <!-- Cancel Edit Button -->
                <button
                  v-if="editingProfileName === profile"
                  @click="cancelEdit"
                  class="default-button-gray w-10 h-10 flex items-center justify-center"
                  :title="$t('components.guider.phd2.profileManagement.cancel')"
                >
                  <XMarkIcon class="w-5 h-5" />
                </button>

                <!-- Delete Button -->
                <button
                  v-if="editingProfileName !== profile"
                  @click="handleDeleteClick(profile)"
                  :disabled="profiles.length <= 1"
                  :class="[
                    'w-10 h-10 flex items-center justify-center transition-colors',
                    deleteConfirmFor === profile
                      ? 'bg-red-700 hover:bg-red-800'
                      : profiles.length <= 1
                        ? 'default-button-gray opacity-50 cursor-not-allowed'
                        : 'default-button-red',
                  ]"
                >
                  <TrashIcon v-if="deleteConfirmFor !== profile" class="w-5 h-5" />
                  <CheckIcon v-else class="w-5 h-5" />
                </button>
              </div>
            </div>

            <!-- No profiles message -->
            <div v-if="profiles.length === 0" class="text-center text-gray-400 py-4">
              No profiles available
            </div>
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useGuiderStore } from '@/store/guiderStore';
import Modal from '@/components/helpers/Modal.vue';
import { PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['close']);

const guiderStore = useGuiderStore();

// Local state
const newProfileName = ref('');
const editingProfileName = ref(null);
const renameValue = ref('');
const operationInProgress = ref(false);
const statusMessage = ref(null);
const deleteConfirmFor = ref(null);
const renameInput = ref(null);

// Computed
const profiles = computed(() => guiderStore.phd2EquipmentProfiles);

const newProfileNameError = computed(() => {
  if (!newProfileName.value) return null;
  if (profiles.value.includes(newProfileName.value)) {
    return 'Profile name already exists';
  }
  return null;
});

const canCreate = computed(() => {
  return newProfileName.value.trim() !== '' && !newProfileNameError.value;
});

const canRename = computed(() => {
  if (!renameValue.value.trim()) return false;
  if (renameValue.value === editingProfileName.value) return false;
  if (profiles.value.includes(renameValue.value)) return false;
  return true;
});

// Watch for edit mode to focus input
watch(editingProfileName, async (newVal) => {
  if (newVal) {
    await nextTick();
    if (renameInput.value && renameInput.value.length > 0) {
      renameInput.value[0]?.focus();
      renameInput.value[0]?.select();
    }
  }
});

// Reset delete confirmation when switching profiles
watch(
  () => props.show,
  (newVal) => {
    if (!newVal) {
      deleteConfirmFor.value = null;
      editingProfileName.value = null;
      statusMessage.value = null;
    }
  },
);

// Methods
function showStatus(type, messageKey) {
  statusMessage.value = {
    type,
    text: messageKey,
  };

  if (type === 'success') {
    setTimeout(() => {
      statusMessage.value = null;
    }, 3000);
  }
}

async function handleCreate() {
  if (!canCreate.value || operationInProgress.value) return;

  operationInProgress.value = true;
  try {
    await guiderStore.createPHD2Profile(newProfileName.value);
    showStatus('success', 'Profile created successfully');
    newProfileName.value = '';
  } catch (error) {
    showStatus('error', error.message || 'Failed to create profile');
  } finally {
    operationInProgress.value = false;
  }
}

function startEdit(profile) {
  editingProfileName.value = profile;
  renameValue.value = profile;
  deleteConfirmFor.value = null;
}

function cancelEdit() {
  editingProfileName.value = null;
  renameValue.value = '';
}

async function handleRename(oldName, index) {
  if (!canRename.value || operationInProgress.value) return;

  operationInProgress.value = true;
  try {
    console.log('Renaming profile', index);
    await guiderStore.renamePHD2Profile(renameValue.value, index + 1);
    showStatus('success', 'Profile renamed successfully');
    editingProfileName.value = null;
    renameValue.value = '';
  } catch (error) {
    showStatus('error', error.message || 'Failed to rename profile');
  } finally {
    operationInProgress.value = false;
  }
}

function handleDeleteClick(profile) {
  console.log('Delete clicked for profile', profile);
  if (profiles.value.length <= 1) {
    showStatus('error', 'Cannot delete the last profile');
    return;
  }

  if (deleteConfirmFor.value === profile) {
    handleDelete(profile);
  } else {
    deleteConfirmFor.value = profile;
    setTimeout(() => {
      if (deleteConfirmFor.value === profile) {
        deleteConfirmFor.value = null;
      }
    }, 3000);
  }
}

async function handleDelete(profile) {
  operationInProgress.value = true;
  try {
    await guiderStore.deletePHD2Profile(profile);
    showStatus('success', 'Profile deleted successfully');
    deleteConfirmFor.value = null;
  } catch (error) {
    showStatus('error', error.message || 'Failed to delete profile');
  } finally {
    operationInProgress.value = false;
  }
}
</script>
