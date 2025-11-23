<template>
  <div class="space-y-2">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="bg-gray-900/80 backdrop-blur-sm rounded-lg transition-all duration-200 hover:bg-gray-900/90 border border-gray-800/50"
      :class="{
        'bg-blue-950/50 ring-1 ring-cyan-400/60 border-cyan-500/30':
          item.Status === 'RUNNING' && !hasRunningChildren(item),
        'hover:bg-gray-900/90 border-gray-700/50':
          item.Status !== 'RUNNING' || hasRunningChildren(item),
      }"
    >
      <!-- Header Section -->
      <div class="flex items-center justify-between p-2 sm:p-3 border-b border-slate-700/30">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></div>
          <h3 class="font-medium text-slate-100 text-sm md:text-base truncate">
            {{ removeSuffix(item.Name) }}
          </h3>
        </div>
        <span
          v-if="isTopLevel"
          :class="statusColor(item.Status)"
          class="px-2 py-1 rounded-full text-sm font-medium flex-shrink-0"
        >
          {{ item.Status }}
        </span>
      </div>

      <!-- Dynamic Details Grid -->
      <div class="p-2 sm:p-3 pt-0">
        <div v-if="getDisplayFields(item).length" class="mb-3">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              v-for="[key, value] in getDisplayFields(item)"
              :key="key"
              class="flex flex-col sm:flex-row gap-6 p-3 bg-gray-800/30 rounded text-sm border border-gray-700/20"
            >
              <span class="text-gray-400 font-medium w-28 flex-shrink-0"
                >{{ formatKey(key) }}:</span
              >
              <span class="text-gray-200 break-all min-w-0">
                <template v-if="key === 'CalculatedWaitDuration'">
                  {{ formatDuration(value) }}
                </template>
                <template v-else-if="key === 'TargetTime'">
                  {{ formatDateTime(value) }}
                </template>
                <template v-else-if="key === 'TimeToFlip'">
                  {{ formatTimeSpan(value) }}
                </template>
                <template v-else-if="key === 'Coordinates'">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-blue-300 text-sm font-medium">RA:</span>
                      <code class="text-slate-200 bg-slate-800/50 px-1 py-0.5 rounded text-sm">{{
                        formatRA(value)
                      }}</code>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-blue-300 text-sm font-medium">Dec:</span>
                      <code class="text-slate-200 bg-slate-800/50 px-1 py-0.5 rounded text-sm">{{
                        formatDec(value)
                      }}</code>
                    </div>
                  </div>
                </template>
                <template v-else-if="typeof value === 'object'">
                  <div class="grid grid-cols-1 gap-1">
                    <template v-for="[subKey, subValue] in Object.entries(value)" :key="subKey">
                      <template v-if="subKey === 'Coordinates'">
                        <div class="font-medium text-blue-300">RA:</div>
                        <div>{{ formatRA(subValue) }}</div>
                        <div class="font-medium text-blue-300">Dec:</div>
                        <div>{{ formatDec(subValue) }}</div>
                      </template>
                      <template v-else>
                        <div>
                          <span class="text-gray-400">{{ subKey }}:</span>
                          <span class="ml-1">{{ formatValue(subValue, subKey) }}</span>
                        </div>
                      </template>
                    </template>
                  </div>
                </template>
                <template v-else>
                  {{ formatValue(value, key) }}
                </template>
              </span>
            </div>
          </div>
        </div>

        <!-- Nested Items -->
        <div
          v-if="item.Items?.length"
          class="mt-3 bg-cyan-900/20 rounded-lg border border-cyan-500/30 p-2"
        >
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 bg-cyan-400 rounded-full shadow-cyan-400/50 shadow-sm"></div>
              <h4 class="text-sm font-semibold text-cyan-200">
                {{ $t('components.sequence.instructions') }}
              </h4>
            </div>
            <button
              @click="sequenceStore.toggleCollapsedState(`${item._path || 'items'}-items`)"
              class="flex-shrink-0 p-1 rounded-md hover:bg-slate-700/50 transition-colors"
              :title="
                sequenceStore.isCollapsed(`${item._path || 'items'}-items`)
                  ? 'Erweitern'
                  : 'Zusammenklappen'
              "
            >
              <ChevronRightIcon
                class="w-4 h-4 text-gray-400 transition-transform duration-200"
                :class="{
                  'rotate-90': !sequenceStore.isCollapsed(`${item._path || 'items'}-items`),
                }"
              />
            </button>
          </div>
          <div
            v-show="!sequenceStore.isCollapsed(`${item._path || 'items'}-items`)"
            class="space-y-2"
          >
            <RecursiveItemState
              v-if="sequenceStore.sequenceIsEditable"
              :items="item.Items"
              :isTopLevel="false"
            />
            <RecursiveItemJson
              v-if="!sequenceStore.sequenceIsEditable"
              :items="item.Items"
              :isTopLevel="false"
            />
          </div>
        </div>

        <!-- Triggers Section -->
        <div
          v-if="item.Triggers?.length"
          class="mb-3 bg-emerald-900/20 rounded-lg border border-emerald-500/30 p-2"
        >
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-3">
              <div
                class="w-2 h-2 bg-emerald-400 rounded-full shadow-emerald-400/50 shadow-sm"
              ></div>
              <h4 class="text-sm font-semibold text-emerald-200">
                {{ $t('components.sequence.triggers') }}
              </h4>
            </div>
            <button
              @click="sequenceStore.toggleCollapsedState(`${item._path || 'triggers'}-triggers`)"
              class="flex-shrink-0 p-1 rounded-md hover:bg-slate-700/50 transition-colors"
              :title="
                sequenceStore.isCollapsed(`${item._path || 'triggers'}-triggers`)
                  ? 'Erweitern'
                  : 'Zusammenklappen'
              "
            >
              <ChevronRightIcon
                class="w-4 h-4 text-gray-400 transition-transform duration-200"
                :class="{
                  'rotate-90': !sequenceStore.isCollapsed(`${item._path || 'triggers'}-triggers`),
                }"
              />
            </button>
          </div>
          <div
            v-show="!sequenceStore.isCollapsed(`${item._path || 'triggers'}-triggers`)"
            class="space-y-1"
          >
            <div
              v-for="(trigger, tIndex) in item.Triggers"
              :key="tIndex"
              class="bg-slate-700/10 rounded-md p-2 hover:bg-slate-700/20 transition-colors"
            >
              <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span class="text-sm font-medium text-gray-200 break-all">
                  {{ removeSuffix(trigger.Name) }}
                </span>
                <span :class="statusColor(trigger.Status)" class="text-sm md:text-sm">
                  {{ trigger.Status }}
                </span>
              </div>
              <div class="grid grid-cols-1 gap-2 text-sm">
                <div
                  v-for="[key, value] in getDisplayFields(trigger)"
                  :key="key"
                  class="flex flex-col md:flex-row gap-6"
                >
                  <span class="text-gray-400 shrink-0">{{ key }}:</span>
                  <span class="text-gray-200 break-all">
                    <template v-if="key === 'TargetTime'">
                      {{ formatDateTime(value) }}
                    </template>
                    <template v-else-if="key === 'TimeToFlip'">
                      {{ formatTimeSpan(value) }}
                    </template>
                    <template v-else-if="key === 'Coordinates'">
                      <div>
                        <div class="font-medium text-blue-300">RA:</div>
                        <div>{{ formatRA(value) }}</div>
                        <div class="font-medium text-blue-300">Dec:</div>
                        <div>{{ formatDec(value) }}</div>
                      </div>
                    </template>
                    <template v-else>
                      {{ formatValue(value, key) }}
                    </template>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSequenceStore } from '@/store/sequenceStore';
import { apiStore } from '@/store/store';
import { ChevronRightIcon } from '@heroicons/vue/24/outline';
import RecursiveItemState from '@/components/sequence/RecursiveItemState.vue';
import RecursiveItemJson from '@/components/sequence/RecursiveItemJson.vue';

defineProps({
  items: {
    type: Array,
    required: true,
  },
  isTopLevel: {
    type: Boolean,
    default: false,
  },
});

const sequenceStore = useSequenceStore();
const store = apiStore();
const excludedKeys = new Set([
  'Name',
  'Status',
  'Conditions',
  'Triggers',
  'Items',
  '_path',
  'Issues',
]);

// Helper functions
function formatKey(key) {
  // Convert CamelCase to readable text
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim(); // Remove leading/trailing spaces
}

function formatValue(value, key) {
  if (value === -1) {
    if (key === 'Gain') {
      return store.profileInfo?.CameraSettings?.Gain ?? 'default';
    } else if (key === 'Offset') {
      return store.profileInfo?.CameraSettings?.Offset ?? 'default';
    } else {
      return 'default';
    }
  }
  return value;
}

function statusColor(status) {
  switch (status) {
    case 'FINISHED':
      return 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 shadow-emerald-400/20 shadow-sm';
    case 'RUNNING':
      return 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-cyan-400/20 shadow-sm';
    case 'CREATED':
      return 'bg-amber-500/30 text-amber-200 border border-amber-400/50 shadow-amber-400/20 shadow-sm';
    case 'SKIPPED':
      return 'bg-gray-500/30 text-gray-300 border border-gray-400/50';
    default:
      return 'bg-gray-600/30 text-gray-300 border border-gray-500/50';
  }
}

function removeSuffix(name) {
  if (typeof name !== 'string') return '';
  return name.replace(/_Trigger$|_Container$/, '');
}

function formatDuration(durationString) {
  const [h, m, s] = durationString.split('.')[0].split(':');
  return `${h}h ${m}m ${s}s`;
}

function formatTimeSpan(timeSpan) {
  if (timeSpan === 24) {
    return '24h 00m 00s';
  }

  // Calculate duration in milliseconds
  const durationMs = timeSpan * 60 * 60 * 1000;

  // Get the hours, minutes, and seconds
  const hours = Math.floor(durationMs / (60 * 60 * 1000));
  const minutes = Math.floor((durationMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((durationMs % (60 * 1000)) / 1000);

  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}

function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatRA(coords) {
  if (!coords) return 'undefined';
  const target = coords.Coordinates || coords;
  if (
    !target ||
    (target.RAHours === undefined &&
      target.RAMinutes === undefined &&
      target.RASeconds === undefined)
  ) {
    return 'undefined';
  }
  return (
    target.RAString || `${target.RAHours ?? 0}h ${target.RAMinutes ?? 0}m ${target.RASeconds ?? 0}s`
  );
}

function formatDec(coords) {
  if (!coords) return 'undefined';
  const target = coords.Coordinates || coords;
  if (
    !target ||
    (target.DecDegrees === undefined &&
      target.DecMinutes === undefined &&
      target.DecSeconds === undefined)
  ) {
    return 'undefined';
  }
  const sign = target.NegativeDec ? 'S' : 'N';
  return (
    target.DecString ||
    `${target.DecDegrees ?? 0}° ${target.DecMinutes ?? 0}' ${target.DecSeconds ?? 0}" ${sign}`
  );
}

function getDisplayFields(item) {
  return Object.entries(item).filter(
    ([key]) =>
      !excludedKeys.has(key) && item[key] !== undefined && item[key] !== null && item[key] !== ''
  );
}

function hasRunningChildren(item) {
  return item.Items?.some((child) => child.Status === 'RUNNING' || hasRunningChildren(child));
}
</script>
