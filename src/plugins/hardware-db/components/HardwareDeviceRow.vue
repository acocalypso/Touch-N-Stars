<template>
  <div class="tns-card p-4 flex flex-col gap-3">
    <div class="min-w-0">
      <p class="text-white font-semibold truncate">{{ candidate.name || candidate.driverInfo }}</p>
      <p class="text-sm text-gray-400 truncate">
        {{ $t(`plugins.hardwareDb.categories.${candidate.category}`) }}
        <span v-if="candidate.driverInfo"> · {{ candidate.driverInfo }}</span>
        <span v-if="candidate.driverVersion"> {{ candidate.driverVersion }}</span>
      </p>
    </div>

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

    <!-- The note only appears once a status is picked: an empty text field on
         every device makes the form look like homework and suppresses replies. -->
    <div v-if="rating.status" class="flex flex-col gap-1">
      <label class="text-xs uppercase font-bold text-gray-400">
        {{ $t('plugins.hardwareDb.noteLabel') }}
      </label>
      <textarea
        :value="rating.note"
        rows="2"
        :maxlength="maxNoteLength"
        class="tns-input resize-y"
        :placeholder="$t('plugins.hardwareDb.notePlaceholder')"
        @input="emitNote($event.target.value)"
      ></textarea>
      <p class="text-xs text-gray-500 self-end">{{ rating.note.length }} / {{ maxNoteLength }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { MAX_NOTE_LENGTH, USER_STATUS } from '../utils/snapshotSerializer';

const props = defineProps({
  candidate: { type: Object, required: true },
  rating: { type: Object, default: () => ({ status: null, note: '' }) },
});

const emit = defineEmits(['update:rating']);

const maxNoteLength = MAX_NOTE_LENGTH;

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

// Clicking the active chip clears it again, so a misclick can be undone without
// the row turning into something the user cannot opt out of.
function toggleStatus(value) {
  const next = props.rating.status === value ? null : value;
  emit('update:rating', { status: next, note: next ? props.rating.note : '' });
}

function emitNote(note) {
  emit('update:rating', { status: props.rating.status, note });
}
</script>
