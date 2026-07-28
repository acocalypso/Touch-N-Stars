<template>
  <button class="tns-btn-secondary w-full" :disabled="busy" @click="checkNow">
    {{ busy ? $t('updates.checking') : $t('updates.checkNow') }}
  </button>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const busy = ref(false);
let safetyTimer = null;

function clearSafetyTimer() {
  if (safetyTimer) {
    clearTimeout(safetyTimer);
    safetyTimer = null;
  }
}

function handleCheckFinished() {
  busy.value = false;
  clearSafetyTimer();
}

function checkNow() {
  if (busy.value) return;

  busy.value = true;
  // Fall back to releasing the button in case the finished event never arrives.
  clearSafetyTimer();
  safetyTimer = setTimeout(handleCheckFinished, 30000);

  // App.vue owns the update flow and answers with 'app-update-check-finished'.
  window.dispatchEvent(
    new CustomEvent('check-app-update', {
      detail: {
        resetDismissed: true,
        force: true,
      },
    })
  );
}

onMounted(() => {
  window.addEventListener('app-update-check-finished', handleCheckFinished);
});

onUnmounted(() => {
  window.removeEventListener('app-update-check-finished', handleCheckFinished);
  clearSafetyTimer();
});
</script>
