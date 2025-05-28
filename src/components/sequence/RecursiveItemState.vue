<template>
  <div class="space-y-3">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="bg-gray-800 rounded-lg p-2 md:p-3 shadow-lg border-2 transition-all"
      :class="{
        'border-blue-500/50': isRunningOrHasRunningChildren(item),
        'border-gray-700 hover:border-gray-500': !isRunningOrHasRunningChildren(item),
      }"
    >
      <!-- Collapse Button -->
      <div class="flex justify-between items-center">
        <h3 class="font-semibold text-gray-200 text-sm md:text-base break-all">
          {{ removeSuffix(item.Name) }}
        </h3>
        <button
          @click="sequenceStore.toggleCollapsedState(item._path)"
          class="text-gray-400 hover:text-gray-200"
        >
          <span v-if="sequenceStore.isCollapsed(item._path)">
            <PlusIcon class="text-cyan-300 w-5 h-5" />
          </span>
          <span v-else><MinusIcon class="text-cyan-300 w-5 h-5" /></span>
        </button>
      </div>

      <div v-show="!sequenceStore.isCollapsed(item._path)">
        <!-- Header Section -->
        <div
          class="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-600"
        >
          <span
            v-if="isTopLevel || item.Status === 'DISABLED'"
            :class="statusColor(item.Status)"
            class="font-medium text-xs md:text-sm shrink-0"
          >
            {{ item.Status }}
          </span>
          <button
            v-if="sequenceStore.sequenceEdit && containerIndex === 1 && !readOnly"
            @click="toggleDisable(item._path, item.Status, 'Status')"
          >
            <PowerIcon
              class="w-5 h-5"
              :class="item.Status === 'DISABLED' ? 'text-red-500' : 'text-green-500'"
            />
          </button>
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
                <span
                  v-if="trigger.Status != 'CREATED'"
                  :class="statusColor(trigger.Status)"
                  class="text-xs md:text-sm"
                >
                  {{ trigger.Status }}
                </span>

                <button
                  v-if="sequenceStore.sequenceEdit && containerIndex === 1 && !readOnly"
                  @click="toggleDisable(trigger._path, trigger.Status, 'Status')"
                >
                  <PowerIcon
                    class="w-5 h-5"
                    :class="trigger.Status === 'DISABLED' ? 'text-red-500' : 'text-green-500'"
                  />
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs md:text-sm">
                <div
                  v-for="[key, value] in getDisplayFields(trigger)"
                  :key="key"
                  class="flex flex-cupdateKeys.includes(key)ol md:flex-row gap-1"
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
                        <div>{{ formatRA(value) }}</div>
                        <div>{{ formatDec(value) }}</div>
                      </div>
                    </template>
                    <template
                      v-else-if="
                        updateKeys.includes(key) && sequenceStore.sequenceEdit && !readOnly
                      "
                    >
                      <input
                        class="w-full bg-gray-500 border-gray-400 rounded p-1 min-w-16 text-gray-200"
                        type="number"
                        v-model="trigger[key]"
                        @change="updateValue($event, trigger._path, trigger[key], key)"
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

        <!-- Conditions -->
        <div v-if="item.Conditions?.length" class="mt-4">
          <h4 class="text-sm font-semibold text-gray-300 mb-2">
            {{ $t('components.sequence.conditions') }}
          </h4>
          <div class="space-y-2">
            <div
              v-for="(condition, cIndex) in item.Conditions"
              :key="cIndex"
              class="bg-gray-700 rounded p-2 md:p-3 border border-gray-600"
            >
              <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span class="text-sm font-medium text-gray-200 break-all">
                  {{ removeSuffix(condition.Name) }}
                </span>
                <span
                  v-if="condition.Status != 'CREATED'"
                  :class="statusColor(condition.Status)"
                  class="text-xs md:text-sm"
                >
                  {{ condition.Status }}
                </span>
                <button
                  v-if="sequenceStore.sequenceEdit && containerIndex === 1 && !readOnly"
                  @click="toggleDisable(condition._path, condition.Status, 'Status')"
                >
                  <PowerIcon
                    class="w-5 h-5"
                    :class="condition.Status === 'DISABLED' ? 'text-red-500' : 'text-green-500'"
                  />
                </button>
              </div>
              <div class="grid grid-cols-1 gap-2 text-xs md:text-sm">
                <div
                  v-for="[key, value] in getDisplayFieldsConditions(condition)"
                  :key="key"
                  class="flex flex-cupdateKeys.includes(key)ol md:flex-row gap-1"
                >
                  <span class="text-gray-400 shrink-0">{{ key }}:</span>
                  <span class="text-gray-200 break-all">
                    <template v-if="key === 'Coordinates'">
                      <div>
                        <div>{{ formatRA(value) }}</div>
                        <div>{{ formatDec(value) }}</div>
                      </div>
                    </template>
                    <template
                      v-else-if="
                        updateKeys.includes(key) && sequenceStore.sequenceEdit && !readOnly
                      "
                    >
                      <input
                        class="w-full bg-gray-500 border-gray-400 rounded p-1 min-w-16 text-gray-200"
                        type="number"
                        v-model="condition[key]"
                        @change="updateValue($event, condition._path, condition[key], key)"
                      />
                    </template>
                    <template v-else-if="condition.SelectedProvider">
                      <div class="flex flex-col md:flex-row gap-1 md:gap-2">
                        <div>
                          <span class="text-gray-200 break-all">
                            {{ condition.SelectedProvider.Name }}
                          </span>
                        </div>
                        <div>
                          <span class="text-gray-400 shrink-0">Time:</span>
                          <span class="text-gray-200 break-all">
                            {{ condition.Hours }}:{{ condition.Minutes }}:{{ condition.Seconds }}
                          </span>
                        </div>
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

        <!--Item-->
        <div class="gap-2 text-sm mb-4">
          <div
            v-for="[key, value] in getDisplayFields(item)"
            :key="key"
            class="flex flex-col md:flex-row md:justify-between md:items-center md:space-y-2 mb-2 mb:mb-0"
          >
            <span class="text-gray-400 shrink-0">{{ key }}:</span>
            <span class="text-gray-200 break-all">
              <template v-if="key === 'CalculatedWaitDuration'">
                {{ formatDuration(value) }}
              </template>
              <template v-else-if="key === 'TargetTime'">
                {{ formatDateTime(value) }}
              </template>
              <template v-else-if="key === 'TimeToMeridianFlip'">
                {{ formatTimeSpan(value) }}
              </template>

              <template v-else-if="key === 'SelectedSwitch'">
                <span class="text-gray-200 break-all">
                  <p>Name: {{ value.Name }}</p>
                  <p>Target Value: {{ value.TargetValue }}</p>
                </span>
              </template>

              <template v-else-if="key === 'Coordinates'">
                <div class="grid grid-cols-1 gap-1">
                  <div>{{ formatRA(value) }}</div>
                  <div>{{ formatDec(value) }}</div>
                </div>
              </template>
              <template
                v-else-if="updateKeys.includes(key) && sequenceStore.sequenceEdit && !readOnly"
              >
                <input
                  class="w-full bg-gray-700 border-gray-600 rounded p-1 text-gray-200"
                  type="number"
                  v-model="item[key]"
                  @change="updateValue($event, item._path, item[key], key)"
                />
              </template>

              <template v-else-if="item.SelectedProvider">
                <div class="flex flex-col md:flex-row gap-1 md:gap-2">
                  <div>
                    <span class="text-gray-200 break-all">
                      {{ item.SelectedProvider.Name }}
                    </span>
                  </div>
                  <div>
                    <span class="text-gray-400 shrink-0">Time:</span>
                    <span class="text-gray-200 break-all">
                      {{ item.Hours }}:{{ item.Minutes }}:{{ item.Seconds }}
                    </span>
                  </div>
                </div>
              </template>
              <!--  Filter kann man noch nicht setzen. Deshalb auf false 20250315 -->
              <template v-else-if="key === 'Filter' && sequenceStore.sequenceEdit && false">
                <select
                  class="w-full bg-gray-700 border-gray-600 rounded p-1 text-gray-200"
                  v-model="item[key]"
                  @change="updateFilter($event, item._path, item[key])"
                >
                  <option
                    v-for="filter in store.filterInfo.AvailableFilters"
                    :key="filter.Id"
                    :value="filter.Name"
                  >
                    {{ filter.Name }}
                  </option>
                </select>
              </template>
              <template v-else-if="key === 'Filter'">
                {{ value.Name }}
              </template>
              <!--  Binning kann man noch nicht setzen. Deshalb auf false 20250315 -->
              <template v-else-if="key === 'Binning' && sequenceStore.sequenceEdit && false">
                <select
                  class="w-full bg-gray-700 border-gray-600 rounded p-1 text-gray-200"
                  v-model="item[key].Name"
                  @change="updateBinning(item._path, item[key])"
                >
                  <option
                    v-for="mode in store.cameraInfo.BinningModes"
                    :key="mode.Name"
                    :value="mode.Name"
                  >
                    {{ mode.X }}x{{ mode.Y }}
                  </option>
                </select>
              </template>
              <template v-else-if="key === 'Binning'"> {{ value.X }}x{{ value.Y }} </template>
              <template v-else-if="key === 'ImageType' && sequenceStore.sequenceEdit">
                <select
                  class="w-full bg-gray-700 border-gray-600 rounded p-1 text-gray-200"
                  v-model="item[key]"
                  @change="updateValue($event, item._path, item[key], 'ImageType')"
                >
                  <option value="LIGHT">LIGHT</option>
                  <option value="FLAT">FLAT</option>
                  <option value="DARK">DARK</option>
                  <option value="BIAS">BIAS</option>
                </select>
              </template>
              <template v-else-if="typeof value === 'object'">
                <div class="grid grid-cols-1 gap-1">
                  <template v-for="[subKey, subValue] in Object.entries(value)" :key="subKey">
                    <template v-if="subKey === 'Coordinates'">
                      <div>{{ formatRA(subValue) }}</div>
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
        <div v-if="item.Items?.length" class="ml-1 md:ml-2 space-y-3">
          <RecursiveItemState
            v-if="sequenceStore.sequenceIsEditable"
            :items="item.Items"
            :isTopLevel="false"
            :containerIndex="containerIndex"
            :readOnly="readOnly || isSmartExposureContainer(item)"
          />
          <RecursiveItemJson
            v-if="!sequenceStore.sequenceIsEditable"
            :items="item.Items"
            :isTopLevel="false"
            :containerIndex="containerIndex"
          />
        </div>

        <!-- Target Information Section -->
        <div v-if="item.Target" class="mt-4 mb-4">
          <div class="bg-gray-700 rounded-lg p-3 border border-gray-600">
            <h4 class="text-lg font-semibold text-cyan-300 mb-3">
              {{ item.Target.TargetName }}
            </h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-400">RA:</span>
                <span class="text-gray-200 ml-2">
                  {{ formatTargetRA(item.Target.InputCoordinates) }}
                </span>
              </div>
              <div>
                <span class="text-gray-400">DEC:</span>
                <span class="text-gray-200 ml-2">
                  {{ formatTargetDec(item.Target.InputCoordinates) }}
                </span>
              </div>
            </div>

            <!-- SkyChart Toggle Button -->
            <div v-if="hasValidTargetCoordinates(item.Target)" class="mt-3">
              <button
                @click="toggleSkyChart(item._path)"
                class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                {{ showSkyChart.get(item._path) ? 'Hide Sky Chart' : 'Show Sky Chart' }}
              </button>
            </div>

            <!-- SkyChart Display -->
            <div
              v-if="showSkyChart.get(item._path) && hasValidTargetCoordinates(item.Target)"
              class="mt-3"
            >
              <SkyChart
                :target="getTargetForSkyChart(item.Target)"
                :coordinates="getObserverCoordinates()"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, ref } from 'vue';
import { defineProps } from 'vue';
import apiService from '@/services/apiService';
import { useSequenceStore } from '@/store/sequenceStore';
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import { PowerIcon } from '@heroicons/vue/24/outline';
import RecursiveItemState from '@/components/sequence/RecursiveItemState.vue';
import RecursiveItemJson from '@/components/sequence/RecursiveItemJson.vue';
import { PlusIcon, MinusIcon } from '@heroicons/vue/24/outline';
import SkyChart from '@/components/framing/SkyChart.vue';
import {
  removeSuffix,
  formatDuration,
  formatTimeSpan,
  formatDateTime,
  formatRA,
  formatDec,
} from '@/utils/sequenceUtils.js';
import { excludedKeys, excludedKeysConditions, updateKeys } from '@/utils/sequenceConfig.js';

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  isTopLevel: {
    type: Boolean,
    default: false,
  },
  containerIndex: {
    type: Number,
    default: -1,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const store = apiStore();
const sequenceStore = useSequenceStore();
const settingsStore = useSettingsStore();

// Reactive state for SkyChart visibility
const showSkyChart = ref(new Map());

// Functions for target coordinate handling
function formatTargetRA(inputCoordinates) {
  if (!inputCoordinates) return 'N/A';
  const hours = inputCoordinates.RAHours || 0;
  const minutes = inputCoordinates.RAMinutes || 0;
  const seconds = inputCoordinates.RASeconds || 0;
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toFixed(1)}s`;
}

function formatTargetDec(inputCoordinates) {
  if (!inputCoordinates) return 'N/A';
  const degrees = inputCoordinates.DecDegrees || 0;
  const minutes = inputCoordinates.DecMinutes || 0;
  const seconds = inputCoordinates.DecSeconds || 0;
  const sign = inputCoordinates.NegativeDec ? '-' : '+';
  return `${sign}${degrees.toString().padStart(2, '0')}° ${minutes.toString().padStart(2, '0')}' ${seconds.toFixed(1)}"`;
}

function hasValidTargetCoordinates(target) {
  if (!target || !target.InputCoordinates) return false;
  const coords = target.InputCoordinates;
  return (
    coords.RAHours !== undefined &&
    coords.RAMinutes !== undefined &&
    coords.RASeconds !== undefined &&
    coords.DecDegrees !== undefined &&
    coords.DecMinutes !== undefined &&
    coords.DecSeconds !== undefined
  );
}

function getTargetForSkyChart(target) {
  if (!target || !target.InputCoordinates) return null;

  const coords = target.InputCoordinates;
  const hours = coords.RAHours || 0;
  const minutes = coords.RAMinutes || 0;
  const seconds = coords.RASeconds || 0;
  const raDegrees = (hours + minutes / 60 + seconds / 3600) * 15; // Convert to degrees

  const degrees = Math.abs(coords.DecDegrees || 0);
  const decMinutes = coords.DecMinutes || 0;
  const decSeconds = coords.DecSeconds || 0;
  let decDegrees = degrees + decMinutes / 60 + decSeconds / 3600;

  if (coords.NegativeDec) {
    decDegrees = -decDegrees;
  }
  return {
    RA: raDegrees,
    Dec: decDegrees,
  };
}

function getObserverCoordinates() {
  return {
    latitude: settingsStore.coordinates?.latitude || 0,
    longitude: settingsStore.coordinates?.longitude || 0,
  };
}

function toggleSkyChart(itemPath) {
  const currentState = showSkyChart.value.get(itemPath) || false;
  showSkyChart.value.set(itemPath, !currentState);
}

function isRunningOrHasRunningChildren(item) {
  if (item.Status === 'RUNNING') {
    return true;
  }
  if (item.Items && item.Items.length > 0) {
    return item.Items.some((child) => isRunningOrHasRunningChildren(child));
  }
  return false;
}

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
    case 'DISABLED':
      return 'text-red-600';
    default:
      return 'text-gray-200';
  }
}

function getDisplayFields(item) {
  return Object.entries(item).filter(
    ([key, value]) => !excludedKeys.has(key) && value !== undefined && value !== null
  );
}

function getDisplayFieldsConditions(item) {
  return Object.entries(item).filter(
    ([key]) => !excludedKeysConditions.has(key) && item[key] !== undefined && item[key]
  );
}

async function updateValue(event, path, newValue, typ) {
  console.log(path, typ, newValue);
  const action = `edit?path=${encodeURIComponent(path + '-' + typ)}&value=${encodeURIComponent(newValue)}`;
  console.log('action:', action);
  const inputElement = event.target;
  try {
    const response = await apiService.sequenceAction(action);
    if (response.StatusCode === 200) {
      sequenceStore.getSequenceInfo();
      inputElement.classList.add('glow-green');
      setTimeout(() => {
        inputElement.classList.remove('glow-green');
      }, 1000);
      console.log('Antwort:', response);
    } else {
      inputElement.classList.add('glow-red');
      setTimeout(() => {
        inputElement.classList.remove('glow-red');
      }, 1000);
    }
  } catch (error) {
    console.log('Fehler:', error);
  }
}

async function updateFilter(event, path, newValue) {
  console.log(path, newValue);
  const typ = 'Filter-Name';
  const action = `edit?path=${encodeURIComponent(path + '-' + typ)}&value=${encodeURIComponent(newValue)}`;
  console.log('action:', action);
  const inputElement = event.target;
  try {
    const response = await apiService.sequenceAction(action);
    if (response.StatusCode === 200) {
      sequenceStore.getSequenceInfo();
      inputElement.classList.add('glow-green');
      setTimeout(() => {
        inputElement.classList.remove('glow-green');
      }, 1000);
      console.log('Antwort:', response);
    } else {
      inputElement.classList.add('glow-red');
      setTimeout(() => {
        inputElement.classList.remove('glow-red');
      }, 1000);
    }
  } catch (error) {
    console.log('Fehler:', error);
  }
}

async function toggleDisable(path, newValue, typ) {
  console.log('toggleDisable', path, typ, newValue);
  let action = '';
  if (newValue === 'DISABLED') {
    action = `edit?path=${encodeURIComponent(path + '-' + typ)}&value=${encodeURIComponent('CREATED')}`;
  } else {
    action = `edit?path=${encodeURIComponent(path + '-' + typ)}&value=${encodeURIComponent('DISABLED')}`;
  }

  console.log('action:', action);
  try {
    const data = await apiService.sequenceAction(action);
    sequenceStore.getSequenceInfo();
    console.log('Antwort:', data);
  } catch (error) {
    console.log('Fehler:', error);
  }
}

async function updateBinning(path, binOb) {
  console.log('Binning:', path, binOb);
  const actionX =
    `edit?path=${encodeURIComponent(path + '-Binning-X')}` +
    `&value=${encodeURIComponent(binOb.X)}`;
  const actionY =
    `edit?path=${encodeURIComponent(path + '-Binning-Y')}` +
    `&value=${encodeURIComponent(binOb.Y)}`;
  const actionName =
    `edit?path=${encodeURIComponent(path + '-Binning-Name')}` +
    `&value=${encodeURIComponent(binOb.Name)}`;
  try {
    let data = await apiService.sequenceAction(actionX);
    console.log('Antwort:', data);
    data = await apiService.sequenceAction(actionY);
    console.log('Antwort:', data);
    data = await apiService.sequenceAction(actionName);
    console.log('Antwort:', data);
    sequenceStore.getSequenceInfo();
  } catch (error) {
    console.log('Fehler:', error);
  }
}

function isSmartExposureContainer(item) {
  if (item?.Name?.includes('Exposure +_Container')) {
    //console.log('Smart Exposure +_Container gefunden – wird gesperrt!');
    return true;
  }
  return false;
}

watch(
  () => props.items,
  (newItems) => {
    sequenceStore.initializeCollapsedStates(newItems);
  },
  { immediate: true }
);
</script>
<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00;
}
.glow-red {
  box-shadow: 0 0 10px rgb(255, 0, 0);
}
</style>
