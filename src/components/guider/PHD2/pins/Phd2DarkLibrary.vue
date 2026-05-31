<template>
  <div v-if="store.isPINS" class="flex flex-col w-full gap-2">
    <div class="flex flex-row items-center justify-between gap-2">
      <span class="text-sm text-gray-300">
        {{ $t('components.guider.phd2.darkLibrary.title') }}
      </span>
      <button
        type="button"
        class="default-button-cyan px-3 py-1 text-xs"
        :disabled="guiderStore.isDarkLibraryBuildActive"
        @click="showAssistant = true"
      >
        {{ $t('components.guider.phd2.darkLibrary.manage') }}
      </button>
    </div>

    <div class="flex flex-wrap gap-1 text-xs">
      <span
        v-if="info?.Exists"
        class="px-2 py-0.5 rounded bg-green-500/20 text-green-300 border border-green-500/30"
      >
        {{ info.NumDarks }} {{ $t('components.guider.phd2.darkLibrary.numDarks') }}
      </span>
      <span
        v-else
        class="px-2 py-0.5 rounded bg-gray-700/50 text-gray-300 border border-gray-600/30"
      >
        {{ $t('components.guider.phd2.darkLibrary.noLibrary') }}
      </span>
      <span
        v-if="info?.Exists"
        :class="
          info.Loaded
            ? 'bg-green-500/20 text-green-300 border-green-500/30'
            : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
        "
        class="px-2 py-0.5 rounded border"
      >
        {{
          info.Loaded
            ? $t('components.guider.phd2.darkLibrary.loaded')
            : $t('components.guider.phd2.darkLibrary.notLoaded')
        }}
      </span>
      <span
        v-if="info?.Exists"
        class="px-2 py-0.5 rounded bg-gray-700/50 text-gray-200 border border-gray-600/30"
      >
        {{ (info.MinExposureSec / 1000).toFixed(1) }}–{{ (info.MaxExposureSec / 1000).toFixed(1) }}
        s
      </span>
    </div>

    <DarkLibraryAssistantModal :show="showAssistant" @close="showAssistant = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useGuiderStore } from '@/store/guiderStore';
import { apiStore } from '@/store/store';
import DarkLibraryAssistantModal from '@/components/guider/PHD2/DarkLibraryAssistantModal.vue';

const store = apiStore();
const guiderStore = useGuiderStore();

const showAssistant = ref(false);
const info = computed(() => guiderStore.phd2DarkLibraryInfo);

onMounted(async () => {
  await guiderStore.fetchPHD2DarkLibraryInfo();
  const status = await guiderStore.fetchPHD2DarkLibraryBuildStatus();
  if (status?.Active) {
    guiderStore.startDarkLibraryBuildPolling();
  }
});
</script>
