<template>
  <Modal :show="show" @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-bold text-white">
        {{ target?.name || 'Target' }}
      </h2>
    </template>

    <template #body>
      <div class="w-full max-w-md mx-auto">
        <!-- Edit mode - imported lists only -->
        <div v-if="isEditing" class="space-y-3">
          <div>
            <label class="block text-sm text-gray-300 mb-1" for="telescopius-edit-name">
              {{ $t('plugins.telescopius.edit.name') }}
            </label>
            <input
              id="telescopius-edit-name"
              v-model="form.name"
              type="text"
              class="tns-input w-full"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-300 mb-1" for="telescopius-edit-ra">
              {{ $t('plugins.telescopius.edit.ra') }}
            </label>
            <input
              id="telescopius-edit-ra"
              v-model="form.ra"
              type="text"
              inputmode="text"
              class="tns-input w-full"
              placeholder="21h 38' 59&quot;"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-300 mb-1" for="telescopius-edit-dec">
              {{ $t('plugins.telescopius.edit.dec') }}
            </label>
            <input
              id="telescopius-edit-dec"
              v-model="form.dec"
              type="text"
              inputmode="text"
              class="tns-input w-full"
              placeholder="+57° 30' 50&quot;"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-300 mb-1" for="telescopius-edit-rotation">
              {{ $t('plugins.telescopius.edit.rotation') }}
            </label>
            <input
              id="telescopius-edit-rotation"
              v-model="form.rotation"
              type="number"
              step="0.1"
              class="tns-input w-full"
              :placeholder="$t('plugins.telescopius.edit.rotationEmpty')"
            />
          </div>

          <p v-if="editError" class="text-sm text-red-400">{{ editError }}</p>

          <div class="flex flex-col sm:flex-row gap-3 pt-1">
            <button @click="saveEdit" class="flex-1 tns-btn-primary">
              {{ $t('plugins.telescopius.edit.save') }}
            </button>
            <button @click="isEditing = false" class="flex-1 tns-btn-secondary">
              {{ $t('plugins.telescopius.import.cancel') }}
            </button>
          </div>
        </div>

        <div v-else>
          <!-- Target Information -->
          <div v-if="target" class="mb-6 text-center">
            <div v-if="target.familiarName" class="text-sm text-gray-300 mb-1">
              {{ target.familiarName }}
            </div>
            <div v-if="target.type || target.constellation" class="text-sm text-gray-400">
              {{ [target.type, target.constellation].filter(Boolean).join(' • ') }}
            </div>
            <div v-if="Number.isFinite(target.magnitude)" class="text-sm text-gray-400 mb-3">
              {{ $t('plugins.telescopius.targetLists.magnitude') }}:
              {{ target.magnitude.toFixed(2) }}
            </div>

            <div
              v-if="target.notes"
              class="bg-gray-800/50 rounded-lg p-3 border border-gray-600 mb-4"
            >
              <div class="text-sm text-gray-300">{{ target.notes }}</div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-3">
            <!-- Set Sequence Target -->
            <SetSequenceTarget />

            <!-- Go To Framing -->
            <button
              @click="handleGoToFraming"
              class="w-full tns-btn-primary flex items-center justify-center gap-3"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
                />
              </svg>
              Go To Framing
            </button>

            <!-- Slew -->
            <ButtonSlewCenterRotate
              :raAngle="target.coordinates.ra * 15"
              :decAngle="target.coordinates.dec"
              class="w-full"
            />

            <!-- Edit - only offered for imported lists -->
            <button
              v-if="editable"
              @click="startEdit"
              class="w-full tns-btn-secondary flex items-center justify-center gap-3"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              {{ $t('plugins.telescopius.edit.edit') }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Modal from '@/components/helpers/Modal.vue';
import ButtonSlewCenterRotate from '@/components/mount/ButtonSlewCenterRotate.vue';
import SetSequenceTarget from '@/components/framing/setSequenceTarget.vue';
import { useFramingStore } from '@/store/framingStore';
import { degreesToHMS, degreesToDMS } from '@/utils/utils';
import { parseRaHours, parseDecDegrees } from '../utils/csvImport';

const emit = defineEmits(['close', 'goToFraming', 'save']);

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  target: {
    type: Object,
    default: null,
  },
  editable: {
    type: Boolean,
    default: false,
  },
});

const { t: $t } = useI18n();
const framingStore = useFramingStore();
const isEditing = ref(false);
const editError = ref('');
const form = ref({ name: '', ra: '', dec: '', rotation: '' });

const startEdit = () => {
  editError.value = '';
  form.value = {
    name: props.target?.name ?? '',
    ra: degreesToHMS(props.target.coordinates.ra * 15),
    dec: degreesToDMS(props.target.coordinates.dec),
    rotation: Number.isFinite(props.target?.positionAngle)
      ? String(props.target.positionAngle)
      : '',
  };
  isEditing.value = true;
};

const saveEdit = () => {
  // The same tolerant parsers the CSV import uses, so "21h 38' 59"", "21:38:59" and a plain
  // decimal all work here.
  const ra = parseRaHours(form.value.ra);
  const dec = parseDecDegrees(form.value.dec);

  if (ra === null || dec === null) {
    editError.value = $t('plugins.telescopius.edit.invalidCoordinates');
    return;
  }

  const rotationInput = String(form.value.rotation).trim();
  const rotation = rotationInput === '' ? null : Number(rotationInput.replace(',', '.'));
  if (rotation !== null && !Number.isFinite(rotation)) {
    editError.value = $t('plugins.telescopius.edit.invalidRotation');
    return;
  }

  emit('save', {
    name: form.value.name.trim() || props.target.name,
    coordinates: { ra, dec },
    // null clears a previously set angle, so the key is always written.
    positionAngle: rotation === null ? undefined : ((rotation % 360) + 360) % 360,
  });
  isEditing.value = false;
};

// Update framing store when target changes so SetSequenceTarget component works
watch(
  () => props.target,
  (newTarget) => {
    if (newTarget) {
      // Set the target in framing store for SetSequenceTarget component
      framingStore.RAangleString = degreesToHMS(newTarget.coordinates.ra * 15);
      framingStore.DECangleString = degreesToDMS(newTarget.coordinates.dec);
      framingStore.RAangle = newTarget.coordinates.ra * 15;
      framingStore.DECangle = newTarget.coordinates.dec;
      // Reset explicitly - without this the rotation of the previously framed target leaks in.
      framingStore.rotationAngle = Number.isFinite(newTarget.positionAngle)
        ? newTarget.positionAngle
        : 0;
      framingStore.selectedItem = {
        Name: newTarget.name || '',
        RA: newTarget.coordinates.ra * 15,
        Dec: newTarget.coordinates.dec,
      };
    }
  },
  { immediate: true }
);

// Never reopen the dialog straight into edit mode.
watch(
  () => props.show,
  (isShown) => {
    if (!isShown) {
      isEditing.value = false;
      editError.value = '';
    }
  }
);

const handleGoToFraming = () => {
  if (props.target) {
    emit('goToFraming', props.target);
  }
};
</script>
