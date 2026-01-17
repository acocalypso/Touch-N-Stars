<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60"></div>

    <!-- Dialog -->
    <div class="relative w-full max-w-3xl rounded-xl border border-gray-700 bg-black/80 backdrop-blur shadow-xl">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div>
          <div class="text-white font-semibold">Secondary Camera Setup</div>
          <div class="text-xs text-gray-400 mt-0.5">Driver selection, connection and native ASCOM setup dialog</div>
        </div>

        <button
          class="px-3 py-1.5 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10"
          @click="$emit('close')"
          aria-label="Close"
          title="Close"
        >
          Close
        </button>
      </div>

      <div class="p-4 space-y-4">
        <!-- Status pills -->
        <div class="flex flex-wrap gap-2 text-xs">
          <span
            class="px-2 py-1 rounded-full border"
            :class="secondary?.connected ? 'border-green-500/40 text-green-200 bg-green-500/10' : 'border-gray-600 text-gray-300 bg-black/20'"
          >
            {{ secondary?.connected ? 'Connected' : 'Disconnected' }}
          </span>
          <span
            class="px-2 py-1 rounded-full border"
            :class="status?.busy ? 'border-yellow-500/40 text-yellow-200 bg-yellow-500/10' : 'border-gray-600 text-gray-300 bg-black/20'"
          >
            {{ status?.busy ? 'Busy' : 'Idle' }}
          </span>
          <span class="px-2 py-1 rounded-full border border-gray-600 text-gray-300 bg-black/20">
            Active: <span class="font-mono">{{ secondary?.activeProgId || '—' }}</span>
          </span>
        </div>

        <!-- Driver selection -->
        <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-white font-semibold">Driver</div>
              <div class="mt-1 text-xs text-gray-400">Choose the ASCOM driver to use as secondary camera.</div>
            </div>

            <div class="flex flex-wrap gap-2 justify-end">
              <button
                class="px-3 py-1.5 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10 disabled:opacity-40 text-sm"
                @click="onRefreshDrivers?.()"
                :disabled="secondary?.loading || status?.busy"
                title="Refresh driver list"
              >
                Refresh
              </button>
              <button
                class="px-3 py-1.5 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10 disabled:opacity-40 text-sm"
                @click="onSyncState?.()"
                :disabled="secondary?.loading"
                title="Sync current selection/connection"
              >
                Sync
              </button>
            </div>
          </div>

          <div class="mt-3">
            <label class="text-xs text-gray-400">Driver</label>
            <select
              v-model="localSelectedProgId"
              class="mt-1 w-full px-3 py-2 rounded-md bg-black/30 border border-gray-700 text-gray-100"
              :disabled="secondary?.connected || secondary?.loading"
            >
              <option value="" disabled>— select —</option>
              <option
                v-for="d in (secondary?.drivers || [])"
                :key="d.progId || d.ProgId || d.id || d.name || d.Name"
                :value="d.progId || d.ProgId"
              >
                {{ d.name || d.Name || 'Driver' }} ({{ d.progId || d.ProgId }})
              </option>
            </select>

            <div class="mt-2 text-xs text-gray-500">
              Selected:
              <span class="text-gray-200 font-mono">{{ localSelectedProgId || '—' }}</span>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <button
                class="px-4 py-2 rounded-md bg-white text-black font-semibold hover:bg-gray-200 disabled:opacity-40"
                @click="applySelection"
                :disabled="secondary?.connected || !localSelectedProgId || secondary?.loading"
                title="Apply selection"
              >
                Apply
              </button>

              <button
                class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10 disabled:opacity-40"
                @click="connect"
                :disabled="secondary?.connected || !localSelectedProgId || secondary?.loading"
                title="Connect"
              >
                Connect
              </button>

              <button
                class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10 disabled:opacity-40"
                @click="disconnect"
                :disabled="!secondary?.connected || secondary?.loading"
                title="Disconnect"
              >
                Disconnect
              </button>

              <button
                class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10 disabled:opacity-40"
                @click="onOpenNativeSetup?.()"
                :disabled="secondary?.loading || !secondary?.selectedProgId"
                title="Open native ASCOM setup dialog on host"
              >
                Driver Setup...
              </button>
            </div>

            <div v-if="secondary?.error" class="mt-3 text-xs text-red-300 whitespace-pre-wrap">
              {{ secondary.error }}
            </div>
          </div>
        </div>

        <div class="text-xs text-gray-500">
          Tip: If you changed settings in the driver setup dialog, click <span class="text-gray-300">Sync</span> afterwards.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

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
