<template>
  <div class="space-y-2">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="bg-gray-900/80 backdrop-blur-sm rounded-lg transition-all duration-200 hover:bg-gray-900/90 border border-gray-800/50"
      :class="{
        'bg-blue-950/50 ring-1 ring-cyan-400/60 border-cyan-500/30':
          isRunningOrHasRunningChildren(item),
        'hover:bg-gray-900/90 border-gray-700/50': !isRunningOrHasRunningChildren(item),
      }"
    >
      <!-- Header with Collapse Button -->
      <div class="flex justify-between items-center p-2 sm:p-3 border-b border-gray-700/60">
        <div class="flex items-center gap-3">
          <button
            v-if="hasContent(item)"
            @click="sequenceStore.toggleCollapsedState(item._path)"
            class="flex-shrink-0 p-1 rounded-md hover:bg-slate-700/50 transition-colors"
            :title="sequenceStore.isCollapsed(item._path) ? 'Erweitern' : 'Zusammenklappen'"
          >
            <ChevronRightIcon
              class="w-4 h-4 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-90': !sequenceStore.isCollapsed(item._path) }"
            />
          </button>
          <div v-else class="w-6 flex-shrink-0"></div>
          <h3 class="font-medium text-gray-100 text-sm md:text-base truncate">
            {{ removeSuffix(item.Name) }}
          </h3>
        </div>
        <div class="flex items-center gap-2">
          <span
            v-if="isTopLevel || item.Status === 'DISABLED'"
            :class="statusColor(item.Status)"
            class="px-2 py-1 rounded-full text-sm font-medium"
          >
            {{ item.Status }}
          </span>
          <button
            v-if="sequenceStore.sequenceEdit && containerIndex === 1 && !readOnly"
            @click="toggleDisable(item._path, item.Status, 'Status')"
            class="p-1 rounded-md hover:bg-slate-700/50 transition-colors"
          >
            <PowerIcon
              class="w-4 h-4"
              :class="item.Status === 'DISABLED' ? 'text-red-400' : 'text-emerald-400'"
            />
          </button>
        </div>
      </div>

      <div
        v-show="hasContent(item) && !sequenceStore.isCollapsed(item._path)"
        class="p-2 sm:p-3 pt-0"
      >
        <!-- Target Information Section -->
        <div v-if="item.Target" class="mb-3">
          <div class="bg-gray-800/60 rounded-md p-2 sm:p-3 border border-amber-500/20">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 bg-amber-400 rounded-full shadow-amber-400/50 shadow-sm"></div>
              <span class="text-sm font-medium text-amber-200">Target Coordinates</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div class="flex items-center gap-2">
                <span class="text-amber-300 text-sm font-medium w-12 flex-shrink-0">RA:</span>
                <code
                  class="text-amber-100 bg-gray-900/60 px-2 py-1 rounded text-sm border border-amber-500/20"
                >
                  {{ formatTargetRA(item.Target.InputCoordinates) }}
                </code>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-amber-300 text-sm font-medium w-12 flex-shrink-0">DEC:</span>
                <code
                  class="text-amber-100 bg-gray-900/60 px-2 py-1 rounded text-sm border border-amber-500/20"
                >
                  {{ formatTargetDec(item.Target.InputCoordinates) }}
                </code>
              </div>
            </div>

            <!-- SkyChart Display -->
            <div v-if="hasValidTargetCoordinates(item.Target)" class="mt-3">
              <SkyChart
                :target="getTargetForSkyChart(item.Target)"
                :coordinates="getObserverCoordinates()"
              />
            </div>
          </div>
        </div>
        <!-- Triggers Section -->
        <div v-if="item.Triggers?.length" class="mb-3">
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-emerald-400 rounded-full shadow-emerald-400/50 shadow-sm"></div>
              <h4 class="text-sm font-medium text-emerald-200">
                {{ $t('components.sequence.triggers') }}
              </h4>
            </div>
            <button
              @click="sequenceStore.toggleCollapsedState(`${item._path || 'triggers'}-triggers`)"
              class="flex-shrink-0 p-1 rounded-md hover:bg-slate-700/50 transition-colors"
              :title="sequenceStore.isCollapsed(`${item._path || 'triggers'}-triggers`) ? 'Erweitern' : 'Zusammenklappen'"
            >
              <ChevronRightIcon
                class="w-4 h-4 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-90': !sequenceStore.isCollapsed(`${item._path || 'triggers'}-triggers`) }"
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
              class="bg-gray-800/40 rounded-md p-2 hover:bg-gray-800/60 transition-colors border border-gray-700/30"
            >
              <div class="flex items-center justify-between gap-2 mb-2">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-1.5 h-1.5 bg-green-400/60 rounded-full flex-shrink-0"></div>
                  <span class="text-sm font-medium text-slate-200 truncate">
                    {{ removeSuffix(trigger.Name) }}
                  </span>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span
                    v-if="trigger.Status != 'CREATED'"
                    :class="statusColor(trigger.Status)"
                    class="px-2 py-0.5 rounded-full text-sm font-medium"
                  >
                    {{ trigger.Status }}
                  </span>
                  <button
                    v-if="sequenceStore.sequenceEdit && containerIndex === 1 && !readOnly"
                    @click="toggleDisable(trigger._path, trigger.Status, 'Status')"
                    class="p-1 rounded hover:bg-slate-600/50 transition-colors"
                  >
                    <PowerIcon
                      class="w-3.5 h-3.5"
                      :class="trigger.Status === 'DISABLED' ? 'text-red-400' : 'text-green-400'"
                    />
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                <div
                  v-for="[key, value] in getDisplayFields(trigger)"
                  :key="key"
                  class="flex flex-col sm:flex-row gap-6"
                >
                  <span class="text-gray-400 text-sm font-medium w-28 flex-shrink-0"
                    >{{ formatKey(key) }}:</span
                  >
                  <span class="text-gray-200 break-all min-w-0">
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
                        class="w-full bg-slate-700/50 border border-slate-600/50 rounded px-2 py-1 text-slate-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors"
                        type="number"
                        v-model="trigger[key]"
                        @change="updateValue($event, trigger._path, trigger[key], key)"
                      />
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

        <!-- Conditions -->
        <div v-if="item.Conditions?.length" class="mb-3">
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-orange-400 rounded-full shadow-orange-400/50 shadow-sm"></div>
              <h4 class="text-sm font-medium text-orange-200">
                {{ $t('components.sequence.conditions') }}
              </h4>
            </div>
            <button
              @click="sequenceStore.toggleCollapsedState(`${item._path || 'conditions'}-conditions`)"
              class="flex-shrink-0 p-1 rounded-md hover:bg-slate-700/50 transition-colors"
              :title="sequenceStore.isCollapsed(`${item._path || 'conditions'}-conditions`) ? 'Erweitern' : 'Zusammenklappen'"
            >
              <ChevronRightIcon
                class="w-4 h-4 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-90': !sequenceStore.isCollapsed(`${item._path || 'conditions'}-conditions`) }"
              />
            </button>
          </div>
          <div
            v-show="!sequenceStore.isCollapsed(`${item._path || 'conditions'}-conditions`)"
            class="space-y-1"
          >
            <div
              v-for="(condition, cIndex) in item.Conditions"
              :key="cIndex"
              class="bg-gray-800/40 rounded-md p-2 hover:bg-gray-800/60 transition-colors border border-gray-700/30"
            >
              <div class="flex items-center justify-between gap-2 mb-2">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-1.5 h-1.5 bg-orange-400/60 rounded-full flex-shrink-0"></div>
                  <span class="text-sm font-medium text-slate-200 truncate">
                    {{ removeSuffix(condition.Name) }}
                  </span>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span
                    v-if="condition.Status != 'CREATED'"
                    :class="statusColor(condition.Status)"
                    class="px-2 py-0.5 rounded-full text-sm font-medium"
                  >
                    {{ condition.Status }}
                  </span>
                  <button
                    v-if="sequenceStore.sequenceEdit && containerIndex === 1 && !readOnly"
                    @click="toggleDisable(condition._path, condition.Status, 'Status')"
                    class="p-1 rounded hover:bg-slate-600/50 transition-colors"
                  >
                    <PowerIcon
                      class="w-3.5 h-3.5"
                      :class="condition.Status === 'DISABLED' ? 'text-red-400' : 'text-green-400'"
                    />
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-1 gap-3 text-sm">
                <div
                  v-for="[key, value] in getDisplayFieldsConditions(condition)"
                  :key="key"
                  class="flex flex-col sm:flex-row gap-6"
                >
                  <span class="text-gray-400 text-sm font-medium w-28 flex-shrink-0"
                    >{{ formatKey(key) }}:</span
                  >
                  <span class="text-gray-200 break-all min-w-0">
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
                        class="w-full bg-slate-700/50 border border-slate-600/50 rounded px-2 py-1 text-slate-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors"
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
                        <div
                          v-if="sequenceStore.sequenceEdit && !readOnly"
                          class="flex items-center gap-2"
                        >
                          <span class="text-gray-400 shrink-0">Time:</span>
                          <div class="flex gap-1">
                            <input
                              class="w-12 bg-slate-700/50 border border-slate-600/50 rounded px-1 py-1 text-slate-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors"
                              type="number"
                              min="0"
                              max="23"
                              v-model="condition.Hours"
                              @change="
                                updateValue($event, condition._path, condition.Hours, 'Hours')
                              "
                            />
                            <span class="text-gray-400">:</span>
                            <input
                              class="w-12 bg-slate-700/50 border border-slate-600/50 rounded px-1 py-1 text-slate-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors"
                              type="number"
                              min="0"
                              max="59"
                              v-model="condition.Minutes"
                              @change="
                                updateValue($event, condition._path, condition.Minutes, 'Minutes')
                              "
                            />
                            <span class="text-gray-400">:</span>
                            <input
                              class="w-12 bg-slate-700/50 border border-slate-600/50 rounded px-1 py-1 text-slate-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors"
                              type="number"
                              min="0"
                              max="59"
                              v-model="condition.Seconds"
                              @change="
                                updateValue($event, condition._path, condition.Seconds, 'Seconds')
                              "
                            />
                          </div>
                        </div>
                        <div v-else>
                          <span class="text-gray-400 shrink-0">Time:</span>
                          <span class="text-gray-200 break-all">
                            {{ condition.Hours }}:{{ condition.Minutes }}:{{ condition.Seconds }}
                          </span>
                        </div>
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

        <!--Item Properties-->
        <div v-if="getDisplayFields(item).length" class="mb-3">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 bg-cyan-400 rounded-full shadow-cyan-400/50 shadow-sm"></div>
            <h4 class="text-sm font-medium text-cyan-200">Properties</h4>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            <div
              v-for="[key, value] in getDisplayFields(item)"
              :key="key"
              class="flex flex-col sm:flex-row gap-6 p-3 bg-gray-800/30 rounded border border-gray-700/20"
            >
              <span class="text-gray-400 text-sm font-medium w-28 flex-shrink-0"
                >{{ formatKey(key) }}:</span
              >
              <span class="text-slate-200 break-all min-w-0">
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
                    class="w-full bg-slate-700/50 border border-slate-600/50 rounded px-2 py-1 text-slate-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors"
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
                    <div
                      v-if="sequenceStore.sequenceEdit && !readOnly"
                      class="flex items-center gap-2"
                    >
                      <span class="text-gray-400 shrink-0">Time:</span>
                      <div class="flex gap-1">
                        <input
                          class="w-12 bg-slate-700/50 border border-slate-600/50 rounded px-1 py-1 text-slate-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors"
                          type="number"
                          min="0"
                          max="23"
                          v-model="item.Hours"
                          @change="updateValue($event, item._path, item.Hours, 'Hours')"
                        />
                        <span class="text-gray-400">:</span>
                        <input
                          class="w-12 bg-slate-700/50 border border-slate-600/50 rounded px-1 py-1 text-slate-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors"
                          type="number"
                          min="0"
                          max="59"
                          v-model="item.Minutes"
                          @change="updateValue($event, item._path, item.Minutes, 'Minutes')"
                        />
                        <span class="text-gray-400">:</span>
                        <input
                          class="w-12 bg-slate-700/50 border border-slate-600/50 rounded px-1 py-1 text-slate-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors"
                          type="number"
                          min="0"
                          max="59"
                          v-model="item.Seconds"
                          @change="updateValue($event, item._path, item.Seconds, 'Seconds')"
                        />
                      </div>
                    </div>
                    <div v-else>
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
                  {{ value._name || value.Name || value }}
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
                    class="w-full bg-slate-700/50 border border-slate-600/50 rounded px-2 py-1 text-slate-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors"
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
        <div v-if="item.Items?.length" class="mt-3 space-y-2">
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue';
import { defineProps } from 'vue';
import apiService from '@/services/apiService';
import { useSequenceStore } from '@/store/sequenceStore';
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import { PowerIcon } from '@heroicons/vue/24/outline';
import RecursiveItemState from '@/components/sequence/RecursiveItemState.vue';
import RecursiveItemJson from '@/components/sequence/RecursiveItemJson.vue';
import { ChevronRightIcon } from '@heroicons/vue/24/outline';
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

function hasContent(item) {
  // Check if item has any collapsible content
  return !!(
    item.Target ||
    (item.Triggers && item.Triggers.length > 0) ||
    (item.Conditions && item.Conditions.length > 0) ||
    (item.Items && item.Items.length > 0) ||
    getDisplayFields(item).length > 0
  );
}

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
      return 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 shadow-emerald-400/20 shadow-sm';
    case 'RUNNING':
      return 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-cyan-400/20 shadow-sm';
    case 'CREATED':
      return 'bg-amber-500/30 text-amber-200 border border-amber-400/50 shadow-amber-400/20 shadow-sm';
    case 'SKIPPED':
      return 'bg-gray-500/30 text-gray-300 border border-gray-400/50';
    case 'DISABLED':
      return 'bg-red-500/30 text-red-300 border border-red-400/50';
    default:
      return 'bg-gray-600/30 text-gray-300 border border-gray-500/50';
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
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
  border-color: rgb(34, 197, 94) !important;
}
.glow-red {
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
  border-color: rgb(239, 68, 68) !important;
}

/* Smooth transitions for all interactive elements */
* {
  transition-property: background-color, border-color, color, box-shadow;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Focus states */
input:focus,
select:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Scrollbar styling for nested items */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgb(51, 65, 85, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgb(100, 116, 139, 0.5);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgb(100, 116, 139, 0.7);
}
</style>
