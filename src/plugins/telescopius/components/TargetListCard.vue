<template>
  <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
    <div class="flex items-center justify-between mb-3">
      <div class="flex-1 min-w-0">
        <div class="text-white font-medium truncate">
          {{ list.name || $t('plugins.telescopius.targetLists.unnamedList') }}
        </div>
        <p class="text-gray-400 text-sm mt-1">
          <span v-if="list.username">{{ list.username }} • ID: {{ list.id }}</span>
          <span v-else>
            {{ $t('plugins.telescopius.import.targetsFound', { count: objectCount }) }}
            <span v-if="list.importedAt"> • {{ formatDate(list.importedAt) }}</span>
          </span>
        </p>
      </div>

      <div class="flex items-center gap-1">
        <button
          v-if="removable"
          @click="$emit('remove')"
          class="text-gray-400 hover:text-red-400 p-1 rounded transition-colors min-h-touch"
          :title="$t('plugins.telescopius.import.remove')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            ></path>
          </svg>
        </button>

        <button
          @click="$emit('toggle')"
          :class="expanded ? 'text-yellow-400' : 'text-blue-400'"
          class="hover:text-blue-300 p-1 rounded transition-colors min-h-touch"
          :title="
            expanded
              ? $t('plugins.telescopius.targetLists.hideObjects')
              : $t('plugins.telescopius.targetLists.showObjects')
          "
        >
          <svg
            v-if="expanded"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 15l7-7 7 7"
            ></path>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Objects List -->
    <div v-if="expanded && list.objects" class="mt-4 space-y-3">
      <div
        v-for="(obj, index) in list.objects"
        :key="index"
        class="bg-gray-900/30 rounded-lg p-3 border border-gray-700 hover:border-gray-500 cursor-pointer transition-colors"
        @click="$emit('select', obj)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="text-white font-medium text-sm">{{ obj.name }}</div>
            <div v-if="obj.familiarName" class="text-gray-400 text-xs">
              {{ obj.familiarName }}
            </div>
            <div class="text-gray-400 text-xs mt-1 space-y-1">
              <div v-if="obj.type || obj.constellation" class="text-gray-500">
                {{ [obj.type, obj.constellation].filter(Boolean).join(' • ') }}
              </div>
              <div>{{ $t('plugins.telescopius.targetLists.ra') }}: {{ formatRA(obj) }}</div>
              <div>{{ $t('plugins.telescopius.targetLists.dec') }}: {{ formatDec(obj) }}</div>
              <div v-if="Number.isFinite(obj.magnitude)">
                {{ $t('plugins.telescopius.targetLists.magnitude') }}:
                {{ obj.magnitude.toFixed(2) }}
              </div>
              <div v-if="obj.size_deg">
                {{ $t('plugins.telescopius.targetLists.size') }}: {{ obj.size_deg.toFixed(2) }}°
              </div>
              <div v-if="obj.notes" class="text-gray-500">{{ obj.notes }}</div>
            </div>
          </div>

          <!-- Click indicator -->
          <div class="flex items-center justify-center text-gray-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { degreesToHMS, degreesToDMS } from '@/utils/utils';

const { t: $t } = useI18n();

const props = defineProps({
  list: {
    type: Object,
    required: true,
  },
  expanded: {
    type: Boolean,
    default: false,
  },
  removable: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['toggle', 'select', 'remove']);

const objectCount = computed(() => props.list.objects?.length || 0);

// Telescopius returns RA in hours - both for API and CSV imported targets.
const formatRA = (obj) => degreesToHMS(obj.coordinates.ra * 15);
const formatDec = (obj) => degreesToDMS(obj.coordinates.dec);

const formatDate = (timestamp) => new Date(timestamp).toLocaleString();
</script>
