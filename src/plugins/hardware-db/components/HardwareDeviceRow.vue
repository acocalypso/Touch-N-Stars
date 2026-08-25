<template>
  <div class="tns-card p-4 flex flex-col gap-3">
    <div class="min-w-0">
      <div class="flex items-center gap-2 min-w-0">
        <p class="text-white font-semibold truncate">
          {{ candidate.name || candidate.driverInfo }}
        </p>
        <span
          v-if="candidate.connected === 'no'"
          class="shrink-0 text-xs px-2 py-0.5 rounded-chip border border-status-warn/40 bg-status-warn/10 text-status-warn"
        >
          {{ $t('plugins.hardwareDb.notConnected') }}
        </span>
      </div>
      <p class="text-sm text-gray-400 truncate">
        {{ $t(`plugins.hardwareDb.categories.${candidate.labelKey || candidate.category}`) }}
        <span v-if="candidate.driverInfo"> · {{ candidate.driverInfo }}</span>
        <span v-if="candidate.driverVersion"> {{ candidate.driverVersion }}</span>
      </p>
      <!-- A disconnected device carries no driver name; say so rather than
           leaving the user wondering what is missing. -->
      <p v-if="candidate.connected === 'no' && !candidate.driverInfo" class="text-xs text-gray-500">
        {{ $t('plugins.hardwareDb.driverUnknown') }}
      </p>
    </div>

    <!-- What the database already knows. Nothing is rendered until the lookup
         has run, so the layout does not jump. -->
    <div
      v-if="knowledgeLoaded && known"
      class="rounded-control border p-3 flex flex-col gap-1"
      :class="knownStyle.box"
    >
      <p class="text-sm" :class="knownStyle.text">
        {{
          $t('plugins.hardwareDb.known.summary', {
            status: $t(`plugins.hardwareDb.status.${known.status}`),
            driver: known.driver,
            reports: known.reportCount,
          })
        }}
      </p>
      <ul
        v-if="known.notes.length"
        class="text-sm text-gray-300 list-disc pl-4 flex flex-col gap-0.5"
      >
        <li v-for="(note, i) in known.notes" :key="i">{{ note }}</li>
      </ul>
    </div>
    <p v-else-if="knowledgeLoaded" class="text-xs text-gray-500">
      {{ $t('plugins.hardwareDb.known.none') }}
    </p>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in statusOptions"
        :key="option.value"
        type="button"
        class="min-h-touch px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
        :class="
          rating.status === option.value
            ? option.activeClass
            : 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
        "
        @click="toggleStatus(option.value)"
      >
        {{ $t(option.label) }}
      </button>
    </div>

    <!-- Hardware identity and the note only appear once a status is picked: an
         empty form on every device looks like homework and suppresses replies. -->
    <div v-if="rating.status" class="flex flex-col gap-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div class="flex flex-col gap-1">
          <label :for="`${fieldId}-vendor`" class="text-xs uppercase font-bold text-gray-400">
            {{ $t('plugins.hardwareDb.vendorLabel') }}
          </label>
          <input
            :id="`${fieldId}-vendor`"
            :value="rating.vendor"
            type="text"
            :list="`${fieldId}-vendors`"
            :maxlength="maxVendorLength"
            class="tns-input min-h-touch"
            :placeholder="$t('plugins.hardwareDb.vendorPlaceholder')"
            @input="emitRating({ vendor: $event.target.value })"
          />
          <!-- Suggestions are additive only: on a PINS access point without
               internet the list is empty and the field stays plain free text. -->
          <datalist :id="`${fieldId}-vendors`">
            <option v-for="vendor in suggestions.vendors" :key="vendor" :value="vendor" />
          </datalist>
        </div>

        <div class="flex flex-col gap-1">
          <label :for="`${fieldId}-model`" class="text-xs uppercase font-bold text-gray-400">
            {{ $t('plugins.hardwareDb.modelLabel') }}{{ modelRequired ? ' *' : '' }}
          </label>
          <input
            :id="`${fieldId}-model`"
            :value="rating.model"
            type="text"
            :list="`${fieldId}-models`"
            :maxlength="maxModelLength"
            class="tns-input min-h-touch"
            :class="{ 'border-red-500': modelMissing }"
            :placeholder="$t('plugins.hardwareDb.modelPlaceholder')"
            @input="emitRating({ model: $event.target.value })"
          />
          <datalist :id="`${fieldId}-models`">
            <option v-for="model in suggestions.models" :key="model" :value="model" />
          </datalist>
        </div>
      </div>

      <!-- A generic driver names the protocol, not the product: without the
           model the report cannot be attributed to any piece of hardware. -->
      <p
        v-if="modelRequired"
        class="text-xs"
        :class="modelMissing ? 'text-red-400' : 'text-gray-500'"
      >
        {{ $t('plugins.hardwareDb.modelRequiredHint') }}
      </p>
      <p v-else class="text-xs text-gray-500">
        {{ $t('plugins.hardwareDb.modelOptionalHint') }}
      </p>

      <label :for="`${fieldId}-note`" class="text-xs uppercase font-bold text-gray-400">
        {{ $t('plugins.hardwareDb.noteLabel') }}
      </label>
      <textarea
        :id="`${fieldId}-note`"
        :value="rating.note"
        rows="2"
        :maxlength="maxNoteLength"
        class="tns-input resize-y"
        :placeholder="$t('plugins.hardwareDb.notePlaceholder')"
        @input="emitRating({ note: $event.target.value })"
      ></textarea>
      <p class="text-xs text-gray-500 self-end">
        {{ (rating.note || '').length }} / {{ maxNoteLength }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  MAX_MODEL_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_VENDOR_LENGTH,
  USER_STATUS,
  isGenericDriver,
} from '../utils/snapshotSerializer';

const props = defineProps({
  candidate: { type: Object, required: true },
  rating: { type: Object, default: () => ({ status: null, note: '', vendor: '', model: '' }) },
  /** Published entry for this device, or null when the database has none. */
  known: { type: Object, default: null },
  knowledgeLoaded: { type: Boolean, default: false },
  /** Vendor/model names already published for this category. May be empty. */
  suggestions: { type: Object, default: () => ({ vendors: [], models: [] }) },
});

const emit = defineEmits(['update:rating']);

const maxNoteLength = MAX_NOTE_LENGTH;
const maxVendorLength = MAX_VENDOR_LENGTH;
const maxModelLength = MAX_MODEL_LENGTH;

// Datalists live in the document, so their ids have to be unique per row.
const fieldId = computed(() => `hw-${props.candidate.id}`);

const modelRequired = computed(() => isGenericDriver(props.candidate));
const modelMissing = computed(
  () => modelRequired.value && !String(props.rating.model || '').trim()
);

const statusOptions = computed(() => [
  {
    value: USER_STATUS.WORKS,
    label: 'plugins.hardwareDb.status.works',
    activeClass: 'border-green-500 bg-green-600/20 text-green-300',
  },
  {
    value: USER_STATUS.CAVEAT,
    label: 'plugins.hardwareDb.status.caveat',
    activeClass: 'border-amber-500 bg-amber-600/20 text-amber-300',
  },
  {
    value: USER_STATUS.BROKEN,
    label: 'plugins.hardwareDb.status.broken',
    activeClass: 'border-red-500 bg-red-600/20 text-red-300',
  },
]);

// Same colour language as the status chips below, so a green box and a green
// chip mean the same thing. Deliberately no effect on the preselected rating:
// nudging the user towards what is already recorded would let the database
// confirm itself.
const knownStyle = computed(() => {
  const styles = {
    works: { box: 'border-status-ok/40 bg-status-ok/10', text: 'text-status-ok' },
    caveat: { box: 'border-status-warn/40 bg-status-warn/10', text: 'text-status-warn' },
    broken: { box: 'border-status-danger/40 bg-status-danger/10', text: 'text-status-danger' },
  };
  return styles[props.known?.status] || styles.works;
});

function emitRating(patch) {
  emit('update:rating', { ...props.rating, ...patch });
}

// Clicking the active chip clears it again, so a misclick can be undone without
// the row turning into something the user cannot opt out of. Clearing the
// status also clears what was typed for it — the row is back to unrated.
function toggleStatus(value) {
  const next = props.rating.status === value ? null : value;
  if (!next) {
    emit('update:rating', { status: null, note: '', vendor: '', model: '' });
    return;
  }
  emitRating({ status: next });
}
</script>
