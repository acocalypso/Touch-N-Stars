<template>
  <section
    v-if="store.isPINS"
    :class="
      embedded
        ? 'flex flex-col gap-4'
        : 'p-2 sm:p-4 flex flex-col gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50'
    "
  >
    <div v-if="!embedded">
      <h3 class="font-bold text-base text-cyan-400">
        {{ t('components.settings.localization.title') }}
      </h3>
      <p class="text-sm text-content-muted mt-1">
        {{ t('components.settings.localization.description') }}
      </p>
    </div>

    <p v-if="loading" class="text-sm text-content-muted">
      {{ t('components.settings.localization.loading') }}
    </p>

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="flex flex-col gap-1">
          <span class="text-xs font-semibold uppercase text-content-muted">
            {{ t('components.settings.localization.systemLocale') }}
          </span>
          <input
            v-model.trim="form.locale"
            :list="`${listPrefix}-locales`"
            class="tns-input"
            autocomplete="off"
            :disabled="saving"
          />
          <datalist :id="`${listPrefix}-locales`">
            <option v-for="value in options.locales" :key="value" :value="value" />
          </datalist>
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-xs font-semibold uppercase text-content-muted">
            {{ t('components.settings.localization.wifiCountry') }}
          </span>
          <select v-model="form.wifiCountry" class="tns-select" :disabled="saving">
            <option
              v-for="country in options.wifiCountries"
              :key="country.code"
              :value="country.code"
            >
              {{ country.name }} ({{ country.code }})
            </option>
          </select>
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-xs font-semibold uppercase text-content-muted">
            {{ t('components.settings.localization.timezone') }}
          </span>
          <input
            v-model.trim="form.timezone"
            :list="`${listPrefix}-timezones`"
            class="tns-input"
            autocomplete="off"
            :disabled="saving"
          />
          <datalist :id="`${listPrefix}-timezones`">
            <option v-for="value in options.timezones" :key="value" :value="value" />
          </datalist>
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-xs font-semibold uppercase text-content-muted">
            {{ t('components.settings.localization.keyboardLayout') }}
          </span>
          <input
            v-model.trim="form.keyboardLayout"
            :list="`${listPrefix}-keyboards`"
            class="tns-input"
            autocomplete="off"
            :disabled="saving"
          />
          <datalist :id="`${listPrefix}-keyboards`">
            <option v-for="value in options.keyboardLayouts" :key="value" :value="value" />
          </datalist>
        </label>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button class="tns-btn-primary" :disabled="saving || !isComplete || !isDirty" @click="save">
          {{
            saving
              ? t('components.settings.localization.saving')
              : t('components.settings.localization.save')
          }}
        </button>
        <button class="tns-btn-secondary" :disabled="saving" @click="load">
          {{ t('components.settings.localization.refresh') }}
        </button>
        <span v-if="saved" class="text-sm text-status-ok">
          {{ t('components.settings.localization.saved') }}
        </span>
      </div>
    </template>

    <p v-if="errorMessage" class="text-sm text-status-danger break-words">
      {{ errorMessage }}
    </p>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import apiPinsService from '@/services/apiPinsService';
import { apiStore } from '@/store/store';
import {
  parseJobIdFromResponse,
  pollJobUntilFinished,
} from '@/plugins/pins/composables/pinsJobPolling';

defineProps({
  embedded: { type: Boolean, default: false },
});

const { t } = useI18n();
const store = apiStore();
const listPrefix = `pins-localization-${useId().replaceAll(':', '')}`;
const loading = ref(false);
const saving = ref(false);
const saved = ref(false);
const errorMessage = ref('');
const current = ref(null);
const options = reactive({
  locales: [],
  wifiCountries: [],
  timezones: [],
  keyboardLayouts: [],
});
const form = reactive({
  locale: '',
  wifiCountry: '',
  timezone: '',
  keyboardLayout: '',
});

const isComplete = computed(() => Object.values(form).every((value) => String(value).trim()));
const isDirty = computed(
  () =>
    current.value &&
    Object.keys(form).some((key) => String(form[key]) !== String(current.value[key] || ''))
);

function messageFrom(error) {
  return error?.response?.data?.detail || error?.message || String(error);
}

function setCurrent(status) {
  current.value = status;
  for (const key of Object.keys(form)) form[key] = status?.[key] || '';
}

function includeCurrentOptions() {
  for (const [key, optionKey] of [
    ['locale', 'locales'],
    ['timezone', 'timezones'],
    ['keyboardLayout', 'keyboardLayouts'],
  ]) {
    const value = form[key];
    if (value && !options[optionKey].includes(value)) options[optionKey].unshift(value);
  }
  if (
    form.wifiCountry &&
    !options.wifiCountries.some((country) => country.code === form.wifiCountry)
  ) {
    options.wifiCountries.unshift({ code: form.wifiCountry, name: form.wifiCountry });
  }
}

async function load() {
  if (!store.isPINS || loading.value) return;
  loading.value = true;
  saved.value = false;
  errorMessage.value = '';
  try {
    const [status, available] = await Promise.all([
      apiPinsService.getPinsSystemLocalization(),
      apiPinsService.getPinsSystemLocalizationOptions(),
    ]);
    options.locales = available?.locales || [];
    options.wifiCountries = available?.wifiCountries || [];
    options.timezones = available?.timezones || [];
    options.keyboardLayouts = available?.keyboardLayouts || [];
    setCurrent(status || {});
    includeCurrentOptions();
  } catch (error) {
    console.error('[PinsLocalization] Load failed:', error);
    errorMessage.value = t('components.settings.localization.loadError', {
      message: messageFrom(error),
    });
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!store.isPINS || saving.value || !isComplete.value || !isDirty.value) return;
  saving.value = true;
  saved.value = false;
  errorMessage.value = '';
  try {
    const response = await apiPinsService.updatePinsSystemLocalization({ ...form });
    const jobId = parseJobIdFromResponse(response);
    if (!jobId) throw new Error(t('components.settings.localization.missingJob'));
    const result = await pollJobUntilFinished(jobId);
    if (!result.success) {
      throw new Error(
        result.result?.error || result.result?.stderr || result.result?.status || 'failed'
      );
    }
    await load();
    saved.value = true;
  } catch (error) {
    console.error('[PinsLocalization] Save failed:', error);
    errorMessage.value = t('components.settings.localization.saveError', {
      message: messageFrom(error),
    });
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
