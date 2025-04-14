<template>
  <div>
    <!-- Modal Overlay -->
    <div
      v-if="filterStore.filterChange"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    >
      <div
        class="bg-gray-800 text-white p-4 rounded-lg min-w-[400px] max-w-4xl max-h-[80vh] min-h-48 overflow-y-auto flex flex-col justify-between"
      >
        <div>
          <h2 class="text-xl font-bold mb-4">
            {{ $t('components.filterwheel.manual_filter.title') }}
          </h2>
          <p>{{ $t('components.filterwheel.manual_filter.name') }} {{ filterStore.filterName }}</p>
        </div>
        <div class="flex justify-center mt-auto">
          <button
            @click="confirmFilterChange"
            class="bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600 transition duration-200"
          >
            {{ $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import wsFilter from '@/services/websocketManuellFilterControl';
import { useFilterStore } from '@/store/filterStore';

const filterStore = useFilterStore();

function confirmFilterChange() {
  wsFilter.sendMessage('filter-changed');
  console.log('Filter gewechselt:', filterStore.filterName);
}

onMounted(() => {
  wsFilter.setStatusCallback((status) => {
    console.log('Status aktualisiert:', status);
    if (status === 'connected') {
      filterStore.wsIsConnected = true;
      wsFilter.sendMessage('get-target-filter');
      console.log('WebSocket Filter verbunden!');
    }
  });
  wsFilter.connect();
});

onBeforeUnmount(() => {
  wsFilter.setStatusCallback(null);
  wsFilter.setMessageCallback(null);
  filterStore.wsIsConnected = false;

  if (wsFilter.socket) {
    wsFilter.socket.close();
  }
});
</script>
