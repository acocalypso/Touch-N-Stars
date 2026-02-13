<template>
  <div v-if="isWandererRotator" class="p-2 flex flex-col gap-3">
    <div class="flex items-center justify-between border border-gray-500 p-2 rounded-lg">
      <div class="text-sm font-medium text-gray-300">
        {{ $t('components.rotator.settings.Overshoot') }}
      </div>
      <toggleButton :status-value="overshootEnabled" @click="toggleOvershoot" />
    </div>

    <div v-if="overshootEnabled" class="space-y-2">
      <div class="flex items-center justify-between border border-gray-500 p-2 rounded-lg">
        <div class="text-sm font-medium text-gray-300">
          {{ $t('components.rotator.settings.OvershootDirection') }}
        </div>
        <toggleButton :status-value="overshootDirection" @click="toggleOvershootDirection" />
      </div>

      <div class="border border-gray-500 p-2 rounded-lg bg-gray-800/40">
        <SettingInput
          labelKey="components.rotator.settings.OvershootAngle"
          settingKey="RotatorSettings-OvershootAngle"
          :modelValue="angleFromProfile"
          :min="0"
          :max="360"
          step="0.1"
          placeholder="0"
        />
      </div>
    </div>

    <div class="flex items-center justify-between">
      <button
        v-if="store.rotatorInfo?.Connected"
        class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm text-white"
        @click="resetZero"
      >
        {{ $t('components.rotator.settings.ResetPosition') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import toggleButton from '@/components/helpers/toggleButton.vue';
import SettingInput from '@/components/helpers/settings/UpdatePorfileNumber.vue';

const store = apiStore();

// derived/reactive values from profile (single source of truth)
const isWandererRotator = computed(() => store.rotatorInfo?.Name?.includes('Wanderer') ?? false);
const overshootEnabled = computed({
  get: () => store.profileInfo?.RotatorSettings?.Overshoot ?? false,
  set: async (v) => {
    await apiService.profileChangeValue('RotatorSettings-Overshoot', String(v));
  },
});
const overshootDirection = computed({
  get: () => store.profileInfo?.RotatorSettings?.OvershootDirection ?? false,
  set: async (v) => {
    await apiService.profileChangeValue('RotatorSettings-OvershootDirection', String(v));
  },
});
const angleFromProfile = computed(() => store.profileInfo?.RotatorSettings?.OvershootAngle ?? 0);

// toggle handlers use the computed setters so UI and profile stay in sync
function toggleOvershoot() {
  overshootEnabled.value = !overshootEnabled.value;
}
function toggleOvershootDirection() {
  overshootDirection.value = !overshootDirection.value;
}

async function resetZero() {
  try {
    await apiService.rotatorAction('reset-position');
    console.log('ResetPosition requested');
  } catch (err) {
    console.error('ResetPosition failed', err);
  }
}
</script>
