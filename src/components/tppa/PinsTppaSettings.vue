<template>
  <div class="flex flex-col gap-2 w-full">
    <!-- Movement Section -->
    <div class="border border-gray-500 p-2 rounded-lg">
      <h4 class="text-gray-200 text-sm font-semibold mb-2">
        {{ $t('components.tppa.pins_settings.movement') }}
      </h4>
      <div class="space-y-2">
        <NumberInputPicker
          v-model="options.DefaultMoveRate"
          :label="$t('components.tppa.pins_settings.default_move_rate')"
          labelKey="components.tppa.pins_settings.default_move_rate"
          :min="0.1"
          :max="100"
          :step="0.1"
          :decimalPlaces="1"
          inputId="pins-default-move-rate"
          @change="updateOption('DefaultMoveRate', options.DefaultMoveRate)"
        />

        <div class="flex flex-row items-center justify-between w-full">
          <label class="text-gray-300 text-sm">
            {{ $t('components.tppa.pins_settings.default_east_direction') }}
          </label>
          <toggleButton
            :status-value="options.DefaultEastDirection"
            @click="toggleDefaultEastDirection"
            class="pr-3 pl-3"
          />
        </div>

        <NumberInputPicker
          v-model="options.MoveTimeoutFactor"
          :label="$t('components.tppa.pins_settings.move_timeout_factor')"
          labelKey="components.tppa.pins_settings.move_timeout_factor"
          :min="0.1"
          :max="100"
          :step="0.1"
          :decimalPlaces="1"
          inputId="pins-move-timeout-factor"
          @change="updateOption('MoveTimeoutFactor', options.MoveTimeoutFactor)"
        />

        <NumberInputPicker
          v-model="options.DefaultTargetDistance"
          :label="$t('components.tppa.pins_settings.default_target_distance')"
          labelKey="components.tppa.pins_settings.default_target_distance"
          :min="0.1"
          :max="360"
          :step="0.1"
          :decimalPlaces="1"
          inputId="pins-default-target-distance"
          @change="updateOption('DefaultTargetDistance', options.DefaultTargetDistance)"
        />

        <NumberInputPicker
          v-model="options.DefaultSearchRadius"
          :label="$t('components.tppa.pins_settings.default_search_radius')"
          labelKey="components.tppa.pins_settings.default_search_radius"
          :min="0.1"
          :max="360"
          :step="0.1"
          :decimalPlaces="1"
          inputId="pins-default-search-radius"
          @change="updateOption('DefaultSearchRadius', options.DefaultSearchRadius)"
        />
      </div>
    </div>

    <!-- Offsets Section -->
    <div class="border border-gray-500 p-2 rounded-lg">
      <h4 class="text-gray-200 text-sm font-semibold mb-2">
        {{ $t('components.tppa.pins_settings.offsets') }}
      </h4>
      <div class="space-y-2">
        <NumberInputPicker
          v-model="options.DefaultAzimuthOffset"
          :label="$t('components.tppa.pins_settings.default_azimuth_offset')"
          labelKey="components.tppa.pins_settings.default_azimuth_offset"
          :min="-360"
          :max="360"
          :step="0.1"
          :decimalPlaces="1"
          inputId="pins-default-azimuth-offset"
          @change="updateOption('DefaultAzimuthOffset', options.DefaultAzimuthOffset)"
        />

        <NumberInputPicker
          v-model="options.DefaultAltitudeOffset"
          :label="$t('components.tppa.pins_settings.default_altitude_offset')"
          labelKey="components.tppa.pins_settings.default_altitude_offset"
          :min="-360"
          :max="360"
          :step="0.1"
          :decimalPlaces="1"
          inputId="pins-default-altitude-offset"
          @change="updateOption('DefaultAltitudeOffset', options.DefaultAltitudeOffset)"
        />

        <NumberInputPicker
          v-model="options.AlignmentTolerance"
          :label="$t('components.tppa.pins_settings.alignment_tolerance')"
          labelKey="components.tppa.pins_settings.alignment_tolerance"
          :min="0"
          :max="360"
          :step="0.1"
          :decimalPlaces="1"
          inputId="pins-alignment-tolerance"
          @change="updateOption('AlignmentTolerance', options.AlignmentTolerance)"
        />
      </div>
    </div>

    <!-- Behavior Section -->
    <div class="border border-gray-500 p-2 rounded-lg">
      <h4 class="text-gray-200 text-sm font-semibold mb-2">
        {{ $t('components.tppa.pins_settings.behavior') }}
      </h4>
      <div class="space-y-2">
        <div class="flex flex-row items-center justify-between w-full">
          <label class="text-gray-300 text-sm">
            {{ $t('components.tppa.pins_settings.refraction_adjustment') }}
          </label>
          <toggleButton
            :status-value="options.RefractionAdjustment"
            @click="toggleRefractionAdjustment"
            class="pr-3 pl-3"
          />
        </div>

        <div class="flex flex-row items-center justify-between w-full">
          <label class="text-gray-300 text-sm">
            {{ $t('components.tppa.pins_settings.stop_tracking_when_done') }}
          </label>
          <toggleButton
            :status-value="options.StopTrackingWhenDone"
            @click="toggleStopTrackingWhenDone"
            class="pr-3 pl-3"
          />
        </div>

        <NumberInputPicker
          v-model="options.AutomatedAdjustmentSettleTime"
          :label="$t('components.tppa.pins_settings.settle_time')"
          labelKey="components.tppa.pins_settings.settle_time"
          :min="0"
          :max="300"
          :step="0.1"
          :decimalPlaces="1"
          inputId="pins-settle-time"
          @change="updateOption('AutomatedAdjustmentSettleTime', options.AutomatedAdjustmentSettleTime)"
        />

        <div class="flex flex-row items-center justify-between w-full">
          <label class="text-gray-300 text-sm">
            {{ $t('components.tppa.pins_settings.auto_pause') }}
          </label>
          <toggleButton
            :status-value="options.AutoPause"
            @click="toggleAutoPause"
            class="pr-3 pl-3"
          />
        </div>

        <div class="flex flex-row items-center justify-between w-full">
          <label class="text-gray-300 text-sm">
            {{ $t('components.tppa.pins_settings.log_error') }}
          </label>
          <toggleButton
            :status-value="options.LogError"
            @click="toggleLogError"
            class="pr-3 pl-3"
          />
        </div>

        <button
          @click="reset"
          class="default-button-gray w-full text-xs mt-2"
        >
          {{ $t('components.tppa.pins_settings.reset') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiService from '@/services/apiService';
import toggleButton from '../helpers/toggleButton.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const options = ref({
  DefaultMoveRate: 3,
  DefaultEastDirection: true,
  MoveTimeoutFactor: 2,
  DefaultTargetDistance: 10,
  DefaultSearchRadius: 10,
  DefaultAzimuthOffset: 1,
  DefaultAltitudeOffset: 2,
  AlignmentTolerance: 0,
  RefractionAdjustment: false,
  StopTrackingWhenDone: true,
  AutomatedAdjustmentSettleTime: 2,
  AutoPause: false,
  LogError: false,
});

onMounted(async () => {
  try {
    const data = await apiService.getTppaOptions();
    if (data?.Success && data.Options) {
      for (const [key, entry] of Object.entries(data.Options)) {
        options.value[key] = entry.Value;
      }
    }
  } catch (error) {
    console.error('Error loading TPPA options:', error);
  }
});

async function updateOption(key, value) {
  try {
    await apiService.postTppaOptions({ [key]: value });
  } catch (error) {
    console.error(`Error updating option ${key}:`, error);
  }
}

function toggleDefaultEastDirection() {
  options.value.DefaultEastDirection = !options.value.DefaultEastDirection;
  updateOption('DefaultEastDirection', options.value.DefaultEastDirection);
}

function toggleRefractionAdjustment() {
  options.value.RefractionAdjustment = !options.value.RefractionAdjustment;
  updateOption('RefractionAdjustment', options.value.RefractionAdjustment);
}

function toggleStopTrackingWhenDone() {
  options.value.StopTrackingWhenDone = !options.value.StopTrackingWhenDone;
  updateOption('StopTrackingWhenDone', options.value.StopTrackingWhenDone);
}

function toggleAutoPause() {
  options.value.AutoPause = !options.value.AutoPause;
  updateOption('AutoPause', options.value.AutoPause);
}

function toggleLogError() {
  options.value.LogError = !options.value.LogError;
  updateOption('LogError', options.value.LogError);
}

async function reset() {
  try {
    await apiService.postTppaReset();
    const data = await apiService.getTppaOptions();
    if (data?.Success && data.Options) {
      for (const [key, entry] of Object.entries(data.Options)) {
        options.value[key] = entry.Value;
      }
    }
  } catch (error) {
    console.error('Error resetting TPPA options:', error);
  }
}
</script>
