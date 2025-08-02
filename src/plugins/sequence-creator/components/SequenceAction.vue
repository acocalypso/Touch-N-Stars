<template>
  <div
    :class="[
      'sequence-action p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer',
      action.enabled
        ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 opacity-75',
      isSelected
        ? 'ring-2 ring-blue-500 border-blue-300'
        : 'hover:border-gray-300 dark:hover:border-gray-600',
    ]"
    @click="$emit('select', action)"
  >
    <div class="flex items-center justify-between">
      <!-- Action Info -->
      <div class="flex items-center space-x-3 flex-1 min-w-0">
        <!-- Icon and Status -->
        <div class="flex items-center space-x-2">
          <div
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm',
              action.color,
            ]"
          >
            {{ action.icon }}
          </div>
          <div
            v-if="!action.enabled"
            class="w-2 h-2 bg-red-500 rounded-full"
            :title="t('plugins.sequenceCreator.actions.disabled')"
          ></div>
        </div>

        <!-- Details -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ action.name }}
            </h3>
            <span
              class="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
            >
              {{ action.category }}
            </span>
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
            {{ getParameterSummary() }}
          </div>
        </div>

        <!-- Index Badge -->
        <div class="flex-shrink-0">
          <span
            class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
          >
            #{{ index + 1 }}
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-1 ml-3">

        <!-- Duplicate -->
        <button
          @click.stop="$emit('duplicate', action.id)"
          class="p-2 sm:p-1.5 rounded text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900 transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
          title="Duplicate action"
        >
          <svg class="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>

        <!-- Remove -->
        <button
          @click.stop="$emit('remove', action.id)"
          class="p-2 sm:p-1.5 rounded text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900 transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
          title="Remove action"
        >
          <svg class="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Expanded Parameters (when selected) -->
    <div
      v-if="isSelected && hasParameters"
      class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
    >
      <h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">
        {{ t('plugins.sequenceCreator.actions.parameters') }}
      </h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div v-for="(param, key) in action.parameters" :key="key" class="space-y-1">
          <label class="text-xs text-gray-600 dark:text-gray-400 block">
            {{ formatParameterName(key) }}
          </label>

          <!-- Text Input -->
          <input
            v-if="param.type === 'text'"
            :value="param.value"
            @input="updateParameter(key, $event.target.value)"
            type="text"
            class="w-full px-3 py-2 sm:px-2 sm:py-1 text-sm sm:text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] sm:min-h-0"
          />

          <!-- Number Input -->
          <input
            v-else-if="param.type === 'number'"
            :value="param.value"
            @input="updateParameter(key, parseFloat($event.target.value) || 0)"
            type="number"
            :min="param.min"
            :max="param.max"
            :step="param.step || 1"
            class="w-full px-3 py-2 sm:px-2 sm:py-1 text-sm sm:text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] sm:min-h-0"
          />

          <!-- Select Input -->
          <select
            v-else-if="param.type === 'select'"
            :value="param.value"
            @change="updateParameter(key, $event.target.value)"
            class="w-full px-3 py-2 sm:px-2 sm:py-1 text-sm sm:text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] sm:min-h-0"
          >
            <option v-for="option in param.options" :key="option" :value="option">
              {{ option }}
            </option>
          </select>

          <!-- Boolean Input -->
          <label
            v-else-if="param.type === 'boolean'"
            class="flex items-center space-x-3 cursor-pointer py-2"
          >
            <input
              :checked="param.value"
              @change="updateParameter(key, $event.target.checked)"
              type="checkbox"
              class="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
            />
            <span class="text-sm sm:text-xs text-gray-600 dark:text-gray-400">{{
              param.label || 'Enabled'
            }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
import { computed } from 'vue';

// Props
const props = defineProps({
  action: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['select', 'remove', 'duplicate', 'update-parameter']);

// Computed
const hasParameters = computed(() => {
  return Object.keys(props.action.parameters || {}).length > 0;
});

// Methods
function getParameterSummary() {
  const params = props.action.parameters || {};
  const paramKeys = Object.keys(params);

  if (paramKeys.length === 0) {
    return props.action.description;
  }

  const summary = paramKeys
    .slice(0, 2) // Show only first 2 parameters in summary
    .map((key) => {
      const param = params[key];
      const value = param.value !== undefined ? param.value : param.default;
      return `${formatParameterName(key)}: ${value}`;
    })
    .join(', ');

  return paramKeys.length > 2 ? `${summary}...` : summary;
}

function formatParameterName(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function updateParameter(key, value) {
  emit('update-parameter', props.action.id, key, value);
}

// Remove the old getCurrentInstance function since we don't need it
</script>

<style scoped>
.sequence-action {
  transition: all 0.2s ease;
}

.sequence-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.dark .sequence-action:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}
</style>
