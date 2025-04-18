<template>
  <div>
    <button @click="showModal = true" :disabled="!hasTargetSelected" class="default-button-cyan">
      {{ $t('components.framing.setSequnceTarget') }}
    </button>

    <!-- Modal -->
    <transition name="fade">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 class="text-lg font-bold mb-4 text-gray-100">
            {{ $t('components.framing.confirmSetTargetTitle') }}
          </h3>
          <p class="mb-6 text-gray-300">{{ $t('components.framing.confirmSetTargetMessage') }}</p>
          <div class="flex justify-end space-x-4">
            <button
              @click="showModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              {{ $t('common.cancel') }}
            </button>
            <button
              @click="handleConfirm"
              class="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors"
            >
              {{ $t('common.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import apiService from '@/services/apiService';
import { useFramingStore } from '@/store/framingStore';
import { useSequenceStore } from '@/store/sequenceStore';

const showModal = ref(false);

const framingStore = useFramingStore();
const sequenceStore = useSequenceStore();

const hasTargetSelected = computed(() => !!framingStore.selectedItem);

async function handleConfirm() {
  showModal.value = false;
  await setSequenceTarget();
}

async function setSequenceTarget() {
  console.log('Setting sequence target');

  if (!framingStore.selectedItem) {
    console.error('No target selected');
    return;
  }

  const name = framingStore.selectedItem.Name;
  const ra = framingStore.RAangle;
  const dec = framingStore.DECangle;
  const rotation = framingStore.rotationAngle;
  const index = 0;

  console.log('Name:', name, 'RA:', ra, 'Dec:', dec, 'Rotation:', rotation);

  if (!sequenceStore.sequenceIsLoaded) {
    console.error('No sequence loaded');
    return;
  }

  try {
    await apiService.sequnceTargetSet(name, ra, dec, rotation, index);
    console.log('Sequence target updated successfully.');
  } catch (error) {
    console.error('Error setting sequence target:', error);
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
