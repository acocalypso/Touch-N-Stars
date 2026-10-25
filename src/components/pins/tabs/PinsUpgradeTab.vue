<template>
  <div class="flex flex-col space-y-6">
    <div v-if="availableUpdatePackages.length > 0" class="text-center">
      <button
        @click="showUpdatesModal = true"
        class="text-amber-300 hover:text-amber-200 underline underline-offset-4 transition-colors"
      >
        {{ $t('plugins.pins.updatesAvailable', { count: availableUpdatePackages.length }) }}
      </button>
    </div>

    <PinsUpgradeCard
      :status="status"
      :active-operation="activeOperation"
      :upgrade-exit-code="upgradeExitCode"
      @start-upgrade="startUpgrade"
    />

    <PinsTerminalOutput :logs="terminalLogs" @clear="pinsStore.clearTerminalLogs()" />

    <Modal :show="showUpdatesModal" @close="showUpdatesModal = false" maxWidth="max-w-2xl">
      <template #header>
        <h2 class="text-xl font-bold text-white">
          {{ $t('plugins.pins.updatesModalTitle') }}
        </h2>
      </template>

      <template #body>
        <div class="w-full flex flex-col gap-4">
          <div class="flex items-center justify-between gap-2 text-sm text-gray-400">
            <span>
              {{ $t('plugins.pins.updatesCheckedAt') }}:
              {{
                updatesCheckResult?.checkedAt
                  ? new Date(updatesCheckResult.checkedAt).toLocaleString()
                  : '-'
              }}
            </span>
            <button
              @click="checkUpdates()"
              class="text-blue-400 hover:text-white transition-colors disabled:opacity-50"
              :disabled="isCheckingUpdates"
            >
              {{
                isCheckingUpdates
                  ? $t('plugins.pins.checkingUpdates')
                  : $t('plugins.pins.checkUpdates')
              }}
            </button>
          </div>

          <div
            v-if="availableUpdatePackages.length === 0"
            class="text-gray-300 text-sm py-6 text-center"
          >
            {{ $t('plugins.pins.noUpdatesAvailable') }}
          </div>

          <div v-else class="max-h-80 overflow-y-auto border border-gray-700 rounded-lg">
            <table class="w-full text-left text-sm">
              <thead class="bg-gray-900 text-gray-300 sticky top-0">
                <tr>
                  <th class="px-4 py-3">{{ $t('plugins.pins.updatesPackage') }}</th>
                  <th class="px-4 py-3">{{ $t('plugins.pins.updatesInstalled') }}</th>
                  <th class="px-4 py-3">{{ $t('plugins.pins.updatesLatest') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="pkg in availableUpdatePackages"
                  :key="pkg.name"
                  class="border-t border-gray-700 text-gray-200"
                >
                  <td class="px-4 py-3 font-medium">{{ pkg.name }}</td>
                  <td class="px-4 py-3">{{ pkg.installedVersion || '-' }}</td>
                  <td class="px-4 py-3">{{ pkg.latestVersion || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end">
            <button @click="showUpdatesModal = false" class="tns-btn-secondary">
              {{ $t('common.cancel') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import Modal from '@/components/helpers/Modal.vue';
import PinsUpgradeCard from '../PinsUpgradeCard.vue';
import PinsTerminalOutput from '../PinsTerminalOutput.vue';
import { usePinsJobRunner } from '../composables/usePinsJobRunner';
import { usePinsUpgrade } from '../composables/usePinsUpgrade';
import { usePinsUpdates } from '../composables/usePinsUpdates';

const { t } = useI18n();
const runner = usePinsJobRunner({ t });
const { pinsStore, status, activeOperation } = runner;
const { terminalLogs } = storeToRefs(pinsStore);
const { upgradeExitCode, startUpgrade } = usePinsUpgrade({ t, runner });
const { updatesCheckResult, isCheckingUpdates, availableUpdatePackages, checkUpdates } =
  usePinsUpdates({ t, runner, loadOnPins: true });

const showUpdatesModal = ref(false);
</script>
