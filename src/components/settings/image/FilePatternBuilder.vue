<template>
  <div class="flex flex-col gap-3">
    <!-- Pattern Input -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-gray-400">{{ $t('components.settings.imageFile.pattern') }}</label>
      <input
        ref="patternInput"
        v-model="pattern"
        type="text"
        class="default-input w-full py-2 font-mono text-sm"
        :placeholder="defaultPattern"
        @input="onPatternChange"
      />
    </div>

    <!-- Preview -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-gray-400">{{ $t('components.settings.imageFile.preview') }}</label>
      <div
        class="bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 font-mono text-xs text-cyan-300 break-all"
      >
        {{ previewResult }}
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
            @click="insertToken(token.key)"
            class="px-2 py-1 text-xs rounded bg-gray-700/80 hover:bg-gray-600 text-gray-200 border border-gray-600/50 transition-colors"
          >
            {{ token.display }}
          </button>
        </div>
      </div>

      <!-- Separator buttons -->
      <div class="flex flex-wrap gap-1 mt-1">
        <button
          @click="insertText('\\\\')"
          class="px-3 py-1 text-xs rounded bg-amber-900/60 hover:bg-amber-800/60 text-amber-200 border border-amber-700/50 transition-colors font-mono"
        >
          \ {{ $t('components.settings.imageFile.folder') }}
        </button>
        <button
          @click="insertText('_')"
          class="px-3 py-1 text-xs rounded bg-amber-900/60 hover:bg-amber-800/60 text-amber-200 border border-amber-700/50 transition-colors font-mono"
        >
          _ {{ $t('components.settings.imageFile.separator') }}
        </button>
        <button
          @click="insertText('-')"
          class="px-3 py-1 text-xs rounded bg-amber-900/60 hover:bg-amber-800/60 text-amber-200 border border-amber-700/50 transition-colors font-mono"
        >
          - {{ $t('components.settings.imageFile.separator') }}
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
const patternInput = ref(null);
const saving = ref(false);
const saveSuccess = ref(false);

const defaultPattern =
  '$$DATEMINUS12$$\\$$IMAGETYPE$$\\$$DATETIME$$_$$FILTER$$_$$SENSORTEMP$$_$$EXPOSURETIME$$s_$$FRAMENR$$';

const pattern = ref('');

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

// Example values for preview
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

const previewResult = computed(() => {
  if (!pattern.value) return '';
  let result = pattern.value;
  for (const [token, value] of Object.entries(exampleValues)) {
    result = result.replaceAll(token, value);
  }
  return result;
});

function insertToken(token) {
  const input = patternInput.value;
  if (!input) {
    pattern.value += token;
    return;
  }

  const start = input.selectionStart;
  const end = input.selectionEnd;
  const before = pattern.value.substring(0, start);
  const after = pattern.value.substring(end);

  pattern.value = before + token + after;

  // Set cursor after inserted token
  const newPos = start + token.length;
  requestAnimationFrame(() => {
    input.focus();
    input.setSelectionRange(newPos, newPos);
  });
}

function insertText(text) {
  insertToken(text);
}

function onPatternChange() {
  // Pattern is already bound via v-model
}

async function savePattern() {
  saving.value = true;
  saveSuccess.value = false;
  try {
    await apiService.profileChangeValue('ImageFileSettings-FilePattern', pattern.value);
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
  // Load current pattern from profile
  const currentPattern = store.profileInfo.ImageFileSettings.FilePattern;
  console.log('Pattern', currentPattern )
  if (currentPattern) {
    pattern.value = currentPattern;
  } else {
    pattern.value = defaultPattern;
  }
});
</script>
