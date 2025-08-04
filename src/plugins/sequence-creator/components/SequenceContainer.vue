<template>
  <div ref="containerRef" class="sequence-container mb-6">
    <!-- Container Header -->
    <div :class="['container-header p-4 rounded-t-lg border-l-4', getContainerClasses(color)]">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <component :is="getIconComponent(icon)" :name="icon" class="w-6 h-6" />
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ title }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ description }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2"></div>
      </div>
    </div>

    <!-- Container Body -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-b-lg">
      <!-- Empty State -->
      <div v-if="actions.length === 0" class="p-8 text-center">
        <div class="mb-3 flex justify-center">
          <component
            :is="getIconComponent(getEmptyIcon(containerType))"
            :name="getEmptyIcon(containerType)"
            class="w-12 h-12 text-gray-400"
          />
        </div>
        <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ getEmptyTitle(containerType) }}
        </h4>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ getEmptyDescription(containerType) }}
        </p>
        <button
          @click="toggleAddMenu"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          :title="t('plugins.sequenceCreator.containers.addAction')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          {{ t('plugins.sequenceCreator.containers.addAction') }}
        </button>
      </div>

      <!-- Actions List -->
      <div v-else class="p-4">
        <SequenceActionItem
          v-for="(action, index) in actions"
          :key="action.id"
          :action="action"
          :index="index"
          :container-type="containerType"
          @remove="handleRemoveAction"
          @duplicate="handleDuplicateAction"
          @edit="handleEditAction"
          @move-up="handleMoveUp"
          @move-down="handleMoveDown"
        />

        <!-- Add Action Button -->
        <div class="mt-4 text-center">
          <button
            @click="toggleAddMenu"
            class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
            :title="t('plugins.sequenceCreator.containers.addAction')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            {{ t('plugins.sequenceCreator.containers.addAction') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Action Menu -->
    <div
      v-if="showAddMenu"
      ref="dropdownMenu"
      :class="[
        'absolute w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 right-0',
        dropdownPosition.vertical === 'top' ? 'bottom-0 mb-2' : 'top-full mt-2',
      ]"
    >
      <div class="p-2">
        <div
          v-for="action in getAvailableActions(containerType)"
          :key="action.id"
          @click="handleAddAction(action)"
          class="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
        >
          <component
            :is="getIconComponent(action.icon)"
            :name="action.icon"
            class="w-5 h-5 text-gray-600 dark:text-gray-400"
          />
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              {{ action.name }}
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400">
              {{ action.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSequenceStore } from '../stores/sequenceStore.js';
import SequenceActionItem from './SequenceActionItem.vue';
import {
  RocketLaunchIcon,
  FlagIcon,
  CursorArrowRaysIcon,
  DocumentIcon,
  LinkIcon,
  CameraIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline';
import SequenceIcons from './SequenceIcons.vue';

const { t } = useI18n();

const props = defineProps({
  title: String,
  description: String,
  actions: Array,
  containerType: String,
  icon: String,
  color: String,
});

const emit = defineEmits(['add-action', 'remove-action', 'duplicate-action', 'move-action']);

const store = useSequenceStore();
const showAddMenu = ref(false);
const dropdownMenu = ref(null);
const containerRef = ref(null);
const dropdownPosition = reactive({
  vertical: 'bottom',
});

// Initialize localized templates when component is mounted
onMounted(() => {
  store.initializeLocalizedTemplates(t);
});

function getContainerClasses(color) {
  const classes = {
    blue: 'bg-blue-600 border-blue-600',
    green: 'bg-green-600 border-green-600',
    red: 'bg-red-600 border-red-600',
  };
  return classes[color] || 'bg-gray-600 border-gray-600';
}

function getEmptyIcon(containerType) {
  const icons = {
    start: 'rocket',
    target: 'crosshairs',
    end: 'flag',
  };
  return icons[containerType] || 'document';
}

function getIconComponent(iconName) {
  // For sequence-specific icons, use SequenceIcons component
  const sequenceIcons = [
    'telescope',
    'guider',
    'snowflake',
    'play',
    'camera',
    'stop',
    'fire',
    'home',
    'cursor-arrow-rays',
    'crosshairs',
    'magnifying-glass',
    'rocket',
    'flag',
  ];

  if (sequenceIcons.includes(iconName)) {
    return SequenceIcons;
  }

  // For other heroicons, keep using the imported components
  const iconMap = {
    rocket: RocketLaunchIcon,
    flag: FlagIcon,
    crosshairs: CursorArrowRaysIcon,
    document: DocumentIcon,
    LinkIcon: LinkIcon,
    CameraIcon: CameraIcon,
    EyeIcon: EyeIcon,
  };

  return iconMap[iconName] || DocumentIcon; // Default fallback
}

function getEmptyTitle(containerType) {
  const titles = {
    start: t('plugins.sequenceCreator.containers.startSequence.emptyTitle'),
    target: t('plugins.sequenceCreator.containers.targetSequence.emptyTitle'),
    end: t('plugins.sequenceCreator.containers.endSequence.emptyTitle'),
  };
  return titles[containerType] || t('plugins.sequenceCreator.containers.noActions');
}

function getEmptyDescription(containerType) {
  const descriptions = {
    start: t('plugins.sequenceCreator.containers.startSequence.emptyDescription'),
    target: t('plugins.sequenceCreator.containers.targetSequence.emptyDescription'),
    end: t('plugins.sequenceCreator.containers.endSequence.emptyDescription'),
  };
  return (
    descriptions[containerType] || t('plugins.sequenceCreator.containers.addActionsToContainer')
  );
}

function getAvailableActions(containerType) {
  return store.actionTemplates[containerType] || [];
}

async function calculateDropdownPosition() {
  await nextTick();

  if (!dropdownMenu.value) return;

  const container = dropdownMenu.value.closest('.sequence-container');
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const viewportHeight = window.innerHeight;

  // Calculate vertical position - only flip if there's really not enough space
  const spaceBelow = viewportHeight - containerRect.bottom;
  const spaceAbove = containerRect.top;

  // Only show above if there's less than 200px below AND more than 350px above
  if (spaceBelow < 200 && spaceAbove > 350) {
    dropdownPosition.vertical = 'top';
  } else {
    dropdownPosition.vertical = 'bottom';
  }
}

async function toggleAddMenu() {
  showAddMenu.value = !showAddMenu.value;
  if (showAddMenu.value) {
    await calculateDropdownPosition();
  }
}

function handleAddAction(action) {
  emit('add-action', action, props.containerType);
  showAddMenu.value = false;
}

function handleRemoveAction(actionId) {
  emit('remove-action', actionId, props.containerType);
}

function handleDuplicateAction(actionId) {
  emit('duplicate-action', actionId, props.containerType);
}

function handleEditAction(action) {
  store.selectAction(action);
}

function handleMoveUp(index) {
  if (index > 0) {
    emit('move-action', index, index - 1, props.containerType);
  }
}

function handleMoveDown(index) {
  if (index < props.actions.length - 1) {
    emit('move-action', index, index + 1, props.containerType);
  }
}

function handleClickOutside(event) {
  if (!showAddMenu.value) return;

  // Check if click is inside the dropdown menu
  if (dropdownMenu.value && dropdownMenu.value.contains(event.target)) {
    return;
  }

  // Check if click is inside our container (including buttons)
  if (containerRef.value && containerRef.value.contains(event.target)) {
    // If it's inside the container but not in the dropdown, check if it's a button click
    const clickedButton = event.target.closest('button');
    if (clickedButton) {
      // Let button clicks be handled by their own handlers
      return;
    }
  }

  // Close menu for clicks outside the container or non-button clicks inside
  showAddMenu.value = false;
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.sequence-container {
  position: relative;
}

.container-header {
  background: linear-gradient(135deg, var(--bg-color), var(--bg-color-dark));
}
</style>
