<template>
  <div
    class="monitor-main fixed inset-0 top-[82px] landscape:top-0 landscape:left-32 z-10 flex flex-col bg-gray-900 overflow-hidden"
  >
    <!-- Tab Bar -->
    <div
      class="flex items-stretch border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm overflow-x-auto shrink-0 scrollbar-hide"
    >
      <!-- Camera Tabs (draggable) -->
      <draggable
        v-model="draggableCameras"
        item-key="id"
        tag="div"
        class="flex items-stretch"
        ghost-class="opacity-30"
        :animation="150"
        handle=".drag-handle"
      >
        <template #item="{ element: camera }">
          <div class="flex items-stretch group shrink-0">
            <!-- Drag handle -->
            <span
              class="drag-handle flex items-center px-1 text-gray-700 hover:text-gray-400 cursor-grab active:cursor-grabbing"
            >
              <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="9" cy="5" r="1.5" />
                <circle cx="15" cy="5" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="19" r="1.5" />
                <circle cx="15" cy="19" r="1.5" />
              </svg>
            </span>

            <button
              @click="selectCamera(camera.id)"
              class="flex items-center px-3 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap gap-2"
              :class="
                selectedCameraId === camera.id
                  ? 'border-indigo-500 text-white bg-gray-800'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              "
            >
              <span class="w-2 h-2 rounded-full shrink-0" :class="getStatusClass(camera.id)"></span>
              {{ camera.name }}
            </button>

            <!-- Manual Refresh Button (only when autoRefresh is off) -->
            <button
              v-if="!store.getCameraById(camera.id)?.autoRefresh"
              @click.stop="store.refreshCamera(camera.id)"
              class="px-1.5 text-gray-600 hover:text-blue-400 transition-colors"
              :title="$t('plugins.multiImageMonitor.refreshNow')"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            <!-- Settings Icon inside tab -->
            <button
              @click.stop="openSettingsForCamera(camera.id)"
              class="px-1.5 text-gray-600 hover:text-gray-300 transition-colors"
              :class="
                selectedCameraId === camera.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              "
              :title="$t('plugins.multiImageMonitor.settings')"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            <div class="w-px bg-gray-700/50 self-stretch shrink-0"></div>
          </div>
        </template>
      </draggable>

      <!-- Add Camera Button -->
      <button
        @click="openAddModal"
        class="flex items-center px-4 py-3 text-sm text-gray-500 hover:text-indigo-400 transition-colors shrink-0 whitespace-nowrap gap-1.5"
        :title="$t('plugins.multiImageMonitor.addCameraTitle')"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        {{ $t('plugins.multiImageMonitor.addCamera') }}
      </button>
    </div>

    <!-- Image Area: full height including footer zone (gray bg blends), image inset via bottom padding -->
    <div class="flex-grow min-h-0 relative overflow-hidden">
      <MonitorSnapshot
        v-for="camera in store.cameras"
        :key="camera.id"
        :cameraId="camera.id"
        v-show="selectedCameraId === camera.id"
        class="!bottom-9"
      />

      <!-- Empty state -->
      <div
        v-if="store.cameras.length === 0"
        class="absolute inset-0 flex flex-col items-center justify-center text-center bg-gray-900 space-y-6 p-8"
      >
        <div class="p-8 bg-gray-800 rounded-full shadow-2xl">
          <svg
            class="h-16 w-16 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-white mb-2">
            {{ $t('plugins.multiImageMonitor.noCameras') }}
          </h2>
          <p class="text-gray-400 text-sm">{{ $t('plugins.multiImageMonitor.noCamerasHint') }}</p>
        </div>
      </div>
    </div>

    <!-- Unified Settings / Add Modal -->
    <MonitorSettingsModal
      :isOpen="isModalOpen"
      :cameraId="settingsCameraId"
      @close="closeModal"
      @remove="handleRemove"
      @created="handleCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import draggable from 'vuedraggable';
import { useImageMonitorStore } from '../store/imageMonitorStore';
import MonitorSnapshot from '../components/MonitorSnapshot.vue';
import MonitorSettingsModal from '../components/MonitorSettingsModal.vue';

const store = useImageMonitorStore();

const selectedCameraId = ref(null);
const isModalOpen = ref(false);
const settingsCameraId = ref(null);

const draggableCameras = computed({
  get: () => store.cameras,
  set: (newOrder) => store.reorderCameras(newOrder),
});

const getStatusClass = (id) => {
  const status = store.getCameraStatus(id);
  const camera = store.getCameraById(id);
  if (!camera?.autoRefresh) return 'bg-gray-600';
  if (status.isConnected) return 'bg-green-400 animate-pulse';
  return 'bg-orange-400 animate-pulse';
};

const selectCamera = (id) => {
  selectedCameraId.value = id;
};

const openAddModal = () => {
  settingsCameraId.value = null;
  isModalOpen.value = true;
};

const openSettingsForCamera = (id) => {
  settingsCameraId.value = id;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  settingsCameraId.value = null;
};

const handleRemove = (id) => {
  store.removeCamera(id);
  closeModal();
  if (selectedCameraId.value === id) {
    selectedCameraId.value = store.cameras.length > 0 ? store.cameras[0].id : null;
  }
};

const handleCreated = (id) => {
  selectCamera(id);
};

onMounted(() => {
  store.loadFromLocalStorage();
  // Preload all cameras that don't have autoRefresh (autoRefresh ones are started by loadFromLocalStorage)
  store.cameras.forEach((c) => {
    if (!c.autoRefresh) store.refreshCamera(c.id);
  });
  if (store.cameras.length > 0) {
    selectedCameraId.value = store.cameras[0].id;
  }
});
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
