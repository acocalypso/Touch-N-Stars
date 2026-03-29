<template>
  <div
    class="fixed inset-0 z-top flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300"
    @click.self="$emit('close')"
  >
    <div
      class="bg-gray-800/95 rounded-xl p-6 max-w-sm w-full mx-4 relative shadow-2xl transform transition-all duration-300 ease-out"
      :class="{ 'scale-95 opacity-0': !isMounted, 'scale-100 opacity-100': isMounted }"
      @click.stop
    >
      <!-- Header -->
      <div class="flex justify-between items-center mb-5 pb-4 border-b border-gray-700/50">
        <h2 class="text-lg font-bold text-gray-100">{{ $t('components.instanceSwitcher.title') }}</h2>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-gray-700/50 rounded-full transition-all duration-200"
          aria-label="Close"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Instance List -->
      <div class="space-y-2 max-h-72 overflow-y-auto">
        <div v-if="instances.length === 0" class="text-center py-6 text-gray-400 text-sm">
          {{ $t('components.instanceSwitcher.noInstances') }}
        </div>

        <button
          v-for="(instance, index) in instances"
          :key="instance.id"
          @click="selectInstance(instance.id)"
          class="w-full text-left p-3 rounded-lg border transition-all duration-150 flex items-center gap-3"
          :class="
            instance.id === selectedInstanceId
              ? 'border-cyan-500/50 bg-cyan-900/20 ring-1 ring-cyan-500'
              : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
          "
        >
          <!-- Color dot -->
          <span class="w-3 h-3 rounded-full flex-shrink-0" :class="getDotColor(settingsStore.getInstanceColorByIndex(index))" />

          <!-- Name + address -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ instance.name }}</p>
            <p class="text-xs text-gray-400 truncate">{{ instance.ip }}:{{ instance.port }}</p>
          </div>

          <!-- Active indicator -->
          <div v-if="instance.id === selectedInstanceId" class="flex items-center gap-1 flex-shrink-0">
            <span class="w-2 h-2 rounded-full bg-green-500" />
            <span class="text-xs text-green-400">{{ $t('components.instanceSwitcher.active') }}</span>
          </div>
        </button>
      </div>

      <!-- Footer -->
      <div class="mt-4 pt-4 border-t border-gray-700/50">
        <router-link
          to="/settings"
          @click="$emit('close')"
          class="flex items-center justify-center gap-2 w-full py-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {{ $t('components.instanceSwitcher.manageInstances') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSettingsStore } from '@/store/settingsStore';

const emit = defineEmits(['close']);

const settingsStore = useSettingsStore();
const isMounted = ref(false);

const instances = computed(() => settingsStore.connection.instances);
const selectedInstanceId = computed(() => settingsStore.selectedInstanceId);

function getDotColor(bgClass) {
  return bgClass.replace(/-\d{3}(\/\d+)?$/, '-400');
}

function selectInstance(id) {
  settingsStore.setSelectedInstanceId(id);
  emit('close');
}

onMounted(() => {
  isMounted.value = true;
});
</script>
