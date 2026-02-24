<template>
  <div class="w-full mb-6">
    <div class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700">
      <h3 class="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
        <ArrowDownTrayIcon class="h-6 w-6 text-green-400" />
        {{ $t('components.sequence.load_sequence') }}
      </h3>

      <div class="flex flex-col gap-4">
        <!-- Sequence selection dropdown with refresh button -->
        <div v-if="availableSequences.length > 0 || savedSequences.length > 0" class="space-y-2">
          <div class="flex gap-2">
            <select
              id="sequence-select"
              v-model="selectedSequence"
              @change="onSequenceSelected"
              :disabled="sequenceStore.sequenceRunning"
              :class="['default-select w-full', { 'glow-green': showSuccessGlow }]"
            >
              <option value="">{{ $t('components.sequence.choose_sequence') }}</option>
              <optgroup v-if="availableSequences.length > 0" label="N.I.N.A">
                <option v-for="sequence in availableSequences" :key="sequence" :value="sequence">
                  {{ sequence }}
                </option>
              </optgroup>
              <optgroup
                v-if="savedSequences.length > 0"
                :label="$t('components.sequence.saved_sequences')"
              >
                <option
                  v-for="seq in savedSequences"
                  :key="seq.key"
                  :value="'__saved__:' + seq.key"
                >
                  {{ seq.name }}
                </option>
              </optgroup>
            </select>
            <!-- Refresh button -->
            <button
              @click="fetchSequences"
              :disabled="isLoading"
              :class="['default-button-gray w-8', { 'glow-green': showRefreshSuccess }]"
              v-tooltip="'Refresh available sequences'"
            >
              <ArrowPathIcon :class="['h-5 w-5', isLoading ? 'animate-spin' : '']" />
            </button>
          </div>
        </div>

        <!-- Message and refresh button when no sequences are available -->
        <div v-if="availableSequences.length === 0 && savedSequences.length === 0" class="flex gap-2 items-center">
          <div
            class="flex-1 p-3 rounded-md text-sm bg-blue-600/20 text-blue-300 border border-blue-600/30"
          >
            {{ $t('components.sequence.no_sequences_found') }}
          </div>
          <button
            @click="fetchSequences"
            :disabled="isLoading"
            :class="['default-button-gray w-8', { 'glow-green': showRefreshSuccess }]"
            v-tooltip="'Refresh available sequences'"
          >
            <ArrowPathIcon :class="['h-5 w-5', isLoading ? 'animate-spin' : '']" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSequenceStore } from '@/store/sequenceStore';
import { useSequenceStore as useSequenceCreatorStore } from '@/plugins/sequence-creator/stores/sequenceStore';
import apiService from '@/services/apiService';
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';

const { t } = useI18n();
const sequenceStore = useSequenceStore();
const sequenceCreatorStore = useSequenceCreatorStore();

const availableSequences = ref([]);
const savedSequences = ref([]);
const selectedSequence = ref('');
const isLoading = ref(false);
const isLoadingSequence = ref(false);
const statusMessage = ref('');
const statusType = ref('info');
const showSuccessGlow = ref(false);
const showRefreshSuccess = ref(false);

const showStatus = (message, type = 'info', duration = 3000) => {
  statusMessage.value = message;
  statusType.value = type;

  if (type === 'success') {
    // Show glow effect for success
    showSuccessGlow.value = true;
    setTimeout(() => {
      showSuccessGlow.value = false;
    }, duration);
  }

  setTimeout(() => {
    statusMessage.value = '';
  }, duration);
};

const fetchSavedSequences = async () => {
  try {
    await sequenceCreatorStore.loadSavedSequencesList();
    savedSequences.value = sequenceCreatorStore.savedSequencesList;
  } catch {
    savedSequences.value = [];
  }
};

const fetchSequences = async (showGlow = true) => {
  isLoading.value = true;
  try {
    const response = await apiService.sequenceAction('list-available');

    if (!response.Success) {
      availableSequences.value = [];
      return;
    }

    if (response?.Response && Array.isArray(response.Response)) {
      availableSequences.value = response.Response;
      // Show glow on refresh button for success (only if not initial load)
      if (showGlow) {
        showRefreshSuccess.value = true;
        setTimeout(() => {
          showRefreshSuccess.value = false;
        }, 3000);
      }
    } else {
      availableSequences.value = [];
      showStatus(t('components.sequence.no_sequences_found'), 'info');
    }
  } catch (error) {
    console.error('Error fetching sequences:', error);
    showStatus(t('components.sequence.error_loading_sequences'), 'error');
  } finally {
    isLoading.value = false;
  }
};

const onSequenceSelected = async () => {
  if (!selectedSequence.value) return;

  if (selectedSequence.value.startsWith('__saved__:')) {
    const key = selectedSequence.value.slice('__saved__:'.length);
    isLoadingSequence.value = true;
    try {
      await sequenceCreatorStore.loadNamedSequence(key);
      const response = await apiService.sequenceLoadJson(sequenceCreatorStore.ninaSequenceJSON);
      if (response?.Success) {
        await sequenceStore.getSequenceInfo();
        showSuccessGlow.value = true;
        setTimeout(() => {
          showSuccessGlow.value = false;
        }, 3000);
      }
    } catch (error) {
      console.error('Error loading saved sequence:', error);
    } finally {
      isLoadingSequence.value = false;
      selectedSequence.value = '';
    }
  } else {
    loadSequence();
  }
};

const loadSequence = async () => {
  if (!selectedSequence.value) return;

  isLoadingSequence.value = true;
  try {
    const response = await apiService.sequenceAction(
      `load?sequenceName=${encodeURIComponent(selectedSequence.value)}`
    );

    if (!response.Success) {
      return;
    }

    if (response.Success) {
      // Refresh sequence info to show the loaded sequence
      await sequenceStore.getSequenceInfo();
    }
  } catch (error) {
    console.error('Error loading sequence:', error);
    showStatus(t('components.sequence.error_loading_sequence', { error: error.message }), 'error');
  } finally {
    isLoadingSequence.value = false;
  }
};

onMounted(() => {
  fetchSequences(false);
  fetchSavedSequences();
});
</script>

<style scoped></style>
