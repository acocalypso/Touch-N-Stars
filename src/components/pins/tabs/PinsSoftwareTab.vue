<template>
  <div class="flex flex-col space-y-6">
    <PinsRepositoryCard
      :repository="repository"
      :loading="repositoryLoading"
      :switching="repositorySwitching"
      :error="repositoryError"
      :disabled="isBusy"
      @switch="switchRepository"
      @refresh="loadRepository"
    />
    <PinsPluginsCard
      :plugins="ninaPackages"
      :loading="isNinaPackagesLoading"
      :checked-at="ninaPackagesCheckedAt"
      :busy-package="busyPackage"
      :disabled="isBusy"
      @refresh="loadNinaPackages"
      @install="installPackage"
      @uninstall="uninstallPackage"
    />
  </div>
</template>

<script setup>
import { watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiStore } from '@/store/store';
import PinsPluginsCard from '../PinsPluginsCard.vue';
import PinsRepositoryCard from '../PinsRepositoryCard.vue';
import { usePinsJobRunner } from '../composables/usePinsJobRunner';
import { usePinsRepository } from '../composables/usePinsRepository';
import { usePinsPackages } from '../composables/usePinsPackages';
import { usePinsUpdates } from '../composables/usePinsUpdates';

const { t } = useI18n();
const store = apiStore();
const runner = usePinsJobRunner({ t });
const { isBusy } = runner;

const {
  ninaPackages,
  isNinaPackagesLoading,
  ninaPackagesCheckedAt,
  busyPackage,
  loadNinaPackages,
  installPackage,
  uninstallPackage,
} = usePinsPackages({ t, runner });
// A repository switch changes which updates are pending; the Upgrade tab shows them.
const { checkUpdates } = usePinsUpdates({ t, runner });

const {
  repository,
  repositoryLoading,
  repositorySwitching,
  repositoryError,
  loadRepository,
  switchRepository,
} = usePinsRepository({
  t,
  status: runner.status,
  pinsStore: runner.pinsStore,
  appendLog: runner.appendLog,
  refreshPackages: () => Promise.all([checkUpdates(), loadNinaPackages()]),
});

watch(
  () => store.isPINS,
  (isPins) => {
    if (isPins) loadRepository();
  },
  { immediate: true }
);
</script>
