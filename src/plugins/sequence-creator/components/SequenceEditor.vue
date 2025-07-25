<template>
  <div class="sequence-editor h-full flex flex-col lg:flex-row gap-4 p-4">
    <!-- Action Library Sidebar -->
    <div class="lg:w-1/3 xl:w-1/4 min-w-0">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Action Library</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Drag actions to create your sequence
          </p>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <div v-for="(actions, category) in store.actionsByCategory" :key="category" class="mb-6">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {{ category }}
            </h3>
            <div class="space-y-2">
              <div
                v-for="action in actions"
                :key="action.id"
                :class="[
                  'action-item p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200',
                  'hover:shadow-md transform hover:scale-105',
                  action.color,
                  'text-white',
                ]"
                draggable="true"
                @dragstart="onDragStart(action, $event)"
                @dragend="onDragEnd"
              >
                <div class="flex items-center space-x-3">
                  <span class="text-lg">{{ action.icon }}</span>
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-medium">{{ action.name }}</div>
                    <div class="text-xs opacity-90 truncate">
                      {{ action.description }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Workspace -->
    <div class="flex-1 min-w-0">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
        <!-- Toolbar -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div class="flex items-center space-x-3">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Sequence Builder</h2>
              <span
                v-if="store.sequence.length > 0"
                class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
              >
                {{ store.sequence.length }} action{{ store.sequence.length !== 1 ? 's' : '' }}
              </span>
            </div>

            <div class="flex items-center space-x-2">
              <!-- Undo/Redo -->
              <button
                :disabled="!store.canUndo"
                @click="store.undo"
                class="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Undo"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
              </button>

              <button
                :disabled="!store.canRedo"
                @click="store.redo"
                class="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Redo"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
                  />
                </svg>
              </button>

              <div class="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

              <!-- Clear -->
              <button
                @click="store.clearSequence"
                class="p-2 rounded-lg transition-colors hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                title="Clear sequence"
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

              <!-- Save -->
              <button
                :disabled="!store.sequenceIsValid"
                @click="saveSequence"
                class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Save JSON
              </button>
            </div>
          </div>
        </div>

        <!-- Sequence Area -->
        <div class="flex-1 overflow-y-auto p-4">
          <div
            shallowRef="sequenceArea"
            class="min-h-full sequence-drop-zone"
            @drop="onDrop"
            @dragover="onDragOver"
            @dragenter="onDragEnter"
            @dragleave="onDragLeave"
          >
            <div v-if="store.sequence.length === 0" class="h-full flex items-center justify-center">
              <div class="text-center">
                <div class="text-6xl mb-4">🚀</div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Start Building Your Sequence
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  Drag actions from the library to create your custom astrophotography sequence
                </p>
              </div>
            </div>

            <!-- Draggable sequence actions list -->
            <draggable
              v-if="store.sequence.length > 0"
              :list="store.sequence"
              group="sequence-reorder"
              class="space-y-3"
              item-key="id"
              :animation="200"
              ghost-class="ghost"
              @start="onSortStart"
              @end="onSortEnd"
            >
              <template #item="{ element: action, index }">
                <SequenceAction
                  :key="action.id"
                  :action="action"
                  :index="index"
                  :is-selected="store.selectedAction?.id === action.id"
                  @select="store.selectAction"
                  @remove="store.removeAction"
                  @duplicate="store.duplicateAction"
                  @toggle-enabled="store.toggleActionEnabled"
                  @update-parameter="store.updateActionParameter"
                />
              </template>
            </draggable>
          </div>
        </div>
      </div>
    </div>

    <!-- Properties Panel (Mobile: Modal, Desktop: Sidebar) -->
    <div v-if="store.selectedAction" class="lg:w-1/3 xl:w-1/4 min-w-0">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full">
        <ActionProperties
          :action="store.selectedAction"
          @update-parameter="store.updateActionParameter"
          @close="store.selectedAction = null"
        />
      </div>
    </div>

    <!-- JSON Preview Modal -->
    <JsonPreviewModal
      v-if="showJsonModal"
      :json="store.sequenceJSON"
      @close="showJsonModal = false"
      @save="downloadJson"
    />
  </div>
</template>

<script setup>
import { shallowRef } from 'vue';
import draggable from 'vuedraggable';
import { useSequenceStore } from '../stores/sequenceStore';
import SequenceAction from './SequenceAction.vue';
import ActionProperties from './ActionProperties.vue';
import JsonPreviewModal from './JsonPreviewModal.vue';

// Store
const store = useSequenceStore();

// Don't destructure reactive state - use store directly for reactivity
// Access reactive properties directly from store: store.sequence, store.selectedAction, etc.

// Local state
// const sequenceArea = shallowRef(null);
const showJsonModal = shallowRef(false);
const dragOverCounter = shallowRef(0);

// Drag and Drop for adding new actions
function onDragStart(action, event) {
  store.setDraggedAction(action);
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData('application/json', JSON.stringify(action));
}

function onDragEnd() {
  store.setDraggedAction(null);
}

function onDragEnter(event) {
  event.preventDefault();
  dragOverCounter.value++;
}

function onDragLeave(event) {
  event.preventDefault();
  dragOverCounter.value--;
}

function onDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
}

function onDrop(event) {
  event.preventDefault();
  dragOverCounter.value = 0;

  // Check if this is a valid drop from the action library
  const data = event.dataTransfer.getData('application/json');
  if (!data || data.trim() === '') {
    // This might be a drag from the vuedraggable component, ignore it
    return;
  }

  try {
    const actionData = JSON.parse(data);
    if (actionData && actionData.id && actionData.name) {
      store.addAction(actionData);
    }
  } catch (error) {
    console.error('Failed to parse dropped action:', error);
  }
}

// Sequence sorting
function onSortStart() {
  // Optional: Add visual feedback
}

function onSortEnd() {
  // Optional: Add completion feedback
}

// Save functionality
function saveSequence() {
  showJsonModal.value = true;
}

function downloadJson(filename = 'sequence.json') {
  const blob = new Blob([store.sequenceJSON], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showJsonModal.value = false;
}
</script>

<style scoped>
.sequence-editor {
  height: calc(100vh - 120px);
}

.action-item {
  transition: all 0.2s ease;
}

.action-item:hover {
  transform: translateY(-1px);
}

.sequence-drop-zone {
  position: relative;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

@media (max-width: 1024px) {
  .sequence-editor {
    height: auto;
    min-height: calc(100vh - 120px);
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .action-item {
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .ghost {
    background: #374151;
  }
}
</style>
