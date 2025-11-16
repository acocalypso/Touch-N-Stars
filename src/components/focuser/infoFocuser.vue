<template>
  <div v-if="!store.focuserInfo.Connected" class="text-red-500">
    <p>{{ $t('components.focuser.please_connect_focuser') }}</p>
  </div>
  <div v-else class="gap-2">
    <StatusString
      :isEnabled="store.focuserInfo.Position !== ''"
      :Name="$t('components.focuser.current_position')"
      :Value="store.focuserInfo.Position"
    />
    <StatusString
      :isEnabled="isTemperatureEnabled"
      :Name="$t('components.focuser.temperature')"
      :Value="formattedTemperature"
    />
    <StatusBool
      :isEnabled="store.focuserInfo.IsMoving"
      :enabledText="$t('components.focuser.moving')"
      :disabledText="$t('components.focuser.stopped')"
    />
    <StatusBool
      :isEnabled="store.focuserAfInfo.autofocus_running"
      :enabledText="$t('components.focuser.autofocus_active')"
      :disabledText="$t('components.focuser.autofocus')"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import StatusBool from '@/components/helpers/StatusBool.vue';
import StatusString from '@/components/helpers/StatusString.vue';
import { apiStore } from '@/store/store';
const store = apiStore();

// Computed properties für die Temperatur
const isTemperatureEnabled = computed(() => {
  const temp = store.focuserInfo.Temperature;
  if (temp == null || isNaN(temp)) {
    return false; // Temperatur ist nicht gültig
  }
  return true; // Temperatur ist gültig
});
const formattedTemperature = computed(() => {
  const temp = store.focuserInfo.Temperature;
  if (temp == null || isNaN(temp)) {
    return 'N/A'; // Fallback zu 'N/A' bei ungültigen Werten
  }
  return temp.toFixed(2); // Formatierte Temperatur
});
</script>
