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
    <template v-if="store.isPINS && focuserStore.focuserSettings">
      <StatusBool
        v-if="focuserStore.focuserSettings.IsStalled !== undefined"
        :isEnabled="focuserStore.focuserSettings.IsStalled"
        :enabledText="$t('components.focuser.IsStalled')"
        :disabledText="$t('components.focuser.IsStalled')"
      />
      <StatusString
        v-if="focuserStore.focuserSettings.HeatingPower !== undefined"
        :Name="$t('components.focuser.HeatingPower')"
        :Value="focuserStore.focuserSettings.HeatingPower + ' %'"
      />
      <StatusString
        v-if="focuserStore.focuserSettings.BoardTemperature !== undefined"
        :Name="$t('components.focuser.BoardTemperature')"
        :Value="focuserStore.focuserSettings.BoardTemperature?.toFixed(1) + ' °C'"
      />
      <StatusBool
        v-if="focuserStore.focuserSettings.DcPower !== undefined"
        :isEnabled="focuserStore.focuserSettings.DcPower"
        :enabledText="$t('components.focuser.DcPower')"
        :disabledText="$t('components.focuser.DcPower')"
      />
      <StatusString
        v-if="
          focuserStore.focuserSettings.StepSize !== undefined &&
          focuserStore.focuserSettings.StepSize !== -1
        "
        :isEnabled="true"
        :Name="$t('components.focuser.StepSize')"
        :Value="focuserStore.focuserSettings.StepSize.toFixed(4) + ' µm'"
      />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import StatusBool from '@/components/helpers/StatusBool.vue';
import StatusString from '@/components/helpers/StatusString.vue';
import { apiStore } from '@/store/store';
import { useFocuserStore } from '@/store/focuserStore';
const store = apiStore();
const focuserStore = useFocuserStore();

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
  return temp.toFixed(2) + ' °C'; // Formatierte Temperatur
});
</script>
