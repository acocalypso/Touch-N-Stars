<template>
  <div class="sequence-container mb-6">
    <!-- Container Header -->
    <div :class="['container-header p-4 rounded-t-lg border-l-4', getContainerClasses(color)]">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-2xl">{{ icon }}</span>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ title }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ description }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span
            v-if="actions.length > 0"
            class="px-2 py-1 text-xs bg-white/20 text-white rounded-full"
          >
            {{ actions.length }} action{{ actions.length !== 1 ? 's' : '' }}
          </span>
          <button
            @click="showAddMenu = !showAddMenu"
            class="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            :title="t('plugins.sequenceCreator.containers.addAction')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Container Body -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-b-lg">
      <!-- Empty State -->
      <div v-if="actions.length === 0" class="p-8 text-center">
        <div class="text-4xl mb-3">{{ getEmptyIcon(containerType) }}</div>
        <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ getEmptyTitle(containerType) }}
        </h4>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ getEmptyDescription(containerType) }}
        </p>
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
      </div>
    </div>

    <!-- Add Action Menu -->
    <div
      v-if="showAddMenu"
      class="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
    >
      <div class="p-2">
        <div
          v-for="action in getAvailableActions(containerType)"
          :key="action.id"
          @click="handleAddAction(action)"
          class="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
        >
          <span class="text-lg">{{ action.icon }}</span>
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
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSequenceStore } from '../stores/sequenceStore.js';
import SequenceActionItem from './SequenceActionItem.vue';

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
    start: '🚀',
    target: '🎯',
    end: '🏁',
  };
  return icons[containerType] || '📝';
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
  if (!event.target.closest('.sequence-container')) {
    showAddMenu.value = false;
  }
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
