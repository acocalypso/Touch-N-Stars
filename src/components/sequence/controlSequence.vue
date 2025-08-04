<template>
  <div
    :class="['fixed flex gap-2 z-10', isLandscape ? 'left-36' : 'left-3']"
    style="bottom: calc(env(safe-area-inset-bottom, 0px) + 48px)"
  >
    <button
      :class="[
        'default-button-blue h-14 w-14',
        { 'opacity-75 cursor-not-allowed': sequenceStore.sequenceRunning },
      ]"
      @click="startSequence"
      :disabled="sequenceStore.sequenceRunning"
      v-tooltip="
        sequenceStore.sequenceRunning
          ? $t('components.sequence.running')
          : $t('components.sequence.startSequence')
      "
    >
      <span v-if="sequenceStore.sequenceRunning" class="animate-spin text-lg">&#9696;</span>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="h-8 w-8"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <button
      class="default-button-red h-14 w-14"
      @click="stopSequence"
      v-tooltip="$t('components.sequence.stopSequence')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-8 w-8"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <button
      class="default-button-orange h-14 w-14"
      @click="showResetConfirmation = true"
      :disabled="sequenceStore.sequenceRunning"
      v-tooltip="$t('components.sequence.resetSequence')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-8 w-8"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <!-- Reset Confirmation Dialog -->
    <transition name="fade">
      <div
        v-if="showResetConfirmation"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50"
        @click.self="showResetConfirmation = false"
        @keydown.esc="showResetConfirmation = false"
      >
        <transition name="scale">
          <div v-if="showResetConfirmation" class="bg-gray-800 rounded-lg p-6 max-w-md w-full mt-4">
            <h3 class="text-xl font-semibold mb-4">
              {{ $t('components.sequence.resetConfirmationTitle') }}
            </h3>
            <p class="mb-6">{{ $t('components.sequence.resetConfirmationMessage') }}</p>
            <div class="flex justify-end space-x-4">
              <button class="btn-secondary" @click="showResetConfirmation = false">
                {{ $t('general.cancel') }}
              </button>
              <button class="btn-danger" @click="confirmReset">
                {{ $t('general.confirm') }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import apiService from '@/services/apiService';
import { useSequenceStore } from '@/store/sequenceStore';
import { useOrientation } from '@/composables/useOrientation';

const sequenceStore = useSequenceStore();
const showResetConfirmation = ref(false);
const isLoading = computed(() => sequenceStore.sequenceRunning);
const { isLandscape } = useOrientation();

async function startSequence() {
  console.log('Starting sequence');
  sequenceStore.setSequenceRunning(true);
  try {
    const data = await apiService.sequenceAction('start');
    console.log('Antwort:', data);
    await sequenceStore.getSequenceInfo();
  } catch (error) {
    console.log('Fehler:', error);
    sequenceStore.setSequenceRunning(false);
  }
}

async function stopSequence() {
  try {
    const data = await apiService.sequenceAction('stop');
    console.log('Antwort:', data);

    // Only stop if the API confirms success
    if (data.Success) {
      await sequenceStore.getSequenceInfo();
      sequenceStore.setSequenceRunning(false);
    } else {
      console.error('Failed to stop sequence:', data.Error);
    }
  } catch (error) {
    console.log('Fehler:', error);
    sequenceStore.setSequenceRunning(false);
  }
}

async function confirmReset() {
  isLoading.value = true;
  showResetConfirmation.value = false;
  try {
    // Use the store's resetSequence method which handles notifications
    const success = await sequenceStore.resetSequence();

    if (success) {
      // Reset successful
      await sequenceStore.getSequenceInfo();
      isLoading.value = false;
    } else {
      console.error('Failed to reset sequence');
      // Allow retry on error
      isLoading.value = false;
    }
  } catch (error) {
    console.log('Fehler:', error);
    // Allow retry on error
    isLoading.value = false;
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}
</style>
