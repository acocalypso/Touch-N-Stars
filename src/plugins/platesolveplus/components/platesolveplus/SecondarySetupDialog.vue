<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60"></div>

    <!-- Dialog -->
    <div
      class="relative w-full max-w-3xl rounded-xl border border-gray-700 bg-black/80 backdrop-blur shadow-xl"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div>
          <div class="text-white font-semibold">{{ t('plugins.platesolveplus.secondary_setup.title') }}</div>
          <div class="text-xs text-gray-400 mt-0.5">
            {{ t('plugins.platesolveplus.secondary_setup.subtitle') }}
          </div>
        </div>

        <button
          class="px-3 py-1.5 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10"
          @click="$emit('close')"
          :aria-label="t('plugins.platesolveplus.secondary_setup.buttons.close')"
          :title="t('plugins.platesolveplus.secondary_setup.buttons.close')"
        >
          {{ t('plugins.platesolveplus.secondary_setup.buttons.close') }}
        </button>
      </div>

      <div class="p-4 space-y-4">
        <!-- Status pills -->
        <div class="flex flex-wrap gap-2 text-xs">
          <span
            class="px-2 py-1 rounded-full border"
            :class="
              secondary?.connected
                ? 'border-green-500/40 text-green-200 bg-green-500/10'
                : 'border-gray-600 text-gray-300 bg-black/20'
            "
          >
            {{ secondary?.connected ? t('plugins.platesolveplus.secondary_setup.pills.connected') : t('plugins.platesolveplus.secondary_setup.pills.disconnected') }}
          </span>
          <span
            class="px-2 py-1 rounded-full border"
            :class="
              status?.busy
                ? 'border-yellow-500/40 text-yellow-200 bg-yellow-500/10'
                : 'border-gray-600 text-gray-300 bg-black/20'
            "
          >
            {{ status?.busy ? t('plugins.platesolveplus.secondary_setup.pills.busy') : t('plugins.platesolveplus.secondary_setup.pills.idle') }}
          </span>
          <span class="px-2 py-1 rounded-full border border-gray-600 text-gray-300 bg-black/20">
            {{ t('plugins.platesolveplus.secondary_setup.pills.active') }}: <span class="font-mono">{{ secondary?.activeProgId || t('plugins.platesolveplus.common.empty') }}</span>
          </span>
        </div>

        <!-- Driver selection -->
        <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-white font-semibold">{{ t('plugins.platesolveplus.secondary_setup.driver.title') }}</div>
              <div class="mt-1 text-xs text-gray-400">
                Choose the ASCOM driver to use as secondary camera.
              </div>
            </div>

            <div class="flex flex-wrap gap-2 justify-end">
              <button
                class="px-3 py-1.5 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10 disabled:opacity-40 text-sm"
                @click="onRefreshDrivers?.()"
                :disabled="secondary?.loading || status?.busy"
                :title="t('plugins.platesolveplus.secondary_setup.buttons.refresh_title')"
              >
                {{ t('plugins.platesolveplus.secondary_setup.buttons.refresh') }}
              </button>
              <button
                class="px-3 py-1.5 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10 disabled:opacity-40 text-sm"
                @click="onSyncState?.()"
                :disabled="secondary?.loading"
                :title="t('plugins.platesolveplus.secondary_setup.buttons.sync_title')"
              >
                {{ t('plugins.platesolveplus.secondary_setup.buttons.sync') }}
              </button>
            </div>
          </div>

          <div class="mt-3">
            <label class="text-xs text-gray-400">{{ t('plugins.platesolveplus.secondary_setup.driver.title') }}</label>
            <select
              v-model="localSelectedProgId"
              class="mt-1 w-full px-3 py-2 rounded-md bg-black/30 border border-gray-700 text-gray-100"
              :disabled="secondary?.connected || secondary?.loading"
            >
              <option value="" disabled>{{ t('plugins.platesolveplus.secondary_setup.driver.select_placeholder') }}</option>
              <option
                v-for="d in secondary?.drivers || []"
                :key="d.progId || d.ProgId || d.id || d.name || d.Name"
                :value="d.progId || d.ProgId"
              >
                {{ d.name || d.Name || t('plugins.platesolveplus.secondary_setup.driver.fallback_name') }} ({{ d.progId || d.ProgId }})
              </option>
            </select>

            <div class="mt-2 text-xs text-gray-500">
              {{ t('plugins.platesolveplus.secondary_setup.driver.selected') }}:
              <span class="text-gray-200 font-mono">{{ localSelectedProgId || t('plugins.platesolveplus.common.empty') }}</span>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <button
                class="px-4 py-2 rounded-md bg-white text-black font-semibold hover:bg-gray-200 disabled:opacity-40"
                @click="applySelection"
                :disabled="secondary?.connected || !localSelectedProgId || secondary?.loading"
                :title="t('plugins.platesolveplus.secondary_setup.buttons.apply_title')"
              >
                {{ t('plugins.platesolveplus.secondary_setup.buttons.apply') }}
              </button>

              <button
                class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10 disabled:opacity-40"
                @click="connect"
                :disabled="secondary?.connected || !localSelectedProgId || secondary?.loading"
                :title="t('plugins.platesolveplus.secondary_setup.buttons.connect')"
              >
                {{ t('plugins.platesolveplus.secondary_setup.buttons.connect') }}
              </button>

              <button
                class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10 disabled:opacity-40"
                @click="disconnect"
                :disabled="!secondary?.connected || secondary?.loading"
                :title="t('plugins.platesolveplus.secondary_setup.buttons.disconnect')"
              >
                {{ t('plugins.platesolveplus.secondary_setup.buttons.disconnect') }}
              </button>

              <button
                class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10 disabled:opacity-40"
                @click="onOpenNativeSetup?.()"
                :disabled="secondary?.loading || !secondary?.selectedProgId"
                :title="t('plugins.platesolveplus.secondary_setup.buttons.driver_setup_title')"
              >
                {{ t('plugins.platesolveplus.secondary_setup.buttons.driver_setup') }}
              </button>
            </div>

            <div v-if="secondary?.error" class="mt-3 text-xs text-red-300 whitespace-pre-wrap">
              {{ secondary.error }}
            </div>
          </div>
        </div>

        <div class="text-xs text-gray-500">
          {{ t('plugins.platesolveplus.secondary_setup.tip.prefix') }}
          <span class="text-gray-300">{{ t('plugins.platesolveplus.secondary_setup.buttons.sync') }}</span>
          {{ t('plugins.platesolveplus.secondary_setup.tip.suffix') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  secondary: { type: Object, required: true },
  status: { type: Object, required: true },
  onRefreshDrivers: { type: Function, default: null },
  onSyncState: { type: Function, default: null },
  onApplySelection: { type: Function, default: null },
  onConnect: { type: Function, default: null },
  onDisconnect: { type: Function, default: null },
  onOpenNativeSetup: { type: Function, default: null },
});

defineEmits(['close']);

const { t } = useI18n({ useScope: 'global' });

const localSelectedProgId = ref(props.secondary?.selectedProgId || '');

watch(
  () => props.secondary?.selectedProgId,
  (v) => {
    // Keep in sync, but don't overwrite user's selection while they are choosing.
    if (!localSelectedProgId.value) localSelectedProgId.value = v || '';
  },
  { immediate: true }
);

async function applySelection() {
  if (!props.onApplySelection) return;
  // Write the current selection back to the shared secondary state.
  props.secondary.selectedProgId = localSelectedProgId.value;
  await props.onApplySelection();
}

async function connect() {
  if (!props.onConnect) return;
  // Ensure selection is applied before connect.
  if (localSelectedProgId.value && props.secondary.selectedProgId !== localSelectedProgId.value) {
    props.secondary.selectedProgId = localSelectedProgId.value;
    if (props.onApplySelection) await props.onApplySelection();
  }
  await props.onConnect();
}

async function disconnect() {
  if (!props.onDisconnect) return;
  await props.onDisconnect();
}
</script>
