<template>
  <Modal :show="show" max-width="max-w-2xl" :disable-close="sending" @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-bold">{{ $t('plugins.hardwareDb.preview.title') }}</h2>
    </template>

    <template #body>
      <div class="w-full flex flex-col gap-4">
        <p class="text-sm text-gray-300">{{ $t('plugins.hardwareDb.preview.intro') }}</p>

        <!-- The full payload verbatim. Anything the user cannot see here is
             something they did not agree to send. -->
        <pre
          class="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs text-gray-200 overflow-x-auto max-h-72 overflow-y-auto whitespace-pre"
          >{{ prettyPayload }}</pre>

        <p class="text-xs text-gray-400">
          {{ $t('plugins.hardwareDb.preview.privacyNote') }}
        </p>

        <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>

        <div class="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button class="tns-btn-secondary min-h-touch" :disabled="sending" @click="$emit('close')">
            {{ $t('common.cancel') }}
          </button>
          <button class="tns-btn-primary min-h-touch" :disabled="sending" @click="$emit('confirm')">
            {{
              sending
                ? $t('plugins.hardwareDb.preview.sending')
                : $t('plugins.hardwareDb.preview.send')
            }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { computed } from 'vue';
import Modal from '@/components/helpers/Modal.vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  payload: { type: Object, default: null },
  sending: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
});

defineEmits(['close', 'confirm']);

const prettyPayload = computed(() => (props.payload ? JSON.stringify(props.payload, null, 2) : ''));
</script>
