<template>
  <div class="flex flex-col bg-gray-900/80 w-full border border-gray-300 p-1 sm:p-2 mt-1 rounded-xl gap-1">
    <div class="flex flex-col w-full gap-1">
      <div>
        <p class="text-xs sm:text-sm min-w-24 sm:min-w-32 font-medium text-gray-500">
          {{ $t('components.mount.control.slewRate') }}
        </p>
      </div>
      <div class="flex flex-row w-full justify-center gap-1">
        <button class="btn-small text-xs" @click="settingsStore.mount.slewRate = 0.017">
          4x
        </button>
        <button class="btn-small text-xs" @click="settingsStore.mount.slewRate = 0.067">
          16x
        </button>
        <button class="btn-small text-xs" @click="settingsStore.mount.slewRate = 0.133">
          32x
        </button>
        <button class="btn-small text-xs" @click="settingsStore.mount.slewRate = 0.267">
          62x
        </button>
      </div>
    </div>
    <div class="flex flex-row w-full items-center gap-2">
      <input
        class="w-full mx-1 sm:mx-2"
        type="range"
        min="0.01"
        max="5"
        step="0.001"
        v-model="settingsStore.mount.slewRate"
      />
      <NumberInputPicker
        v-model="settingsStore.mount.slewRate"
        :label="$t('components.mount.control.slewRate')"
        labelKey="components.mount.control.slewRate"
        :min="0.01"
        :max="5"
        :step="0.001"
        :decimalPlaces="3"
        inputId="slew-rate"
        wrapperClass="w-32 sm:w-40"
      />
    </div>
  </div>
</template>

<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const settingsStore = useSettingsStore();
</script>

<style scoped>
.btn-small {
  border-radius: 0.5rem;
  background-color: #334155;
  padding: 0.25rem 0.5rem;
  box-shadow: 0 1px 8px black;
  border: 1px solid #0a0a0a;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  min-width: 2rem;
  min-height: 1.5rem;
  color: #e5e7eb;
  transition: all 0.2s;
}

.btn-small:hover {
  background-color: #475569;
}

@media (min-width: 640px) {
  .btn-small {
    min-width: 2.5rem;
    min-height: 1.75rem;
  }
}
</style>
