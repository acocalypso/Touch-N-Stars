<template>
  <Modal :show="show" @close="$emit('close')" max-width="max-w-2xl">
    <template #header>
      <h2 class="text-xl font-bold text-cyan-400">
        {{ $t('components.profile.manage') }}
      </h2>
    </template>

    <template #body>
      <div class="w-full flex flex-col gap-4">
        <!-- Profiles List -->
        <div class="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
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
              v-for="profile in profiles"
              :key="profile.Id"
              class="flex items-center gap-2 p-3 bg-gray-800 rounded border"
              :class="profile.IsActive ? 'border-cyan-600' : 'border-gray-700'"
            >
              <!-- Active badge -->
              <span
                v-if="profile.IsActive"
                class="text-xs bg-cyan-700 text-cyan-100 px-2 py-0.5 rounded shrink-0"
              >
                ✓
              </span>

              <!-- Rename input or profile name -->
              <template v-if="renamingProfile && renamingProfile.Id === profile.Id">
                <input
                  v-model="renameValue"
                  type="text"
                  class="default-input flex-1"
                  :disabled="operationInProgress"
                  @keyup.enter="handleRenameConfirm"
                  @keyup.escape="cancelRename"
                  ref="renameInput"
                />
              </template>
              <span
                v-else
                class="flex-1 text-gray-200 truncate"
                :class="
                  !profile.IsActive && !operationInProgress
                    ? 'cursor-pointer hover:text-cyan-400 transition-colors'
                    : ''
                "
                @click="
                  !profile.IsActive && !operationInProgress ? handleSwitch(profile) : undefined
                "
                :title="!profile.IsActive ? $t('components.profile.switchTo') : ''"
                >{{ profile.Name }}</span
              >

              <!-- Action buttons -->
              <div class="flex gap-1 shrink-0">
                <!-- Rename confirm / cancel -->
                <template v-if="renamingProfile && renamingProfile.Id === profile.Id">
                  <button
                    @click="handleRenameConfirm"
                    class="default-button-cyan w-10 h-10 flex items-center justify-center"
                    :disabled="!canRename"
                    :title="$t('common.confirm')"
                  >
                    <CheckIcon class="w-5 h-5" />
                  </button>
                  <button
                    @click="cancelRename"
                    class="default-button-gray w-10 h-10 flex items-center justify-center"
                    :title="$t('common.cancel')"
                  >
                    <XMarkIcon class="w-5 h-5" />
                  </button>
                </template>

                <!-- Rename + Clone + Remove buttons (normal state) -->
                <template v-else>
                  <!-- Rename button -->
                  <button
                    @click="startRename(profile)"
                    class="default-button-cyan w-10 h-10 flex items-center justify-center"
                    :disabled="operationInProgress"
                    :title="$t('components.profile.rename')"
                  >
                    <PencilIcon class="w-5 h-5" />
                  </button>

                  <!-- Clone button -->
                  <button
                    @click="handleClone(profile)"
                    class="default-button-cyan w-10 h-10 flex items-center justify-center"
                    :disabled="operationInProgress"
                    :title="$t('components.profile.clone')"
                  >
                    <DocumentDuplicateIcon class="w-5 h-5" />
                  </button>

                  <!-- Remove button -->
                  <button
                    @click="handleRemoveClick(profile)"
                    :disabled="profile.IsActive || profiles.length <= 1 || operationInProgress"
                    :class="[
                      'w-10 h-10 flex items-center justify-center transition-colors',
                      removeConfirmFor === profile.Id
                        ? 'bg-red-700 hover:bg-red-800 rounded'
                        : profile.IsActive || profiles.length <= 1
                          ? 'default-button-gray opacity-50 cursor-not-allowed'
                          : 'default-button-red',
                    ]"
                    :title="
                      profile.IsActive
                        ? $t('components.profile.cannotRemoveActive')
                        : profiles.length <= 1
                          ? $t('components.profile.cannotRemoveLast')
                          : $t('components.profile.remove')
                    "
                  >
                    <TrashIcon v-if="removeConfirmFor !== profile.Id" class="w-5 h-5" />
                    <CheckIcon v-else class="w-5 h-5" />
                  </button>
                </template>
              </div>
            </div>

            <div v-if="profiles.length === 0" class="text-center text-gray-400 py-4">
              {{ $t('components.profile.noProfiles') }}
            </div>
          </div>
        </div>

        <!-- Add new profile button -->
        <button
          @click="handleAdd"
          class="default-button-cyan w-full py-2 flex items-center justify-center gap-2"
          :disabled="operationInProgress"
        >
          <PlusIcon class="w-5 h-5" />
          {{ $t('components.profile.add') }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import Modal from '@/components/helpers/Modal.vue';
import apiService from '@/services/apiService';
import {
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['close', 'profile-changed']);

const profiles = ref([]);
const renamingProfile = ref(null);
const renameValue = ref('');
const removeConfirmFor = ref(null);
const operationInProgress = ref(false);
const renameInput = ref(null);

const canRename = computed(() => {
  if (!renameValue.value.trim()) return false;
  if (renamingProfile.value && renameValue.value.trim() === renamingProfile.value.Name)
    return false;
  return !profiles.value.some(
    (p) => p.Name.toLowerCase() === renameValue.value.trim().toLowerCase()
  );
});

async function fetchProfiles() {
  try {
    const response = await apiService.profileAction('show');
    if (response && response.Response) {
      profiles.value = response.Response;
    }
  } catch (error) {
    console.error('Error loading profiles:', error);
  }
}

async function handleSwitch(profile) {
  if (operationInProgress.value) return;
  operationInProgress.value = true;
  try {
    await apiService.profileSwitch(profile.Id);
    await fetchProfiles();
    emit('profile-changed');
  } catch (error) {
    console.error('Error switching profile:', error);
  } finally {
    operationInProgress.value = false;
  }
}

async function handleAdd() {
  if (operationInProgress.value) return;
  operationInProgress.value = true;
  try {
    await apiService.profileAdd();
    await fetchProfiles();
    emit('profile-changed');
  } catch (error) {
    console.error('Error adding profile:', error);
  } finally {
    operationInProgress.value = false;
  }
}

async function handleClone(profile) {
  if (operationInProgress.value) return;
  operationInProgress.value = true;
  try {
    await apiService.profileClone(profile.Id);
    await fetchProfiles();
    emit('profile-changed');
  } catch (error) {
    console.error('Error cloning profile:', error);
  } finally {
    operationInProgress.value = false;
  }
}

function startRename(profile) {
  renamingProfile.value = profile;
  renameValue.value = profile.Name;
  removeConfirmFor.value = null;
  nextTick(() => {
    if (renameInput.value && renameInput.value.length > 0) {
      renameInput.value[0]?.focus();
      renameInput.value[0]?.select();
    }
  });
}

function cancelRename() {
  renamingProfile.value = null;
  renameValue.value = '';
}

async function handleRenameConfirm() {
  if (!canRename.value || operationInProgress.value || !renamingProfile.value) return;
  operationInProgress.value = true;
  const profile = renamingProfile.value;
  const name = renameValue.value.trim();
  try {
    if (!profile.IsActive) {
      await apiService.profileSwitch(profile.Id);
    }
    await apiService.profileChangeValue('Name', name);
    cancelRename();
    await fetchProfiles();
    emit('profile-changed');
  } catch (error) {
    console.error('Error renaming profile:', error);
  } finally {
    operationInProgress.value = false;
  }
}

function handleRemoveClick(profile) {
  if (profile.IsActive || profiles.value.length <= 1) return;

  if (removeConfirmFor.value === profile.Id) {
    handleRemove(profile);
  } else {
    removeConfirmFor.value = profile.Id;
    setTimeout(() => {
      if (removeConfirmFor.value === profile.Id) {
        removeConfirmFor.value = null;
      }
    }, 3000);
  }
}

async function handleRemove(profile) {
  operationInProgress.value = true;
  try {
    await apiService.profileRemove(profile.Id);
    removeConfirmFor.value = null;
    await fetchProfiles();
    emit('profile-changed');
  } catch (error) {
    console.error('Error removing profile:', error);
  } finally {
    operationInProgress.value = false;
  }
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      fetchProfiles();
    } else {
      renamingProfile.value = null;
      renameValue.value = '';
      removeConfirmFor.value = null;
    }
  }
);
</script>
