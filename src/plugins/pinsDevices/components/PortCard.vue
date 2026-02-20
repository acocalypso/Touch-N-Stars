<template>
  <div>
    <!-- Port Header with Editable Name -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex-1">
        <div v-if="!isEditingName" class="flex items-center gap-2">
          <h4 class="font-semibold text-white">{{ port.Name }}</h4>
          <button
            @click="startEditing()"
            class="p-1 text-gray-400 hover:text-cyan-400 transition-colors"
            :title="$t('common.edit')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              ></path>
            </svg>
          </button>
        </div>
        <div v-else class="flex items-center gap-2">
          <input
            v-model="editingName"
            @keyup.enter="saveName()"
            @keyup.escape="cancelEditing()"
            type="text"
            class="flex-1 px-2 py-1 bg-gray-700 border border-cyan-500/50 rounded text-white text-sm focus:outline-none focus:border-cyan-400"
            autofocus
          />
          <button
            @click="saveName()"
            :disabled="isSaving"
            class="p-1 text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
            :title="$t('common.confirm')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </button>
          <button
            @click="cancelEditing()"
            class="p-1 text-red-400 hover:text-red-300 transition-colors"
            :title="$t('common.cancel')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span
          class="inline-block w-2 h-2 rounded-full"
          :class="port.Enabled ? 'bg-green-500' : 'bg-gray-500'"
        ></span>
        <!-- Overcurrent Indicator -->
        <span
          v-if="port.Overcurrent"
          class="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 font-semibold"
        >
          {{ $t('plugins.pinsDevices.ports.overcurrent') }}
        </span>
      </div>
    </div>

    <!-- Port Info -->
    <div class="space-y-2 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-400">Status</span>
        <span :class="port.Enabled ? 'text-green-400' : 'text-gray-500'">
          {{ port.Enabled ? $t('common.enabled') : $t('common.disabled') }}
        </span>
      </div>

      <!-- Buck-specific info -->
      <template v-if="portType === 'buck'">
        <div
          v-if="port.Current !== 'NaN' && port.Current !== undefined"
          class="flex justify-between"
        >
          <span class="text-gray-400">Current</span>
          <span class="text-gray-200">{{ port.Current.toFixed(2) }}A</span>
        </div>

        <div
          v-if="port.Voltage !== 'NaN' && port.Voltage !== undefined"
          class="flex justify-between"
        >
          <span class="text-gray-400">Current Voltage</span>
          <span class="text-gray-200">{{ port.Voltage.toFixed(2) }}V</span>
        </div>
      </template>

      <!-- PWM-specific info -->
      <template v-if="portType === 'pwm'">
        <div
          v-if="port.Current !== 'NaN' && port.Current !== undefined"
          class="flex justify-between"
        >
          <span class="text-gray-400">Current</span>
          <span class="text-gray-200">{{ port.Current.toFixed(2) }}A</span>
        </div>

        <div v-if="port.Power !== 'NaN' && port.Power !== undefined" class="flex justify-between">
          <span class="text-gray-400">Current Power</span>
          <span class="text-gray-200"
            >{{ calculatePowerPercentage(port.Power, port.Resolution) }}%</span
          >
        </div>
      </template>
    </div>

    <!-- Controls -->
    <div class="mt-4 space-y-2">
      <!-- Buck Voltage Control -->
      <template v-if="portType === 'buck'">
        <div class="space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-400 text-xs">Output Voltage</span>
            <span
              :class="port.Enabled ? 'text-blue-400' : 'text-gray-500'"
              class="text-sm font-semibold"
            >
              {{ port.SetVoltage ? port.SetVoltage.toFixed(2) : '0.00' }}V
            </span>
          </div>
          <button
            @click="openVoltagePicker()"
            :disabled="!port.Enabled"
            class="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ port.SetVoltage ? port.SetVoltage.toFixed(2) : '0.00' }}V
          </button>
          <div class="flex justify-between text-xs text-gray-500">
            <span>{{ port.MinVoltage ? port.MinVoltage.toFixed(1) : '0' }}V</span>
            <span>{{ port.MaxVoltage ? port.MaxVoltage.toFixed(1) : '24' }}V</span>
          </div>
        </div>
      </template>

      <!-- PWM Power Control -->
      <template v-if="portType === 'pwm'">
        <div class="space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-400 text-xs">Power Level</span>
            <span
              :class="port.Enabled ? 'text-blue-400' : 'text-gray-500'"
              class="text-sm font-semibold"
            >
              {{ sliderDisplayWithPercentage() }}
            </span>
          </div>
          <input
            type="range"
            min="0"
            :max="port.Resolution"
            :value="sliderDisplayValue()"
            :disabled="!port.Enabled"
            @input="
              localSliderValue = $event.target.value;
              isDraggingSlider = true;
            "
            @change="handlePowerSliderChange($event, port.Resolution)"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div class="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>{{ port.Resolution }}</span>
          </div>
        </div>
      </template>

      <!-- Enable/Disable Toggle -->
      <button
        @click="$emit('toggle-enabled')"
        :disabled="isToggling"
        class="w-full py-2 px-3 rounded-lg text-sm font-semibold transition-all"
        :class="
          port.Enabled
            ? 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
            : 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
        "
      >
        {{
          isToggling
            ? $t('common.loading')
            : port.Enabled
              ? $t('common.disable')
              : $t('common.enable')
        }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useNumberPicker } from '@/composables/useNumberPicker.js';

const props = defineProps({
  port: {
    type: Object,
    required: true,
  },
  portType: {
    type: String,
    enum: ['buck', 'pwm'],
    required: true,
  },
});

const emit = defineEmits(['rename', 'toggle-enabled', 'set-voltage', 'set-power']);

const { openPicker } = useNumberPicker();

const isEditingName = ref(false);
const editingName = ref('');
const isSaving = ref(false);
const isToggling = ref(false);
const isDraggingSlider = ref(false);
const localSliderValue = ref(0);

// Clear dragging state when the actual power changes (API response)
watch(
  () => props.port?.SetPower,
  () => {
    isDraggingSlider.value = false;
  }
);

const sliderDisplayValue = () => {
  if (isDraggingSlider.value) {
    return localSliderValue.value;
  }
  return props.port.SetPower;
};

const sliderDisplayWithPercentage = () => {
  const value = sliderDisplayValue();
  const percentage = calculatePowerPercentage(value, props.port.Resolution);
  return `${value} (${percentage}%)`;
};

const startEditing = () => {
  isEditingName.value = true;
  editingName.value = props.port.Name;
};

const cancelEditing = () => {
  isEditingName.value = false;
  editingName.value = '';
};

const saveName = async () => {
  if (!editingName.value.trim()) {
    cancelEditing();
    return;
  }

  isSaving.value = true;
  emit('rename', editingName.value);
  isSaving.value = false;
  cancelEditing();
};

const calculatePowerPercentage = (power, resolution) => {
  if (!resolution || resolution === 0) return 0;
  return Math.round((power / resolution) * 100);
};

const openVoltagePicker = () => {
  const minVoltage = props.port?.MinVoltage || 0;
  const maxVoltage = props.port?.MaxVoltage || 24;
  const currentVoltage = props.port?.SetVoltage || 12;

  openPicker(
    'common.voltage',
    minVoltage,
    maxVoltage,
    0.1,
    currentVoltage,
    (newValue) => handleVoltageChange(newValue),
    1
  );
};

const handleVoltageChange = async (voltage) => {
  const numValue = parseFloat(voltage);
  if (isNaN(numValue)) return;
  emit('set-voltage', numValue);
};

const handlePowerSliderChange = async (event, resolution) => {
  const absoluteValue = parseInt(event.target.value, 10);
  if (isNaN(absoluteValue) || !resolution) return;

  emit('set-power', absoluteValue);
};
</script>
