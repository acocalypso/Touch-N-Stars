<template>
  <Modal :show="show" @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-bold text-white">
        {{ target?.name || 'Target' }}
      </h2>
    </template>

    <template #body>
      <div class="w-full max-w-md mx-auto">
        <!-- Target Information -->
        <div v-if="target" class="mb-6 text-center">
          <div
            v-if="target.notes"
            class="bg-gray-800/50 rounded-lg p-3 border border-gray-600 mb-4"
          >
            <div class="text-sm text-gray-300">{{ target.notes }}</div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <!-- Set Sequence Target -->
          <SetSequenceTarget />

          <!-- Go To Framing -->
          <button
            @click="handleGoToFraming"
            class="w-full default-button-cyan flex items-center justify-center gap-3"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
              />
            </svg>
            Go To Framing
          </button>

          <!-- Slew -->
          <ButtonSlewCenterRotate
            :raAngle="target.coordinates.ra * 15"
            :decAngle="target.coordinates.dec"
            class="w-full"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { watch } from 'vue';
import Modal from '@/components/helpers/Modal.vue';
import ButtonSlewCenterRotate from '@/components/mount/ButtonSlewCenterRotate.vue';
import SetSequenceTarget from '@/components/framing/setSequenceTarget.vue';
import { useFramingStore } from '@/store/framingStore';
import { degreesToHMS, degreesToDMS } from '@/utils/utils';

const emit = defineEmits(['close', 'goToFraming']);

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  target: {
    type: Object,
    default: null,
  },
});

const framingStore = useFramingStore();

// Update framing store when target changes so SetSequenceTarget component works
watch(
  () => props.target,
  (newTarget) => {
    if (newTarget) {
      // Set the target in framing store for SetSequenceTarget component
      framingStore.RAangleString = degreesToHMS(newTarget.coordinates.ra * 15);
      framingStore.DECangleString = degreesToDMS(newTarget.coordinates.dec);
      framingStore.RAangle = newTarget.coordinates.ra * 15;
      framingStore.DECangle = newTarget.coordinates.dec;
      framingStore.selectedItem = {
        Name: newTarget.name || '',
        RA: newTarget.coordinates.ra * 15,
        Dec: newTarget.coordinates.dec,
      };
    }
  },
  { immediate: true }
);

const handleGoToFraming = () => {
  if (props.target) {
    emit('goToFraming', props.target);
  }
};
</script>
