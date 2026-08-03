<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-xl font-semibold text-content">
        {{ t('components.pinsWizard.telescope.title') }}
      </h2>
      <p class="text-sm text-content-muted mt-1">
        {{ t('components.pinsWizard.telescope.description') }}
      </p>
    </div>

    <label class="flex flex-col gap-1">
      <span class="text-xs font-semibold uppercase text-content-muted">
        {{ t('components.settings.telescope.name') }}
      </span>
      <input
        v-model="telescopeName"
        type="text"
        class="tns-input"
        :class="nameStatusClass"
        :placeholder="t('components.pinsWizard.telescope.namePlaceholder')"
        @change="updateTelescopeName"
      />
    </label>

    <NumberInputPicker
      v-model="focalLength"
      :label="t('components.camera.chip_settings.focal_length')"
      labelKey="components.camera.chip_settings.focal_length"
      :min="10"
      :max="5000"
      :step="1"
      :decimalPlaces="0"
      inputId="wizard-focal-length"
      @change="updateFocalLength"
    />

    <NumberInputPicker
      v-model="focalRatio"
      :label="t('components.settings.telescope.focal_ratio')"
      labelKey="components.settings.telescope.focal_ratio"
      :min="1"
      :max="50"
      :step="0.1"
      :decimalPlaces="1"
      inputId="wizard-focal-ratio"
      @change="updateFocalRatio"
    />

    <p class="text-xs text-content-faint">
      {{ t('components.pinsWizard.telescope.hint') }}
    </p>

    <p v-if="errorMessage" class="text-sm text-status-danger break-words">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const emit = defineEmits(['completed']);
const { t } = useI18n();
const store = apiStore();

const FOCAL_LENGTH_FALLBACK = 500;
const FOCAL_RATIO_FALLBACK = 5.0;

const telescopeName = ref('');
const focalLength = ref(FOCAL_LENGTH_FALLBACK);
const focalRatio = ref(FOCAL_RATIO_FALLBACK);
const nameStatusClass = ref('');
const errorMessage = ref('');
const touchedFields = ref(new Set());

// settingsTelescope.vue seeds from the profile in onMounted only and keeps showing
// its defaults when the 2s poll delivers late. Watch instead, but never overwrite
// a field the user already edited.
watch(
  () => store.profileInfo?.TelescopeSettings,
  (settings) => {
    if (!settings) return;
    if (!touchedFields.value.has('name')) {
      telescopeName.value = settings.Name ?? '';
    }
    if (!touchedFields.value.has('focalLength')) {
      focalLength.value = settings.FocalLength || FOCAL_LENGTH_FALLBACK;
    }
    if (!touchedFields.value.has('focalRatio')) {
      focalRatio.value = settings.FocalRatio || FOCAL_RATIO_FALLBACK;
    }
  },
  { immediate: true, deep: true }
);

watch(
  () => store.profileInfo?.TelescopeSettings?.FocalLength,
  (value) => {
    if (value > 0) emit('completed');
  },
  { immediate: true }
);

async function writeProfileValue(field, settingPath, value) {
  touchedFields.value.add(field);
  errorMessage.value = '';
  try {
    await apiService.profileChangeValue(settingPath, value);
    return true;
  } catch (error) {
    console.error('[PinsWizard] Telescope setting failed:', error);
    errorMessage.value = t('components.pinsWizard.telescope.saveFailed', {
      message: error.message,
    });
    return false;
  }
}

async function updateTelescopeName() {
  const ok = await writeProfileValue('name', 'TelescopeSettings-Name', telescopeName.value);
  nameStatusClass.value = ok ? 'glow-green' : 'glow-red';
  setTimeout(() => {
    nameStatusClass.value = '';
  }, 2000);
}

function updateFocalLength() {
  return writeProfileValue('focalLength', 'TelescopeSettings-FocalLength', focalLength.value);
}

function updateFocalRatio() {
  return writeProfileValue('focalRatio', 'TelescopeSettings-FocalRatio', focalRatio.value);
}
</script>
