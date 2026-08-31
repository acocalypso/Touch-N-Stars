<template>
  <Modal :show="show" @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-bold text-white">
        {{ $t('plugins.telescopius.import.title') }}
      </h2>
    </template>

    <template #body>
      <div class="w-full space-y-4">
        <p class="text-sm text-gray-300">
          {{ $t('plugins.telescopius.import.description') }}
        </p>

        <!-- File picker -->
        <label class="tns-btn-secondary flex items-center justify-center gap-2 cursor-pointer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            ></path>
          </svg>
          {{ $t('plugins.telescopius.import.selectFile') }}
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            class="hidden"
            @change="onFileSelected"
          />
        </label>

        <p v-if="fileName" class="text-xs text-gray-400 text-center break-all">{{ fileName }}</p>

        <!-- Errors -->
        <div
          v-if="errorMessage"
          class="p-3 rounded-lg border border-red-700 bg-red-900/30 text-sm text-red-300"
        >
          {{ errorMessage }}
        </div>

        <!-- Warnings for skipped rows -->
        <div
          v-if="warnings.length"
          class="p-3 rounded-lg border border-yellow-600 bg-yellow-900/30 text-sm text-yellow-300"
        >
          <p>
            {{ $t('plugins.telescopius.import.errors.rowsSkipped', { count: warnings.length }) }}
          </p>
          <ul class="mt-1 text-xs list-disc list-inside">
            <li v-for="warning in warnings.slice(0, 5)" :key="warning.line">
              {{ $t('plugins.telescopius.import.errors.rowFailed', { line: warning.line }) }}
              <span v-if="warning.name">— {{ warning.name }}</span>
            </li>
          </ul>
        </div>

        <!-- Preview -->
        <div v-if="targets.length" class="space-y-3">
          <div>
            <label class="block text-sm text-gray-300 mb-1" for="telescopius-import-name">
              {{ $t('plugins.telescopius.import.listName') }}
            </label>
            <input
              id="telescopius-import-name"
              v-model="listName"
              type="text"
              class="tns-input w-full"
            />
          </div>

          <div>
            <p class="text-sm text-gray-300 mb-2">
              {{ $t('plugins.telescopius.import.targetsFound', { count: targets.length }) }}
            </p>
            <div class="border border-gray-700 rounded-lg divide-y divide-gray-700">
              <div
                v-for="(target, index) in targets.slice(0, PREVIEW_LIMIT)"
                :key="index"
                class="p-2 text-xs"
              >
                <div class="text-white">{{ target.name }}</div>
                <div class="text-gray-400">
                  {{ degreesToHMS(target.coordinates.ra * 15) }} /
                  {{ degreesToDMS(target.coordinates.dec) }}
                </div>
              </div>
            </div>
            <p v-if="targets.length > PREVIEW_LIMIT" class="text-xs text-gray-500 mt-1">
              {{
                $t('plugins.telescopius.import.morePreview', {
                  count: targets.length - PREVIEW_LIMIT,
                })
              }}
            </p>
          </div>
        </div>

        <!-- Format help -->
        <div class="border border-gray-700 rounded-lg">
          <button
            @click="showFormatHelp = !showFormatHelp"
            class="w-full flex items-center justify-between p-3 text-sm text-gray-300"
          >
            {{ $t('plugins.telescopius.import.formatHelp.title') }}
            <svg
              class="w-4 h-4 transition-transform"
              :class="{ 'rotate-180': showFormatHelp }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>
          <div v-if="showFormatHelp" class="px-3 pb-3 text-xs text-gray-400 space-y-2">
            <p>{{ $t('plugins.telescopius.import.formatHelp.description') }}</p>
            <p class="font-mono break-all text-gray-500">
              {{ $t('plugins.telescopius.import.formatHelp.columns') }}
            </p>
            <p>{{ $t('plugins.telescopius.import.formatHelp.note') }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="confirmImport"
            :disabled="!targets.length || isSaving"
            class="flex-1 tns-btn-primary disabled:opacity-50"
          >
            {{ $t('plugins.telescopius.import.import') }}
          </button>
          <button @click="$emit('close')" class="flex-1 tns-btn-secondary">
            {{ $t('plugins.telescopius.import.cancel') }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Modal from '@/components/helpers/Modal.vue';
import { degreesToHMS, degreesToDMS } from '@/utils/utils';
import { parseTelescopiusCsv, listNameFromFileName } from '../utils/csvImport';
import { useTelescopisStore } from '../store/telescopiusStore';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const PREVIEW_LIMIT = 10;

const { t: $t } = useI18n();
const telescopiusStore = useTelescopisStore();

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'imported']);

const fileName = ref('');
const listName = ref('');
const targets = ref([]);
const warnings = ref([]);
const errorMessage = ref('');
const showFormatHelp = ref(false);
const isSaving = ref(false);

const reset = () => {
  fileName.value = '';
  listName.value = '';
  targets.value = [];
  warnings.value = [];
  errorMessage.value = '';
  isSaving.value = false;
};

// Start from a clean slate every time the dialog opens.
watch(
  () => props.show,
  (isShown) => {
    if (isShown) reset();
  }
);

const translateParseError = (error) => {
  if (error.startsWith('missingColumns:')) {
    return $t('plugins.telescopius.import.errors.missingColumns', {
      columns: error.slice('missingColumns:'.length),
    });
  }
  if (error === 'noValidRows') return $t('plugins.telescopius.import.errors.noValidRows');
  return $t('plugins.telescopius.import.errors.empty');
};

const onFileSelected = (event) => {
  const input = event.target;
  const file = input.files?.[0];

  reset();
  if (!file) return;

  fileName.value = file.name;

  if (file.size > MAX_FILE_SIZE) {
    errorMessage.value = $t('plugins.telescopius.import.errors.tooLarge');
    input.value = '';
    return;
  }

  const reader = new FileReader();

  reader.onerror = () => {
    errorMessage.value = $t('plugins.telescopius.import.errors.readFailed');
    input.value = '';
  };

  reader.onload = (e) => {
    try {
      const result = parseTelescopiusCsv(String(e.target.result));

      if (result.errors.length > 0) {
        errorMessage.value = translateParseError(result.errors[0]);
      } else {
        targets.value = result.targets;
        listName.value = listNameFromFileName(file.name);
      }
      warnings.value = result.warnings;
    } catch (error) {
      console.error('[Telescopius] CSV parsing failed:', error);
      errorMessage.value = $t('plugins.telescopius.import.errors.readFailed');
    }
    // Allow re-selecting the same file after a fix.
    input.value = '';
  };

  reader.readAsText(file, 'UTF-8');
};

const confirmImport = async () => {
  if (!targets.value.length) return;

  isSaving.value = true;
  const list = {
    id: `csv-${Date.now()}`,
    name: listName.value.trim() || listNameFromFileName(fileName.value),
    source: 'csv',
    importedAt: Date.now(),
    objects: targets.value,
  };

  try {
    await telescopiusStore.addImportedList(list);
    emit('imported', list);
    emit('close');
  } catch (error) {
    console.error('[Telescopius] Failed to save imported list:', error);
    errorMessage.value = $t('plugins.telescopius.import.errors.saveFailed');
  } finally {
    isSaving.value = false;
  }
};
</script>
