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
            <!-- NEU: Wenn es sich um "Gain" handelt, ein Input-Feld -->
            <template v-else-if="key === 'Gain' && sequenceStore.sequenceEdit">
              <input
                class="w-full bg-gray-700 border-gray-600 rounded p-1 text-gray-200"
                type="number"
                v-model="item[key]"
                @input="handleInput($event, item, key)"
                @change="updateValue(item._path, item[key], 'Gain')"
              />
            </template>
            <template v-else-if="key === 'ExposureTime' && sequenceStore.sequenceEdit">
              <input
                class="w-full bg-gray-700 border-gray-600 rounded p-1 text-gray-200"
                type="number"
                v-model="item[key]"
                @input="handleInput($event, item, key)"
                @change="updateValue(item._path, item[key], 'ExposureTime')"
              />
            </template>
            <template v-else-if="key === 'Offset' && sequenceStore.sequenceEdit">
              <input
                class="w-full bg-gray-700 border-gray-600 rounded p-1 text-gray-200"
                type="number"
                v-model="item[key]"
                @input="handleInput($event, item, key)"
                @change="updateValue(item._path, item[key], 'Offset')"
              />
            </template>
            <template v-else-if="key === 'ExposureCount' && sequenceStore.sequenceEdit">
              <input
                class="w-full bg-gray-700 border-gray-600 rounded p-1 text-gray-200"
                type="number"
                v-model="item[key]"
                @input="handleInput($event, item, key)"
                @change="updateValue(item._path, item[key], 'ExposureCount')"
              />
            </template>

            <template v-else-if="key === 'Binning'">
              {{ value.Name }}
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
                  <template v-else-if="key === 'AfterExposures' && sequenceStore.sequenceEdit">
                    <input
                      class="w-full bg-gray-500 border-gray-400 rounded p-1 min-w-16 text-gray-200"
                      type="number"
                      v-model="trigger[key]"
                      @input="handleInput($event, trigger, key)"
                      @change="updateValue(trigger._path, trigger[key], 'AfterExposures')"
                    />
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

<script setup>
import { defineProps } from 'vue';
import apiService from '@/services/apiService';
import { useSequenceStore } from '@/store/sequenceStore';

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

const excludedKeys = new Set([
  'Name',
  'Status',
  'Conditions',
  'Triggers',
  'Items',
  '_path',
  'Target',
  'Issues',
]);
const sequenceStore = useSequenceStore();

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

// Standardwerte initialisieren, falls ein Feld gelöscht wird
const handleInput = (event, item, key) => {
  let value = event.target.value.trim();
  //console.log('value' , value);
  // Falls der Benutzer das Feld leert, auf 0 setzen
  if (value === '') {
    item[key] = 0;
  } else {
    item[key] = Number(value);
  }
};

async function updateValue(path, newValue, typ) {
  console.log(path, typ, newValue);
  const action = `edit?path=${encodeURIComponent(path + '-' + typ)}&value=${encodeURIComponent(newValue)}`;
  try {
    const data = await apiService.sequenceAction(action);
    sequenceStore.getSequenceInfo();
    console.log('Antwort:', data);
  } catch (error) {
    console.log('Fehler:', error);
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
