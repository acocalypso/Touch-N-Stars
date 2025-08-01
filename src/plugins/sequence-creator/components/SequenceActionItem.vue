<template>
  <div
    :class="[
      'sequence-action-item border rounded-lg mb-3 transition-all duration-200',
      action.enabled ? 'bg-white dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800 opacity-60',
      'border-gray-200 dark:border-gray-600',
      isEditing
        ? 'border-blue-500 dark:border-blue-400'
        : 'hover:border-gray-300 dark:hover:border-gray-500',
    ]"
  >
    <!-- Main Action Header -->
    <div class="p-4">
      <div class="flex items-center justify-between">
        <!-- Action Info -->
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <div
            :class="[
              'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white',
              action.color,
            ]"
          >
            <component :is="getIconComponent(action.icon)" class="w-5 h-5" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ action.name }}
              </h4>
              <span
                v-if="!action.enabled"
                class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded"
              >
                {{ t('plugins.sequenceCreator.actions.disabled') }}
              </span>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
              {{ action.description }}
            </p>

            <!-- Parameter Summary (when not editing) -->
            <div v-if="hasParameters && !isEditing" class="mt-2">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(param, key) in getKeyParameters(action.parameters)"
                  :key="key"
                  class="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                >
                  {{ param.label || key }}: {{ formatParameterValue(param) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Controls -->
        <div class="flex items-center gap-1 flex-shrink-0 ml-3">
          <!-- Edit Toggle Button -->
          <button
            v-if="hasParameters"
            @click="toggleEdit"
            :class="[
              'p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors',
              isEditing
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400',
            ]"
            :title="
              isEditing
                ? t('plugins.sequenceCreator.actions.closeEditor')
                : t('plugins.sequenceCreator.actions.editParameters')
            "
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                v-if="!isEditing"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <!-- Move Up -->
          <button
            v-if="index > 0"
            @click="$emit('move-up', index)"
            class="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
            :title="t('plugins.sequenceCreator.actions.moveUp')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>

          <!-- Move Down -->
          <button
            v-if="canMoveDown"
            @click="$emit('move-down', index)"
            class="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
            :title="t('plugins.sequenceCreator.actions.moveDown')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <!-- Enable/Disable -->
          <button
            @click="handleToggleEnabled"
            :class="[
              'p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors',
              action.enabled
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-400 dark:text-gray-500',
            ]"
            :title="
              action.enabled
                ? t('plugins.sequenceCreator.actions.disableAction')
                : t('plugins.sequenceCreator.actions.enableAction')
            "
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
                v-if="action.enabled"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
                v-else
              />
            </svg>
          </button>

          <!-- Duplicate -->
          <button
            @click="handleDuplicate"
            class="p-2 text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
            :title="t('plugins.sequenceCreator.actions.duplicateAction')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>

          <!-- Remove -->
          <button
            @click="handleRemove"
            class="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
            :title="t('plugins.sequenceCreator.actions.removeAction')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Expandable Parameter Editor -->
    <div
      v-if="isEditing && hasParameters"
      class="border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
    >
      <div class="p-4 space-y-4">
        <div class="flex items-center justify-between mb-4">
          <h5 class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ t('plugins.sequenceCreator.actions.actionParameters') }}
          </h5>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('plugins.sequenceCreator.actions.changesSaveAutomatically') }}
          </div>
        </div>

        <!-- Special handling for target-settings action -->
        <div v-if="action.type === 'target-settings'" class="mb-6">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('plugins.sequenceCreator.targetSearch.searchLabel') }}
            </label>
            <TargetSearch @target-selected="handleTargetSelected" />
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ $t('plugins.sequenceCreator.targetSearch.searchDescription') }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="(param, key) in action.parameters" :key="key" class="space-y-2">
            <label
              :for="`param-${action.id}-${key}`"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {{ param.label || key }}
              <span v-if="param.tooltip" class="text-gray-500 dark:text-gray-400 text-xs ml-1">
                ({{ param.tooltip }})
              </span>
            </label>

            <!-- Text Input -->
            <input
              v-if="param.type === 'text'"
              :id="`param-${action.id}-${key}`"
              v-model="param.value"
              @input="updateParameter(key, $event.target.value)"
              type="text"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />

            <!-- Number Input -->
            <input
              v-else-if="param.type === 'number'"
              :id="`param-${action.id}-${key}`"
              v-model.number="param.value"
              @input="updateParameter(key, Number($event.target.value))"
              type="number"
              :min="param.min"
              :max="param.max"
              :step="param.step || 1"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />

            <!-- Select Input -->
            <select
              v-else-if="param.type === 'select'"
              :id="`param-${action.id}-${key}`"
              v-model="param.value"
              @change="updateParameter(key, $event.target.value)"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              <!-- Dynamic filter options if this is a filter parameter -->
              <template v-if="key === 'filter' && api.filterInfo?.AvailableFilters">
                <option value="None">None</option>
                <option
                  v-for="filter in api.filterInfo.AvailableFilters"
                  :key="filter.Name"
                  :value="filter.Name"
                >
                  {{ filter.Name }}
                </option>
              </template>
              <!-- Default static options for non-filter parameters -->
              <template v-else>
                <option v-for="option in param.options" :key="option" :value="option">
                  {{ option }}
                </option>
              </template>
            </select>

            <!-- Boolean Input -->
            <div v-else-if="param.type === 'boolean'" class="flex items-center">
              <input
                :id="`param-${action.id}-${key}`"
                v-model="param.value"
                @change="updateParameter(key, $event.target.checked)"
                type="checkbox"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                :for="`param-${action.id}-${key}`"
                class="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                {{
                  param.value
                    ? t('plugins.sequenceCreator.actions.enabled')
                    : t('plugins.sequenceCreator.actions.disabled')
                }}
              </label>
            </div>

            <!-- Show current value info for number inputs -->
            <div
              v-if="param.type === 'number' && (param.min !== undefined || param.max !== undefined)"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              <span v-if="param.min !== undefined">
                {{ t('plugins.sequenceCreator.actions.min') }} {{ param.min }}
              </span>
              <span v-if="param.min !== undefined && param.max !== undefined"> • </span>
              <span v-if="param.max !== undefined">
                {{ t('plugins.sequenceCreator.actions.max') }} {{ param.max }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSequenceStore } from '../stores/sequenceStore';
import { apiStore } from '@/store/store';
import TargetSearch from './TargetSearch.vue';
import {
  LinkIcon,
  CameraIcon,
  EyeIcon,
  PlayIcon,
  StopIcon,
  FireIcon,
  HomeIcon,
  CursorArrowRaysIcon,
  MagnifyingGlassIcon,
} from '@heroicons/vue/24/outline';
import TelescopeIcon from './TelescopeIcon.vue';
import GuiderIcon from './GuiderIcon.vue';
import SnowflakeIcon from './SnowflakeIcon.vue';

const { t } = useI18n();
const store = useSequenceStore();
const api = apiStore();

const props = defineProps({
  action: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  containerType: {
    type: String,
    required: true,
  },
  totalActions: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['edit', 'remove', 'duplicate', 'move-up', 'move-down', 'toggle-enabled']);

const isEditing = ref(false);

const hasParameters = computed(() => {
  return Object.keys(props.action.parameters || {}).length > 0;
});

const canMoveDown = computed(() => {
  return props.totalActions > 0 && props.index < props.totalActions - 1;
});

function toggleEdit() {
  isEditing.value = !isEditing.value;
}

function updateParameter(key, value) {
  store.updateActionParameter(props.action.id, key, value);
}

function getKeyParameters(parameters) {
  // Show ALL parameters that have values
  const allParams = {};

  for (const key of Object.keys(parameters)) {
    if (parameters[key] && parameters[key].value !== undefined && parameters[key].value !== '') {
      allParams[key] = parameters[key];
    }
  }

  return allParams;
}

function formatParameterValue(param) {
  if (param.type === 'boolean') {
    return param.value
      ? t('plugins.sequenceCreator.actions.yes')
      : t('plugins.sequenceCreator.actions.no');
  }
  if (param.type === 'number') {
    return param.value?.toString() || '0';
  }
  if (param.type === 'select') {
    return param.value || t('plugins.sequenceCreator.actions.notSet');
  }
  return param.value || t('plugins.sequenceCreator.actions.notSet');
}

function handleRemove() {
  if (
    confirm(
      t('plugins.sequenceCreator.confirmations.removeAction', { actionName: props.action.name })
    )
  ) {
    emit('remove', props.action.id);
  }
}

function handleDuplicate() {
  emit('duplicate', props.action.id);
}

function handleToggleEnabled() {
  emit('toggle-enabled', props.action.id);
}

function handleTargetSelected(targetData) {
  console.log('Target selected:', targetData);

  // Update target settings parameters with the selected target data
  if (targetData.name) {
    updateParameter('targetName', targetData.name);
  }
  if (targetData.ra) {
    updateParameter('ra', targetData.ra);
  }
  if (targetData.dec) {
    updateParameter('dec', targetData.dec);
  }
  if (targetData.positionAngle !== undefined) {
    updateParameter('positionAngle', targetData.positionAngle);
  }
}

function getIconComponent(iconName) {
  const iconMap = {
    LinkIcon: LinkIcon,
    CameraIcon: CameraIcon,
    EyeIcon: EyeIcon,
    telescope: TelescopeIcon,
    guider: GuiderIcon,
    snowflake: SnowflakeIcon,
    play: PlayIcon,
    stop: StopIcon,
    fire: FireIcon,
    home: HomeIcon,
    'cursor-arrow-rays': CursorArrowRaysIcon,
    crosshairs: CursorArrowRaysIcon, // Using same icon for crosshairs
    'magnifying-glass': MagnifyingGlassIcon,
  };

  return iconMap[iconName] || LinkIcon; // Default fallback
}
</script>

<style scoped>
.sequence-action-item {
  transition: all 0.2s ease;
}

.sequence-action-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
