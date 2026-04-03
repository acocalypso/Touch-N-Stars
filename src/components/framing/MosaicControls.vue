<template>
  <div
    class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-4 space-y-3"
  >
    <!-- Header with toggle -->
    <div class="flex items-center justify-between">
      <span class="text-sm font-semibold text-gray-200">{{
        $t('components.framing.mosaic.title')
      }}</span>
      <toggleButton
        :status-value="framingStore.isMosaicMode"
        @update:statusValue="framingStore.isMosaicMode = $event"
      />
    </div>

    <!-- Settings — only when active -->
    <div v-if="framingStore.isMosaicMode" class="space-y-3 pt-2 border-t border-gray-700/50">
      <NumberInputPicker
        v-model="framingStore.mosaicCols"
        :label="$t('components.framing.mosaic.columns')"
        labelKey="components.framing.mosaic.columns"
        :min="1"
        :max="5"
        :step="1"
      />
      <NumberInputPicker
        v-model="framingStore.mosaicRows"
        :label="$t('components.framing.mosaic.rows')"
        labelKey="components.framing.mosaic.rows"
        :min="1"
        :max="5"
        :step="1"
      />
      <NumberInputPicker
        v-model="framingStore.mosaicOverlap"
        :label="$t('components.framing.mosaic.overlap')"
        labelKey="components.framing.mosaic.overlap"
        :min="0"
        :max="50"
        :step="5"
      />
      <!-- Preserve Alignment toggle
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1">
          <span class="text-xs text-gray-300">{{
            $t('components.framing.mosaic.preserveAlignment')
          }}</span>
          <infoModal
            :title="$t('components.framing.mosaic.preserveAlignmentHelp')"
            :message="$t('components.framing.mosaic.preserveAlignmentHelpText')"
            size="w-4 h-4"
          />
        </div>
        <toggleButton
          :status-value="framingStore.mosaicPreserveAlignment"
          @update:statusValue="framingStore.mosaicPreserveAlignment = $event"
        />
      </div> -->
      <!-- Summary -->
      <div class="text-xs text-gray-400 text-center pt-1">
        {{ framingStore.mosaicCols }} × {{ framingStore.mosaicRows }} =
        {{ framingStore.mosaicCols * framingStore.mosaicRows }}
        {{ $t('components.framing.mosaic.panels') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFramingStore } from '@/store/framingStore';
import toggleButton from '@/components/helpers/toggleButton.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import infoModal from '@/components/helpers/infoModal.vue';

const framingStore = useFramingStore();
</script>
