<template>
  <div
    class="flex flex-col gap-2 items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
  >
    <div class="flex flex-row items-center justify-between w-full">
      <label for="toggle_light" class="text-gray-200">
        {{ $t('components.camera.set_use_platesolve') }}
      </label>
      <div>
        <toggleButton
          @click="toggleSolve"
          :status-value="settingsStore.camera.useSolve"
          class="pr-5 pl-5 justify-center"
        />
      </div>
    </div>
    <div class="flex flex-row items-center justify-between w-full">
      <label for="toggle_light" class="text-gray-200">
        {{ $t('components.camera.set_use_solve_sync_to_mount') }}
      </label>
      <div>
        <toggleButton
          @click="toggleSync"
          :status-value="settingsStore.camera.useSyncSolveToMount"
          :disabled="!settingsStore.camera.useSolve"
          class="pr-5 pl-5 justify-center"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import toggleButton from '@/components/helpers/toggleButton.vue';

const settingsStore = useSettingsStore();

function toggleSolve() {
  if (settingsStore.camera.useSolve) {
    settingsStore.camera.useSolve = false;
    settingsStore.camera.useSyncSolveToMount = false;
    console.log('[setSolve] Platesolve off');
  } else {
    settingsStore.camera.useSolve = true;
    console.log('[setSolve] Platesolve on');
  }
}

function toggleSync() {
  if (settingsStore.camera.useSyncSolveToMount) {
    settingsStore.camera.useSyncSolveToMount = false;
    console.log('[setSolve] Sync solve to mount off');
  } else {
    settingsStore.camera.useSyncSolveToMount = true;
    console.log('[setSolve] Sync solve to mount on');
  }
}
</script>
