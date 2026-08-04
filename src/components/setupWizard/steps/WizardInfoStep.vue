<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-xl font-semibold text-content">{{ t('setup.InfoAppsTitel') }}</h2>
      <p class="text-sm text-content-muted mt-1">{{ t('setup.check_wki') }}</p>
    </div>

    <a
      :href="WIKI_URL"
      target="_blank"
      rel="noopener noreferrer"
      class="tns-btn-secondary no-underline"
    >
      <BookOpenIcon class="w-5 h-5" />
      {{ t('components.setupWizard.info.openWiki') }}
    </a>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { BookOpenIcon } from '@heroicons/vue/24/outline';

const { t } = useI18n();

const WIKI_URL = "https://github.com/Touch-N-Stars/Touch-N-Stars/wiki/Touch'N'Stars-Wiki";
</script>
