<template>
  <div class="flex flex-col gap-3">
    <!-- Pattern Chips -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-gray-400">{{ $t('components.settings.imageFile.pattern') }}</label>
      <div
        class="flex flex-wrap items-center gap-1 bg-gray-900/50 border border-gray-700/50 rounded-lg px-2 py-2 min-h-[40px]"
      >
        <div
          v-for="(segment, index) in patternSegments"
          :key="index"
          class="flex items-center rounded text-xs font-mono"
          :class="segmentClass(segment)"
        >
          <span class="px-1.5 py-0.5">{{ segmentLabel(segment) }}</span>
          <button
            @click="removeSegment(index)"
            class="px-1 py-0.5 hover:text-red-400 transition-colors opacity-60 hover:opacity-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
        <span v-if="patternSegments.length === 0" class="text-gray-600 text-xs">
          {{ $t('components.settings.imageFile.empty') }}
        </span>
      </div>
    </div>

    <!-- Preview -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-gray-400">{{ $t('components.settings.imageFile.preview') }}</label>
      <div
        class="bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 font-mono text-xs text-cyan-300 break-all"
      >
        {{ previewResult || '—' }}
      </div>
    </div>

    <!-- Token Groups -->
    <div class="flex flex-col gap-2">
      <div v-for="group in tokenGroups" :key="group.label" class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">{{ $t(group.label) }}</label>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="token in group.tokens"
            :key="token.key"
            @click="addSegment(token.key)"
            class="px-2 py-1 text-xs rounded bg-gray-700/80 hover:bg-gray-600 text-gray-200 border border-gray-600/50 transition-colors"
          >
            {{ token.display }}
          </button>
        </div>
      </div>

      <!-- Separator buttons -->
      <div class="flex flex-wrap gap-1 mt-1">
        <button
          @click="addSegment('\\')"
          class="px-3 py-1 text-xs rounded bg-amber-900/60 hover:bg-amber-800/60 text-amber-200 border border-amber-700/50 transition-colors font-mono"
        >
          \ {{ $t('components.settings.imageFile.folder') }}
        </button>
        <button
          @click="addSegment('_')"
          class="px-3 py-1 text-xs rounded bg-amber-900/60 hover:bg-amber-800/60 text-amber-200 border border-amber-700/50 transition-colors font-mono"
        >
          _ {{ $t('components.settings.imageFile.separator') }}
        </button>
        <button
          @click="addSegment('-')"
          class="px-3 py-1 text-xs rounded bg-amber-900/60 hover:bg-amber-800/60 text-amber-200 border border-amber-700/50 transition-colors font-mono"
        >
          - {{ $t('components.settings.imageFile.separator') }}
        </button>
        <button
          @click="addCustomText"
          class="px-3 py-1 text-xs rounded bg-amber-900/60 hover:bg-amber-800/60 text-amber-200 border border-amber-700/50 transition-colors font-mono"
        >
          abc {{ $t('components.settings.imageFile.freeText') }}
        </button>
      </div>

      <!-- Save Button -->
      <button
        @click="savePattern"
        class="default-button-cyan w-full mt-1"
        :class="{ 'glow-green': saveSuccess }"
        :disabled="saving"
      >
        {{ $t('components.settings.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

const store = apiStore();
const saving = ref(false);
const saveSuccess = ref(false);

const defaultPattern =
  '$$DATEMINUS12$$\\$$IMAGETYPE$$\\$$DATETIME$$_$$FILTER$$_$$SENSORTEMP$$_$$EXPOSURETIME$$s_$$FRAMENR$$';

// Segments array - each element is a raw string piece (token or literal text)
const patternSegments = ref([]);

// All known token keys for parsing
const allTokenKeys = [
  '$$FILTER$$',
  '$$DATE$$',
  '$$DATEUTC$$',
  '$$DATEMINUS12$$',
  '$$DATETIME$$',
  '$$TIME$$',
  '$$TIMEUTC$$',
  '$$MJD$$',
  '$$FRAMENR$$',
  '$$IMAGETYPE$$',
  '$$BINNING$$',
  '$$SENSORTEMP$$',
  '$$TEMPERATURESETPOINT$$',
  '$$EXPOSURETIME$$',
  '$$TARGETNAME$$',
  '$$GAIN$$',
  '$$OFFSET$$',
  '$$RMS$$',
  '$$RMSARCSEC$$',
  '$$PEAKRA$$',
  '$$PEAKRAARCSEC$$',
  '$$PEAKDEC$$',
  '$$PEAKDECARCSEC$$',
  '$$FOCUSERPOSITION$$',
  '$$FOCUSERTEMP$$',
  '$$APPLICATIONSTARTDATE$$',
  '$$HFR$$',
  '$$SQM$$',
  '$$READOUTMODE$$',
  '$$USBLIMIT$$',
  '$$CAMERA$$',
  '$$TELESCOPE$$',
  '$$ROTATORANGLE$$',
  '$$STARCOUNT$$',
  '$$SEQUENCETITLE$$',
];

// Display names for tokens
const tokenDisplayNames = {
  '$$FILTER$$': 'Filter',
  '$$DATE$$': 'Date',
  '$$DATEUTC$$': 'DateUtc',
  '$$DATEMINUS12$$': 'DateMinus12',
  '$$DATETIME$$': 'DateTime',
  '$$TIME$$': 'Time',
  '$$TIMEUTC$$': 'TimeUtc',
  '$$MJD$$': 'MJD',
  '$$FRAMENR$$': 'FrameNr',
  '$$IMAGETYPE$$': 'ImageType',
  '$$BINNING$$': 'Binning',
  '$$SENSORTEMP$$': 'SensorTemp',
  '$$TEMPERATURESETPOINT$$': 'TempSetPoint',
  '$$EXPOSURETIME$$': 'ExposureTime',
  '$$TARGETNAME$$': 'TargetName',
  '$$GAIN$$': 'Gain',
  '$$OFFSET$$': 'Offset',
  '$$RMS$$': 'RMS',
  '$$RMSARCSEC$$': 'RMS"',
  '$$PEAKRA$$': 'PeakRA',
  '$$PEAKRAARCSEC$$': 'PeakRA"',
  '$$PEAKDEC$$': 'PeakDec',
  '$$PEAKDECARCSEC$$': 'PeakDec"',
  '$$FOCUSERPOSITION$$': 'FocuserPos',
  '$$FOCUSERTEMP$$': 'FocuserTemp',
  '$$APPLICATIONSTARTDATE$$': 'AppStartDate',
  '$$HFR$$': 'HFR',
  '$$SQM$$': 'SQM',
  '$$READOUTMODE$$': 'ReadoutMode',
  '$$USBLIMIT$$': 'USBLimit',
  '$$CAMERA$$': 'Camera',
  '$$TELESCOPE$$': 'Telescope',
  '$$ROTATORANGLE$$': 'RotatorAngle',
  '$$STARCOUNT$$': 'StarCount',
  '$$SEQUENCETITLE$$': 'SeqTitle',
};

const tokenGroups = [
  {
    label: 'components.settings.imageFile.groups.dateTime',
    tokens: [
      { key: '$$DATE$$', display: 'Date' },
      { key: '$$DATEUTC$$', display: 'DateUtc' },
      { key: '$$DATEMINUS12$$', display: 'DateMinus12' },
      { key: '$$DATETIME$$', display: 'DateTime' },
      { key: '$$TIME$$', display: 'Time' },
      { key: '$$TIMEUTC$$', display: 'TimeUtc' },
      { key: '$$MJD$$', display: 'MJD' },
    ],
  },
  {
    label: 'components.settings.imageFile.groups.image',
    tokens: [
      { key: '$$IMAGETYPE$$', display: 'ImageType' },
      { key: '$$FILTER$$', display: 'Filter' },
      { key: '$$FRAMENR$$', display: 'FrameNr' },
      { key: '$$EXPOSURETIME$$', display: 'ExposureTime' },
      { key: '$$BINNING$$', display: 'Binning' },
    ],
  },
  {
    label: 'components.settings.imageFile.groups.camera',
    tokens: [
      { key: '$$SENSORTEMP$$', display: 'SensorTemp' },
      { key: '$$TEMPERATURESETPOINT$$', display: 'TempSetPoint' },
      { key: '$$GAIN$$', display: 'Gain' },
      { key: '$$OFFSET$$', display: 'Offset' },
      { key: '$$READOUTMODE$$', display: 'ReadoutMode' },
      { key: '$$USBLIMIT$$', display: 'USBLimit' },
      { key: '$$CAMERA$$', display: 'Camera' },
    ],
  },
  {
    label: 'components.settings.imageFile.groups.guiding',
    tokens: [
      { key: '$$RMS$$', display: 'RMS' },
      { key: '$$RMSARCSEC$$', display: 'RMS"' },
      { key: '$$PEAKRA$$', display: 'PeakRA' },
      { key: '$$PEAKRAARCSEC$$', display: 'PeakRA"' },
      { key: '$$PEAKDEC$$', display: 'PeakDec' },
      { key: '$$PEAKDECARCSEC$$', display: 'PeakDec"' },
    ],
  },
  {
    label: 'components.settings.imageFile.groups.equipment',
    tokens: [
      { key: '$$FOCUSERPOSITION$$', display: 'FocuserPos' },
      { key: '$$FOCUSERTEMP$$', display: 'FocuserTemp' },
      { key: '$$TELESCOPE$$', display: 'Telescope' },
      { key: '$$ROTATORANGLE$$', display: 'RotatorAngle' },
    ],
  },
  {
    label: 'components.settings.imageFile.groups.other',
    tokens: [
      { key: '$$TARGETNAME$$', display: 'TargetName' },
      { key: '$$SEQUENCETITLE$$', display: 'SeqTitle' },
      { key: '$$APPLICATIONSTARTDATE$$', display: 'AppStartDate' },
      { key: '$$HFR$$', display: 'HFR' },
      { key: '$$SQM$$', display: 'SQM' },
      { key: '$$STARCOUNT$$', display: 'StarCount' },
    ],
  },
];

// prettier-ignore
const exampleValues = {
  '$$FILTER$$': 'Ha',
  '$$DATE$$': '2024-01-15',
  '$$DATEUTC$$': '2024-01-15',
  '$$DATEMINUS12$$': '2024-01-15',
  '$$DATETIME$$': '2024-01-15_21-30-00',
  '$$TIME$$': '21-30-00',
  '$$TIMEUTC$$': '20-30-00',
  '$$MJD$$': '60324',
  '$$FRAMENR$$': '0001',
  '$$IMAGETYPE$$': 'LIGHT',
  '$$BINNING$$': '1x1',
  '$$SENSORTEMP$$': '-10',
  '$$TEMPERATURESETPOINT$$': '-10',
  '$$EXPOSURETIME$$': '300',
  '$$TARGETNAME$$': 'M31',
  '$$GAIN$$': '100',
  '$$OFFSET$$': '10',
  '$$RMS$$': '0.45',
  '$$RMSARCSEC$$': '0.68',
  '$$PEAKRA$$': '0.32',
  '$$PEAKRAARCSEC$$': '0.48',
  '$$PEAKDEC$$': '0.28',
  '$$PEAKDECARCSEC$$': '0.42',
  '$$FOCUSERPOSITION$$': '12500',
  '$$FOCUSERTEMP$$': '5',
  '$$APPLICATIONSTARTDATE$$': '2024-01-15',
  '$$HFR$$': '2.1',
  '$$SQM$$': '20.5',
  '$$READOUTMODE$$': '0',
  '$$USBLIMIT$$': '40',
  '$$CAMERA$$': 'ZWO ASI294MC Pro',
  '$$TELESCOPE$$': 'RC8',
  '$$ROTATORANGLE$$': '45',
  '$$STARCOUNT$$': '142',
  '$$SEQUENCETITLE$$': 'M31_Session',
};

/**
 * Parse a pattern string into segments.
 * Splits on $$TOKEN$$ boundaries, keeping tokens and literal text as separate segments.
 */
function parsePattern(patternString) {
  const segments = [];
  if (!patternString) return segments;

  // Build regex that matches any $$TOKEN$$
  const tokenPattern = /(\$\$[A-Z]+\$\$)/;
  const parts = patternString.split(tokenPattern).filter((p) => p !== '');

  for (const part of parts) {
    if (allTokenKeys.includes(part)) {
      segments.push(part);
    } else {
      // Split literal text into individual characters so each separator is its own chip
      // But keep consecutive non-separator chars together as free text
      let buffer = '';
      for (const char of part) {
        if (char === '\\' || char === '_' || char === '-') {
          if (buffer) {
            segments.push(buffer);
            buffer = '';
          }
          segments.push(char);
        } else {
          buffer += char;
        }
      }
      if (buffer) {
        segments.push(buffer);
      }
    }
  }

  return segments;
}

/**
 * Build pattern string from segments
 */
function buildPattern() {
  return patternSegments.value.join('');
}

function isToken(segment) {
  return allTokenKeys.includes(segment);
}

function isSeparator(segment) {
  return segment === '\\' || segment === '_' || segment === '-';
}

function segmentLabel(segment) {
  if (isToken(segment)) return tokenDisplayNames[segment] || segment;
  if (segment === '\\') return '\\';
  return segment;
}

function segmentClass(segment) {
  if (isToken(segment)) {
    return 'bg-cyan-900/60 text-cyan-200 border border-cyan-700/50';
  }
  if (isSeparator(segment)) {
    return 'bg-amber-900/60 text-amber-200 border border-amber-700/50';
  }
  return 'bg-gray-700/60 text-gray-300 border border-gray-600/50';
}

function addSegment(segment) {
  patternSegments.value.push(segment);
}

function addCustomText() {
  const text = prompt('Text:');
  if (text) {
    patternSegments.value.push(text);
  }
}

function removeSegment(index) {
  patternSegments.value.splice(index, 1);
}

const patternString = computed(() => buildPattern());

const previewResult = computed(() => {
  const raw = patternString.value;
  if (!raw) return '';
  let result = raw;
  for (const [token, value] of Object.entries(exampleValues)) {
    result = result.replaceAll(token, value);
  }
  return result;
});

async function savePattern() {
  saving.value = true;
  saveSuccess.value = false;
  try {
    await apiService.profileChangeValue('ImageFileSettings-FilePattern', patternString.value);
    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
    }, 1500);
  } catch (error) {
    console.error('[FilePatternBuilder] Error saving pattern:', error);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  const currentPattern = store.profileInfo.ImageFileSettings.FilePattern;
  const source = currentPattern || defaultPattern;
  patternSegments.value = parsePattern(source);
});
</script>
