<template>
  <div class="container mx-auto p-2 sm:p-4 max-w-5xl">
    <div class="flex items-center justify-between mb-3 gap-2">
      <h1 class="text-xl sm:text-2xl font-bold text-white">
        {{ $t('plugins.indiControlPanel.title') }}
      </h1>
      <div class="flex items-center gap-2">
        <span v-if="lastUpdated" class="text-xs text-gray-500 hidden sm:inline">
          {{ $t('plugins.indiControlPanel.updated') }} {{ lastUpdatedText }}
        </span>
        <button
          class="px-3 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 disabled:opacity-50"
          :disabled="loading"
          @click="reload"
        >
          {{ $t('plugins.indiControlPanel.refresh') }}
        </button>
      </div>
    </div>

    <p class="text-sm text-gray-400 mb-4">
      {{ $t('plugins.indiControlPanel.description') }}
    </p>

    <div
      v-if="error"
      class="mb-4 p-3 rounded-md bg-red-900/40 border border-red-700 text-red-200 text-sm"
    >
      {{ error }}
    </div>

    <div
      v-if="!loading && devices.length === 0"
      class="p-6 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 text-center"
    >
      {{ $t('plugins.indiControlPanel.noDevices') }}
    </div>

    <!-- Device tabs -->
    <div v-if="devices.length > 0" class="flex flex-wrap gap-2 mb-4">
      <button
        v-for="dev in devices"
        :key="dev.Device"
        class="px-3 py-1.5 text-sm rounded-md border flex items-center gap-2"
        :class="
          dev.Device === selectedDeviceName
            ? 'bg-indigo-600 border-indigo-500 text-white'
            : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
        "
        @click="selectedDeviceName = dev.Device"
      >
        <span
          class="w-2 h-2 rounded-full"
          :class="dev.Connected ? 'bg-green-400' : 'bg-gray-500'"
        ></span>
        {{ dev.Device }}
      </button>
    </div>

    <!-- Property groups as tabs for the selected device -->
    <div v-if="selectedDevice">
      <div v-if="groupedProperties.length > 0" class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="group in groupedProperties"
          :key="group.name"
          class="px-3 py-1.5 text-sm rounded-md border"
          :class="
            group.name === activeGroup?.name
              ? 'bg-gray-600 border-gray-400 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
          "
          @click="activeGroupName = group.name"
        >
          {{ group.name }}
        </button>
      </div>

      <div v-if="activeGroup" class="rounded-lg bg-gray-800 border border-gray-700 overflow-hidden">
        <div class="divide-y divide-gray-700/60">
          <div v-for="prop in activeGroup.properties" :key="prop.Name" class="p-3">
            <div class="flex items-center gap-2 mb-2">
              <span
                class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                :class="stateColor(prop.State)"
              ></span>
              <span class="text-sm font-medium text-gray-100">{{ prop.Label || prop.Name }}</span>
              <span
                class="text-[10px] uppercase tracking-wide text-gray-500 border border-gray-600 rounded px-1"
              >
                {{ prop.Type }}
              </span>
              <span v-if="prop.Permission === 'ReadOnly'" class="text-[10px] text-gray-500">
                {{ $t('plugins.indiControlPanel.readonly') }}
              </span>
            </div>

            <!-- Number / Text editable elements -->
            <div
              v-if="prop.Type === 'number' || prop.Type === 'text'"
              class="grid grid-cols-1 sm:grid-cols-2 gap-2"
            >
              <div v-for="el in prop.Elements" :key="el.Name" class="flex flex-col gap-1">
                <label class="text-xs text-gray-400">{{ el.Label || el.Name }}</label>
                <input
                  :type="prop.Type === 'number' ? 'number' : 'text'"
                  :step="prop.Type === 'number' ? numberStep(el) : undefined"
                  :min="prop.Type === 'number' && el.Min != null ? el.Min : undefined"
                  :max="prop.Type === 'number' && el.Max != null ? el.Max : undefined"
                  :disabled="prop.Permission === 'ReadOnly'"
                  class="w-full px-2 py-1 text-sm rounded bg-gray-900 border border-gray-600 text-white disabled:opacity-60"
                  :value="displayValue(prop, el)"
                  @input="onEdit(prop, el, $event.target.value)"
                  @keyup.enter="submitProperty(prop)"
                />
              </div>
              <div v-if="prop.Permission !== 'ReadOnly'" class="sm:col-span-2">
                <button
                  class="px-3 py-1 text-sm rounded-md bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                  :disabled="busyKey === prop.Name"
                  @click="submitProperty(prop)"
                >
                  {{ $t('plugins.indiControlPanel.set') }}
                </button>
              </div>
            </div>

            <!-- Switch elements -->
            <div v-else-if="prop.Type === 'switch'" class="flex flex-wrap gap-2">
              <button
                v-for="el in prop.Elements"
                :key="el.Name"
                class="px-3 py-1 text-sm rounded-md border"
                :class="
                  el.Value
                    ? 'bg-green-600 border-green-500 text-white'
                    : 'bg-gray-900 border-gray-600 text-gray-300 hover:bg-gray-700'
                "
                :disabled="prop.Permission === 'ReadOnly' || busyKey === prop.Name"
                @click="toggleSwitch(prop, el)"
              >
                {{ el.Label || el.Name }}
              </button>
            </div>

            <!-- Light elements (read-only indicators) -->
            <div v-else-if="prop.Type === 'light'" class="flex flex-wrap gap-3">
              <div
                v-for="el in prop.Elements"
                :key="el.Name"
                class="flex items-center gap-1.5 text-sm text-gray-300"
              >
                <span class="w-2.5 h-2.5 rounded-full" :class="stateColor(el.Value)"></span>
                {{ el.Label || el.Name }}
              </div>
            </div>

            <!-- Blob / other (read-only) -->
            <div v-else class="text-xs text-gray-500">
              <span v-for="el in prop.Elements" :key="el.Name" class="mr-3">{{
                el.Label || el.Name
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import apiPinsService from '@/services/apiPinsService';

const { t } = useI18n();

const POLL_INTERVAL_MS = 2500;

const deviceSnapshots = ref([]);
const selectedDeviceName = ref(null);
const activeGroupName = ref(null);
const loading = ref(false);
const error = ref('');
const lastUpdated = ref(0);
const busyKey = ref(null);

// Local edit buffers so polling does not clobber values the user is typing.
// key: `${propertyName}|${elementName}`
const edits = reactive({});

let pollTimer = null;

const devices = computed(() => deviceSnapshots.value || []);

const selectedDevice = computed(() =>
  devices.value.find((d) => d.Device === selectedDeviceName.value)
);

const groupedProperties = computed(() => {
  const dev = selectedDevice.value;
  if (!dev || !Array.isArray(dev.Properties)) return [];
  const map = new Map();
  for (const prop of dev.Properties) {
    const name = prop.Group || 'Main';
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(prop);
  }
  return Array.from(map.entries()).map(([name, properties]) => ({ name, properties }));
});

// Active group tab. Falls back to the first group when the remembered one is gone
// (e.g. after switching device or a driver dropping a group).
const activeGroup = computed(() => {
  const groups = groupedProperties.value;
  return groups.find((g) => g.name === activeGroupName.value) || groups[0] || null;
});

// Reset the group selection when the device changes so the first tab is shown.
watch(selectedDeviceName, () => {
  activeGroupName.value = null;
});

const lastUpdatedText = computed(() => {
  if (!lastUpdated.value) return '';
  return new Date(lastUpdated.value).toLocaleTimeString();
});

function stateColor(state) {
  switch (state) {
    case 'Ok':
      return 'bg-green-400';
    case 'Busy':
      return 'bg-yellow-400';
    case 'Alert':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

function numberStep(el) {
  return el.Step && el.Step > 0 ? el.Step : 'any';
}

function editKey(prop, el) {
  return `${prop.Name}|${el.Name}`;
}

function liveValue(prop, el) {
  return el.Value ?? '';
}

function displayValue(prop, el) {
  const key = editKey(prop, el);
  return Object.prototype.hasOwnProperty.call(edits, key) ? edits[key] : liveValue(prop, el);
}

function onEdit(prop, el, value) {
  edits[editKey(prop, el)] = value;
}

function clearEdits(prop) {
  for (const el of prop.Elements) {
    delete edits[editKey(prop, el)];
  }
}

async function submitProperty(prop) {
  if (prop.Permission === 'ReadOnly') return;
  const elements = {};
  for (const el of prop.Elements) {
    let value = displayValue(prop, el);
    if (prop.Type === 'number') {
      const num = Number(value);
      if (Number.isNaN(num)) {
        error.value = t('plugins.indiControlPanel.invalidNumber', { element: el.Label || el.Name });
        return;
      }
      value = num;
    }
    elements[el.Name] = value;
  }
  await sendSet(prop, elements);
  clearEdits(prop);
}

async function toggleSwitch(prop, el) {
  if (prop.Permission === 'ReadOnly') return;
  const elements = {};
  if (prop.Rule === 'OneOfMany' || prop.Rule === 'AtMostOne') {
    elements[el.Name] = true;
  } else {
    elements[el.Name] = !el.Value;
  }
  await sendSet(prop, elements);
}

async function sendSet(prop, elements) {
  busyKey.value = prop.Name;
  error.value = '';
  try {
    const res = await apiPinsService.setINDIProperty(selectedDeviceName.value, prop.Name, elements);
    if (res && res.Success === false) {
      error.value = res.Error || t('plugins.indiControlPanel.setFailed');
    }
    // Pull a fresh snapshot quickly so the UI reflects the driver's response.
    await loadProperties();
  } catch (e) {
    error.value = e?.message || t('plugins.indiControlPanel.setFailed');
  } finally {
    busyKey.value = null;
  }
}

async function loadProperties() {
  try {
    const res = await apiPinsService.getINDIProperties();
    const list = res && res.Response ? res.Response : [];
    deviceSnapshots.value = Array.isArray(list) ? list : [];
    lastUpdated.value = Date.now();

    // Keep / pick a selected device.
    if (
      !selectedDeviceName.value ||
      !devices.value.some((d) => d.Device === selectedDeviceName.value)
    ) {
      selectedDeviceName.value = devices.value.length > 0 ? devices.value[0].Device : null;
    }
  } catch (e) {
    error.value = e?.message || t('plugins.indiControlPanel.loadFailed');
  }
}

async function reload() {
  loading.value = true;
  error.value = '';
  try {
    await apiPinsService.refreshINDIProperties();
    await loadProperties();
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await reload();
  pollTimer = setInterval(loadProperties, POLL_INTERVAL_MS);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>
