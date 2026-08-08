<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-xl font-semibold text-content">{{ t('setup.selectLanguage') }}</h2>
      <p class="text-sm text-content-muted mt-1">
        {{ t('components.setupWizard.language.description') }}
      </p>
    </div>

    <select v-model="selectedLanguage" class="tns-select" @change="applyLanguage">
      <option v-for="lang in availableLanguages" :key="lang.code" :value="lang.code">
        {{ lang.name }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getAvailableLanguages, setLocaleLanguage } from '@/i18n';

const { locale, t } = useI18n();

const availableLanguages = getAvailableLanguages();
const selectedLanguage = ref(locale.value);

// Applied immediately rather than on "Next": the wizard's own labels switch
// language too, so the user sees straight away what they picked.
async function applyLanguage() {
  await setLocaleLanguage(selectedLanguage.value);
}
</script>
