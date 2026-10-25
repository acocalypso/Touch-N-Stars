<template>
  <div class="tns-card flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <h3 class="text-base font-semibold text-content">{{ L('title') }}</h3>
      <p class="text-sm text-content-muted">{{ L('description') }}</p>
    </div>

    <button class="tns-btn-primary min-h-touch" @click="emit('open-assistant')">
      {{ L('startAssistant') }}
    </button>

    <!-- Setup problems visible before any run -->
    <p v-for="issue in issues" :key="issue" class="flex items-start gap-2 text-sm text-status-warn">
      <span class="tns-dot bg-status-warn mt-1.5 shrink-0"></span>
      <span>{{ L(`issues.${issue}`) }}</span>
    </p>

    <!-- Optics: read-only here, the assistant edits it -->
    <div class="flex flex-col gap-1 rounded-control bg-surface-2 p-3">
      <span class="text-xs font-semibold uppercase text-content-muted">{{ L('optics') }}</span>
      <p class="text-sm text-content">
        {{ L('opticsLine', { focalLength: focalLength || '–', pixelSize: pixelSize || '–' }) }}
      </p>
      <p v-if="scale" class="text-sm text-content-muted">
        {{ L('imageScale', { scale: scale.toFixed(2) }) }}
      </p>
    </div>

    <!-- The sweep: NINA profile values -->
    <div class="flex flex-col gap-3">
      <span class="text-xs font-semibold uppercase text-content-muted">{{ L('sweep') }}</span>
      <SettingInput
        labelKey="components.focuser.hfSimple.exposure"
        helpKey="components.focuser.hfSimple.help.exposure"
        settingKey="FocuserSettings-AutoFocusExposureTime"
        :modelValue="focuser.AutoFocusExposureTime ?? 0"
        :max="9999"
        :step="0.1"
      />
      <SettingInput
        labelKey="components.focuser.hfSimple.stepSize"
        helpKey="components.focuser.hfSimple.help.stepSize"
        settingKey="FocuserSettings-AutoFocusStepSize"
        :modelValue="focuser.AutoFocusStepSize ?? 0"
        :min="1"
        :max="100000"
      />
      <SettingInput
        labelKey="components.focuser.hfSimple.offsetSteps"
        helpKey="components.focuser.hfSimple.help.offsetSteps"
        settingKey="FocuserSettings-AutoFocusInitialOffsetSteps"
        :modelValue="focuser.AutoFocusInitialOffsetSteps ?? 0"
        :min="1"
        :max="10"
      />
    </div>

    <!-- Star detection: Hocus Focus simple-mode presets -->
    <div v-if="sd" class="flex flex-col gap-3">
      <span class="text-xs font-semibold uppercase text-content-muted">{{ L('stars') }}</span>
      <p
        v-if="sd.PersistToProfile === false"
        class="rounded-control border border-status-warn/40 bg-status-warn/10 p-3 text-sm text-content"
      >
        {{ $t('components.focuser.hocus.starDetection.perFilterActive') }}
      </p>
      <p v-if="sd.UseAdvanced" class="text-sm text-content-muted">{{ L('advancedActive') }}</p>
      <template v-else>
        <HfToggleRow
          v-if="sd.HasOptimizedSettings"
          :model-value="sd.UseOptimizedSettings"
          :label="L('useOptimized')"
          :help="L('help.useOptimized')"
          :status="statusOf('UseOptimizedSettings')"
          :error="errorOf('UseOptimizedSettings')"
          @change="saveSd('UseOptimizedSettings', $event)"
        />
        <template v-if="!sd.UseOptimizedSettings">
          <HfSelectField
            :model-value="sd.Simple_PixelScale"
            :label="L('pixelScale')"
            :help="L('help.pixelScale')"
            :options="pixelScaleOptions"
            :status="statusOf('Simple_PixelScale')"
            :error="errorOf('Simple_PixelScale')"
            @change="saveSd('Simple_PixelScale', $event)"
          />
          <button
            v-if="suggestedPreset && suggestedPreset !== sd.Simple_PixelScale"
            class="tns-btn-secondary min-h-touch"
            @click="saveSd('Simple_PixelScale', suggestedPreset)"
          >
            {{ L('usePixelScaleSuggestion', { preset: presetLabel(suggestedPreset) }) }}
          </button>
          <HfSelectField
            :model-value="sd.Simple_NoiseLevel"
            :label="L('noiseLevel')"
            :help="L('help.noiseLevel')"
            :options="noiseLevelOptions"
            :status="statusOf('Simple_NoiseLevel')"
            :error="errorOf('Simple_NoiseLevel')"
            @change="saveSd('Simple_NoiseLevel', $event)"
          />
          <HfToggleRow
            :model-value="sd.Simple_FocusRange === 'WideRange'"
            :label="L('wideRange')"
            :help="L('help.wideRange')"
            :status="statusOf('Simple_FocusRange')"
            :error="errorOf('Simple_FocusRange')"
            @change="saveSd('Simple_FocusRange', $event ? 'WideRange' : 'Typical')"
          />
        </template>
      </template>
    </div>

    <!-- Saved runs feed the optimizer and the field analysis -->
    <div v-if="af" class="flex flex-col gap-3">
      <span class="text-xs font-semibold uppercase text-content-muted">{{ L('runs') }}</span>
      <HfToggleRow
        :model-value="af.Save"
        :label="L('saveRuns')"
        :help="L('help.saveRuns')"
        :status="statusOf('Save')"
        :error="errorOf('Save')"
        @change="saveAf('Save', $event)"
      />
      <DirectoryBrowser
        v-if="af.Save"
        :model-value="af.SavePath"
        :label="L('savePath')"
        @update:model-value="saveAf('SavePath', $event)"
      />
      <p v-if="errorOf('SavePath')" class="text-xs text-status-danger">
        {{ errorOf('SavePath') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiStore } from '@/store/store';
import { useHocusFocusStore } from '@/store/hocusFocusStore';
import { checkPrerequisites, imageScale, suggestPixelScalePreset } from '@/utils/hocusFocusAdvisor';
import SettingInput from '@/components/helpers/settings/UpdatePorfileNumber.vue';
import HfSelectField from './fields/HfSelectField.vue';
import HfToggleRow from './fields/HfToggleRow.vue';
import DirectoryBrowser from './DirectoryBrowser.vue';

const emit = defineEmits(['open-assistant']);

const { t } = useI18n();
const L = (key, params) => t(`components.focuser.hfSimple.${key}`, params || {});
const store = apiStore();
const hfStore = useHocusFocusStore();

// Preset values are the backend enum names; labels are plain-language translations.
const PIXEL_SCALE_PRESETS = ['WideField', 'Typical', 'LongFocalLength'];
const NOISE_LEVEL_PRESETS = ['None', 'Low', 'Typical', 'High'];
const presetLabel = (preset) => L(`presets.pixelScale.${preset}`);
const pixelScaleOptions = computed(() =>
  PIXEL_SCALE_PRESETS.map((value) => ({ value, label: presetLabel(value) }))
);
const noiseLevelOptions = computed(() =>
  NOISE_LEVEL_PRESETS.map((value) => ({ value, label: L(`presets.noiseLevel.${value}`) }))
);

const sd = computed(() => hfStore.starDetectionOptions);
const af = computed(() => hfStore.autoFocusOptions);
const focuser = computed(() => store.profileInfo?.FocuserSettings || {});
const focalLength = computed(() => store.profileInfo?.TelescopeSettings?.FocalLength);
const pixelSize = computed(() => store.profileInfo?.CameraSettings?.PixelSize);
const scale = computed(() =>
  imageScale(focalLength.value, pixelSize.value, focuser.value.AutoFocusBinning)
);
const suggestedPreset = computed(() => suggestPixelScalePreset(scale.value));
const issues = computed(() => checkPrerequisites(store.profileInfo, sd.value, af.value));

// --- Saving: selects and toggles commit once, so no debouncing is needed ---------------------
const optionStatus = ref({});
const optionErrors = ref({});
const statusOf = (key) => optionStatus.value[key] || '';
const errorOf = (key) => optionErrors.value[key] || '';

async function push(key, write) {
  optionStatus.value = { ...optionStatus.value, [key]: 'saving' };
  optionErrors.value = { ...optionErrors.value, [key]: '' };
  try {
    await write();
    optionStatus.value = { ...optionStatus.value, [key]: 'saved' };
    setTimeout(() => {
      optionStatus.value = { ...optionStatus.value, [key]: '' };
    }, 1000);
  } catch (err) {
    console.error(`[HfSimpleSettings] Error saving ${key}:`, err);
    // A rejected value comes back as HTTP 400 with the plugin's own validation message.
    const detail = err.response?.data?.error || err.response?.data?.Error || err.message;
    optionStatus.value = { ...optionStatus.value, [key]: 'error' };
    optionErrors.value = { ...optionErrors.value, [key]: detail || L('saveFailed') };
  }
}

const saveSd = (key, value) => push(key, () => hfStore.setStarDetectionOption(key, value));
const saveAf = (key, value) => push(key, () => hfStore.setAutoFocusOption(key, value));

onMounted(async () => {
  try {
    await Promise.all([hfStore.loadStarDetectionOptions(), hfStore.loadAutoFocusOptions()]);
  } catch (err) {
    console.error('[HfSimpleSettings] Error loading Hocus Focus options:', err);
  }
});
</script>
