<template>
  <!-- One tap, no confirmation (like ButtonSlewStop): stopping the mount must never wait. -->
  <div
    v-if="visible"
    class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ground/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
  >
    <div class="mx-auto max-w-3xl">
      <button
        class="tns-btn-danger min-h-[72px] text-lg font-bold gap-3"
        :disabled="stopping"
        @click="stop"
      >
        <StopCircleIcon class="w-10 h-10" />
        {{
          store.manualActive
            ? $t('plugins.coneError.abort.stop')
            : $t('plugins.coneError.abort.button')
        }}
      </button>
      <p v-if="failed" class="mt-2 text-center text-sm text-status-danger">
        {{ $t('plugins.coneError.abort.failed') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { StopCircleIcon } from '@heroicons/vue/24/outline';
import { useConeErrorStore } from '../store/coneErrorStore';

const store = useConeErrorStore();
const stopping = ref(false);
const failed = ref(false);

// The automated run can move the mount at any time; the daytime check only during a move.
const visible = computed(() => store.autoRunning || (store.manualActive && store.moving));

async function stop() {
  stopping.value = true;
  failed.value = false;
  try {
    if (store.manualActive) {
      await store.manualStop();
    } else {
      await store.abort();
    }
  } catch {
    failed.value = true;
  } finally {
    stopping.value = false;
  }
}
</script>
