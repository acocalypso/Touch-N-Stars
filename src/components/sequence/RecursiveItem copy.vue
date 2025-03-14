<script setup>
import { defineProps } from 'vue';

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

const excludedKeys = new Set(['Name', 'Status', 'Conditions', 'Triggers', 'Items']);

function statusColor(status) {
  switch (status) {
    case 'FINISHED':
      return 'text-green-600';
    case 'RUNNING':
      return 'text-blue-600';
    case 'CREATED':
      return 'text-yellow-500';
    case 'SKIPPED':
      return 'text-gray-400';
    default:
      return 'text-gray-200';
  }
}

function removeSuffix(name) {
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
  const target = coords.Coordinates || coords;
  return (
    target.RAString || `${target.RAHours ?? 0}h ${target.RAMinutes ?? 0}m ${target.RASeconds ?? 0}s`
  );
}

function formatDec(coords) {
  const target = coords.Coordinates || coords;
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

<template>
  <div class="space-y-3">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="bg-gray-800 rounded-lg p-3 md:p-4 shadow-lg border-2 transition-all"
      :class="{
        'border-blue-500': item.Status === 'RUNNING' && !hasRunningChildren(item),
        'border-gray-700 hover:border-gray-500':
          item.Status !== 'RUNNING' || hasRunningChildren(item),
      }"
    >
      <!-- Header Section -->
      <div
        class="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-600"
      >
        <h3 class="font-semibold text-gray-200 text-sm md:text-base break-all">
          {{ removeSuffix(item.Name) }}
        </h3>
        <span
          v-if="isTopLevel"
          :class="statusColor(item.Status)"
          class="font-medium text-xs md:text-sm shrink-0"
        >
          {{ item.Status }}
        </span>
      </div>

      <!-- Dynamic Details Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-4">
        <div
          v-for="[key, value] in getDisplayFields(item)"
          :key="key"
          class="flex flex-col md:flex-row gap-1 md:gap-2"
        >
          <span class="text-gray-400 shrink-0">{{ key }}:</span>
          <span class="text-gray-200 break-all">
            <template v-if="key === 'CalculatedWaitDuration'">
              {{ formatDuration(value) }}
            </template>
            <template v-else-if="key === 'TargetTime'">
              {{ formatDateTime(value) }}
            </template>
            <template v-else-if="key === 'Coordinates'">
              <div class="grid grid-cols-1 gap-1">
                <div class="font-medium text-blue-300">RA:</div>
                <div>{{ formatRA(value) }}</div>
                <div class="font-medium text-blue-300">Dec:</div>
                <div>{{ formatDec(value) }}</div>
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
                      <span class="ml-1">{{ subValue }}</span>
                    </div>
                  </template>
                </template>
              </div>
            </template>
            <template v-else>
              {{ value }}
            </template>
          </span>
        </div>
      </div>

      <!-- Nested Items -->
      <div v-if="item.Items?.length" class="ml-2 md:ml-4 space-y-3">
        <RecursiveItem :items="item.Items" :isTopLevel="false" />
      </div>

      <!-- Triggers Section -->
      <div v-if="item.Triggers?.length" class="mt-4">
        <h4 class="text-sm font-semibold text-gray-300 mb-2">
          {{ $t('components.sequence.triggers') }}
        </h4>
        <div class="space-y-2">
          <div
            v-for="(trigger, tIndex) in item.Triggers"
            :key="tIndex"
            class="bg-gray-700 rounded p-2 md:p-3 border border-gray-600"
          >
            <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span class="text-sm font-medium text-gray-200 break-all">
                {{ removeSuffix(trigger.Name) }}
              </span>
              <span :class="statusColor(trigger.Status)" class="text-xs md:text-sm">
                {{ trigger.Status }}
              </span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs md:text-sm">
              <div
                v-for="[key, value] in getDisplayFields(trigger)"
                :key="key"
                class="flex flex-col md:flex-row gap-1"
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
                    {{ value }}
                  </template>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
