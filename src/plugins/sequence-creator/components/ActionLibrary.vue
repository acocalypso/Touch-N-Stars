<template>
  <div class="action-library h-full flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ t('plugins.sequenceCreator.actionLibrary.title') }}
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {{ t('plugins.sequenceCreator.actionLibrary.description') }}
      </p>
    </div>

    <!-- Action Categories -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Start Actions -->
      <div>
        <h3
          class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"
        >
          {{ t('plugins.sequenceCreator.actionLibrary.startActions') }}
        </h3>
        <div class="space-y-2">
          <ActionLibraryItem
            v-for="action in store.actionTemplates.start"
            :key="action.id"
            :action="action"
            container-type="start"
            @add-action="handleAddAction"
          />
        </div>
      </div>

      <!-- Target Actions -->
      <div>
        <h3
          class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"
        >
          {{ t('plugins.sequenceCreator.actionLibrary.targetActions') }}
        </h3>
        <div class="space-y-2">
          <ActionLibraryItem
            v-for="action in store.actionTemplates.target"
            :key="action.id"
            :action="action"
            container-type="target"
            @add-action="handleAddAction"
          />
        </div>
      </div>

      <!-- End Actions -->
      <div>
        <h3
          class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"
        >
          {{ t('plugins.sequenceCreator.actionLibrary.endActions') }}
        </h3>
        <div class="space-y-2">
          <ActionLibraryItem
            v-for="action in store.actionTemplates.end"
            :key="action.id"
            :action="action"
            container-type="end"
            @add-action="handleAddAction"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useSequenceStore } from '../stores/sequenceStore';
import ActionLibraryItem from './ActionLibraryItem.vue';

const { t } = useI18n();
const store = useSequenceStore();

const emit = defineEmits(['add-action']);

function handleAddAction(action, containerType, index = null) {
  emit('add-action', action, containerType, index);
}
</script>
