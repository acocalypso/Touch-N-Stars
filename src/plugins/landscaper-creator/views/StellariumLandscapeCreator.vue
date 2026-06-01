<template>
  <div class="container py-4 px-3">
    <div
      v-if="isSubmitting"
      class="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      :aria-label="t('plugins.landscaperCreator.actions.generating')"
    >
      <div
        class="mx-4 w-full max-w-sm rounded-lg border border-gray-700 bg-gray-900 p-5 text-center shadow-xl"
      >
        <div
          class="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-300"
        ></div>
        <p class="text-base font-semibold text-white">
          {{ t('plugins.landscaperCreator.title') }}
        </p>
        <p class="mt-1 text-sm text-gray-300">
          {{ t('plugins.landscaperCreator.actions.generating') }}
        </p>
      </div>
    </div>

    <div class="mx-auto max-w-6xl space-y-4">
      <div class="space-y-1">
        <h5 class="text-2xl font-bold text-white">{{ t('plugins.landscaperCreator.title') }}</h5>
        <p class="text-sm text-gray-400">{{ t('plugins.landscaperCreator.subtitle') }}</p>
      </div>

      <section
        class="rounded-lg border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-4 text-sm text-gray-200"
      >
        <p class="font-semibold text-cyan-300">
          {{ t('plugins.landscaperCreator.instructions.title') }}
        </p>
        <ul class="mt-2 space-y-1 text-gray-300">
          <li>{{ t('plugins.landscaperCreator.instructions.line1') }}</li>
          <li>{{ t('plugins.landscaperCreator.instructions.line2') }}</li>
          <li>{{ t('plugins.landscaperCreator.instructions.line3') }}</li>
          <li>{{ t('plugins.landscaperCreator.instructions.line4') }}</li>
        </ul>
      </section>

      <section class="rounded-lg border border-gray-700 bg-gray-900/70 p-4 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h6 class="text-lg font-semibold text-white">
            {{ t('plugins.landscaperCreator.image.sectionTitle') }}
          </h6>
          <div class="flex items-center gap-2">
            <label
              class="cursor-pointer rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-gray-100 hover:bg-gray-600"
            >
              {{
                hasImage
                  ? t('plugins.landscaperCreator.image.replace')
                  : t('plugins.landscaperCreator.image.select')
              }}
              <input
                ref="fileInputRef"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="hidden"
                @change="onImageSelected"
              />
            </label>

            <button
              v-if="hasImage"
              type="button"
              class="rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"
              @click="clearImage"
            >
              {{ t('plugins.landscaperCreator.image.remove') }}
            </button>
          </div>
        </div>

        <p class="text-xs text-gray-400">{{ t('plugins.landscaperCreator.image.typesHint') }}</p>

        <div v-if="selectedFileInfo" class="grid gap-2 text-sm text-gray-200 md:grid-cols-4">
          <div class="rounded border border-gray-700 bg-gray-800/70 p-2">
            <p class="text-xs text-gray-400">{{ t('plugins.landscaperCreator.image.fileName') }}</p>
            <p class="truncate" :title="selectedFileInfo.name">{{ selectedFileInfo.name }}</p>
          </div>
          <div class="rounded border border-gray-700 bg-gray-800/70 p-2">
            <p class="text-xs text-gray-400">{{ t('plugins.landscaperCreator.image.fileSize') }}</p>
            <p>{{ selectedFileInfo.sizeLabel }}</p>
          </div>
          <div class="rounded border border-gray-700 bg-gray-800/70 p-2">
            <p class="text-xs text-gray-400">
              {{ t('plugins.landscaperCreator.image.dimensions') }}
            </p>
            <p>{{ selectedFileInfo.dimensions }}</p>
          </div>
          <div class="rounded border border-gray-700 bg-gray-800/70 p-2">
            <p class="text-xs text-gray-400">
              {{ t('plugins.landscaperCreator.image.aspectRatio') }}
            </p>
            <p>{{ selectedFileInfo.aspectRatioLabel }}</p>
          </div>
        </div>

        <p
          v-if="aspectRatioWarning"
          class="rounded border border-yellow-700 bg-yellow-900/30 px-3 py-2 text-sm text-yellow-300"
        >
          {{ aspectRatioWarning }}
        </p>
        <p v-if="formErrors.image" class="text-sm text-red-400">{{ formErrors.image }}</p>
        <p v-if="imageError" class="text-sm text-red-400">{{ imageError }}</p>
      </section>

      <section class="rounded-lg border border-gray-700 bg-gray-900/70 p-4 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h6 class="text-lg font-semibold text-white">
            {{ t('plugins.landscaperCreator.preview.sectionTitle') }}
          </h6>
          <p class="text-sm text-gray-300">
            {{ t('plugins.landscaperCreator.preview.currentNorth') }}
            <span class="font-mono text-cyan-300">{{ northOffsetDeg.toFixed(1) }}&deg;</span>
          </p>
        </div>

        <p class="text-sm text-gray-400">{{ t('plugins.landscaperCreator.preview.help') }}</p>

        <div
          ref="previewRef"
          class="relative w-full overflow-hidden rounded-lg border border-gray-700 bg-black/60 touch-none select-none"
          style="aspect-ratio: 2 / 1"
          @pointerdown="onPreviewPointerDown"
          @pointermove="onPreviewPointerMove"
          @pointerup="onPreviewPointerUp"
          @pointercancel="onPreviewPointerCancel"
        >
          <img
            v-if="hasImage"
            :src="imagePreviewUrl"
            :alt="t('plugins.landscaperCreator.preview.imageAlt')"
            class="absolute inset-0 h-full w-full object-fill"
          />

          <div
            v-if="hasImage"
            class="absolute inset-y-0 z-10 w-[2px] bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]"
            :style="{ left: `${northMarkerPercent}%` }"
          >
            <div
              class="absolute -top-1.5 left-1/2 h-0 w-0 -translate-x-1/2 border-l-[5px] border-r-[5px] border-t-0 border-b-[8px] border-l-transparent border-r-transparent border-b-cyan-300"
            ></div>
          </div>

          <template v-if="hasImage">
            <span
              v-for="marker in cardinalMarkers"
              :key="marker.label"
              class="pointer-events-none absolute bottom-1 z-10 -translate-x-1/2 rounded bg-black/55 px-1 py-0.5 text-[10px] text-gray-100"
              :style="{ left: `${marker.positionPercent}%` }"
            >
              {{ marker.label }}
            </span>
          </template>

          <div
            v-else
            class="absolute inset-0 flex items-center justify-center text-sm text-gray-500"
          >
            {{ t('plugins.landscaperCreator.preview.empty') }}
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-gray-100 hover:bg-gray-600"
            @click="setNorthLeftEdge"
          >
            {{ t('plugins.landscaperCreator.preview.quickLeft') }}
          </button>
          <button
            type="button"
            class="rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-gray-100 hover:bg-gray-600"
            @click="setNorthCenter"
          >
            {{ t('plugins.landscaperCreator.preview.quickCenter') }}
          </button>
          <button
            type="button"
            class="rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"
            @click="resetNorth"
          >
            {{ t('plugins.landscaperCreator.preview.quickReset') }}
          </button>
        </div>

        <p class="text-xs text-amber-300/90">
          {{ t('plugins.landscaperCreator.preview.signHint') }}
        </p>
      </section>

      <section class="rounded-lg border border-gray-700 bg-gray-900/70 p-4 space-y-4">
        <h6 class="text-lg font-semibold text-white">
          {{ t('plugins.landscaperCreator.details.sectionTitle') }}
        </h6>

        <form class="space-y-4" @submit.prevent="submitLandscape">
          <div class="grid gap-3 md:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm text-gray-300" for="landscape-name">
                {{ t('plugins.landscaperCreator.fields.name') }}
                <span class="text-red-400">*</span>
              </label>
              <input
                id="landscape-name"
                v-model="landscapeName"
                type="text"
                class="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 outline-none focus:border-cyan-500"
                :placeholder="t('plugins.landscaperCreator.fields.namePlaceholder')"
              />
              <p v-if="formErrors.name" class="mt-1 text-sm text-red-400">{{ formErrors.name }}</p>
            </div>

            <div>
              <label class="mb-1 block text-sm text-gray-300" for="landscape-folder">
                {{ t('plugins.landscaperCreator.fields.folderName') }}
                <span class="text-red-400">*</span>
              </label>
              <input
                id="landscape-folder"
                v-model="folderName"
                type="text"
                class="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 outline-none focus:border-cyan-500"
                :placeholder="t('plugins.landscaperCreator.fields.folderNamePlaceholder')"
                @input="onFolderNameInput"
              />
              <p class="mt-1 text-xs text-gray-500">
                {{ t('plugins.landscaperCreator.folder.autoHint') }}
              </p>
              <p v-if="formErrors.folderName" class="mt-1 text-sm text-red-400">
                {{ formErrors.folderName }}
              </p>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm text-gray-300" for="landscape-description">
              {{ t('plugins.landscaperCreator.fields.description') }}
            </label>
            <textarea
              id="landscape-description"
              v-model="description"
              rows="3"
              class="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 outline-none focus:border-cyan-500"
            ></textarea>
          </div>

          <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label class="mb-1 block text-sm text-gray-300" for="landscape-latitude">
                {{ t('plugins.landscaperCreator.fields.latitude') }}
              </label>
              <input
                id="landscape-latitude"
                v-model="latitude"
                type="text"
                class="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm text-gray-300" for="landscape-longitude">
                {{ t('plugins.landscaperCreator.fields.longitude') }}
              </label>
              <input
                id="landscape-longitude"
                v-model="longitude"
                type="text"
                class="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm text-gray-300" for="landscape-altitude">
                {{ t('plugins.landscaperCreator.fields.altitude') }}
              </label>
              <input
                id="landscape-altitude"
                v-model="altitude"
                type="text"
                class="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm text-gray-300" for="landscape-author">
                {{ t('plugins.landscaperCreator.fields.author') }}
              </label>
              <input
                id="landscape-author"
                v-model="author"
                type="text"
                class="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              :disabled="!canSubmit"
              class="rounded bg-cyan-700 px-4 py-2 font-medium text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{
                isSubmitting
                  ? t('plugins.landscaperCreator.actions.generating')
                  : t('plugins.landscaperCreator.actions.generate')
              }}
            </button>

            <p v-if="submitError" class="text-sm text-red-400">{{ submitError }}</p>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToastStore } from '@/store/toastStore';
import apiService from '@/services/apiService';

const { t } = useI18n();
const toastStore = useToastStore();

const folderNamePattern = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const cardinalMarkers = [
  { label: '0°', positionPercent: 0 },
  { label: '90°', positionPercent: 25 },
  { label: '180°', positionPercent: 50 },
  { label: '270°', positionPercent: 75 },
];

const fileInputRef = ref(null);
const previewRef = ref(null);

const imageFile = ref(null);
const imagePreviewUrl = ref('');
const imageWidth = ref(0);
const imageHeight = ref(0);
const imageError = ref('');

const landscapeName = ref('');
const folderName = ref('');
const folderNameEdited = ref(false);
const description = ref('');
const latitude = ref('');
const longitude = ref('');
const altitude = ref('');
const author = ref('');
const northOffsetDeg = ref(180);

const isSubmitting = ref(false);
const submitError = ref('');
const formErrors = ref({ image: '', name: '', folderName: '' });

const activePointerId = ref(null);
const isDragging = ref(false);

const hasImage = computed(() => Boolean(imagePreviewUrl.value));

const aspectRatio = computed(() => {
  if (!imageWidth.value || !imageHeight.value) return null;
  return imageWidth.value / imageHeight.value;
});

const isApproxAspectRatio = computed(() => {
  if (aspectRatio.value == null) return true;
  return Math.abs(aspectRatio.value - 2) <= 0.1;
});

const aspectRatioWarning = computed(() => {
  if (!hasImage.value || isApproxAspectRatio.value || aspectRatio.value == null) {
    return '';
  }
  return t('plugins.landscaperCreator.image.aspectWarning', {
    ratio: aspectRatio.value.toFixed(2),
  });
});

const selectedFileInfo = computed(() => {
  if (!imageFile.value) return null;
  return {
    name: imageFile.value.name,
    sizeLabel: formatBytes(imageFile.value.size),
    dimensions:
      imageWidth.value && imageHeight.value ? `${imageWidth.value} x ${imageHeight.value}` : '-',
    aspectRatioLabel: aspectRatio.value == null ? '-' : aspectRatio.value.toFixed(2),
  };
});

const northMarkerPercent = computed(() => (northOffsetDeg.value / 360) * 100);

const normalizedFolderName = computed(() => normalizeFolderName(folderName.value));
const isFolderNameSafe = computed(
  () => normalizedFolderName.value.length > 0 && folderNamePattern.test(normalizedFolderName.value)
);

const canSubmit = computed(() => {
  return (
    Boolean(imageFile.value) &&
    landscapeName.value.trim().length > 0 &&
    isFolderNameSafe.value &&
    !isSubmitting.value
  );
});

watch(landscapeName, (newName) => {
  if (folderNameEdited.value) return;
  folderName.value = buildFolderName(newName);
});

onBeforeUnmount(() => {
  revokePreviewUrl();
});

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 1) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function buildFolderName(value) {
  if (!value) return '';
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, ' ')
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/-+/g, '-')
    .replace(/^[_-]+|[_-]+$/g, '');
  return slug.slice(0, 64);
}

function normalizeFolderName(value) {
  return buildFolderName(value);
}

function onFolderNameInput(event) {
  folderNameEdited.value = true;
  folderName.value = normalizeFolderName(event.target.value);
}

function resetFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function revokePreviewUrl() {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value);
    imagePreviewUrl.value = '';
  }
}

function clearImage() {
  imageFile.value = null;
  imageWidth.value = 0;
  imageHeight.value = 0;
  imageError.value = '';
  formErrors.value.image = '';
  revokePreviewUrl();
  resetFileInput();
}

function readImageDimensions(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error('Failed to read image dimensions'));
    };
    img.src = url;
  });
}

async function loadImageFile(file) {
  imageError.value = '';
  formErrors.value.image = '';

  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    clearImage();
    toastStore.showToast({
      type: 'error',
      title: t('plugins.landscaperCreator.toast.errorTitle'),
      message: t('plugins.landscaperCreator.toast.invalidFileType'),
      autoClose: true,
    });
    return;
  }

  revokePreviewUrl();
  const objectUrl = URL.createObjectURL(file);

  try {
    const dimensions = await readImageDimensions(objectUrl);
    imageFile.value = file;
    imagePreviewUrl.value = objectUrl;
    imageWidth.value = dimensions.width;
    imageHeight.value = dimensions.height;
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    imageError.value = t('plugins.landscaperCreator.errors.imageLoadFailed');
  }
}

async function onImageSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  await loadImageFile(file);
}

function roundNorth(value) {
  return Math.round(value * 10) / 10;
}

function setNorthFromClientX(clientX) {
  if (!previewRef.value) return;
  const rect = previewRef.value.getBoundingClientRect();
  if (rect.width <= 0) return;
  const relativeX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
  const degrees = (relativeX / rect.width) * 360;
  northOffsetDeg.value = roundNorth(degrees);
}

function onPreviewPointerDown(event) {
  if (!hasImage.value) return;
  isDragging.value = true;
  activePointerId.value = event.pointerId;
  previewRef.value?.setPointerCapture?.(event.pointerId);
  setNorthFromClientX(event.clientX);
}

function onPreviewPointerMove(event) {
  if (!isDragging.value || activePointerId.value !== event.pointerId) return;
  setNorthFromClientX(event.clientX);
}

function onPreviewPointerUp(event) {
  if (activePointerId.value !== event.pointerId) return;
  setNorthFromClientX(event.clientX);
  isDragging.value = false;
  activePointerId.value = null;
  previewRef.value?.releasePointerCapture?.(event.pointerId);
}

function onPreviewPointerCancel(event) {
  if (activePointerId.value !== event.pointerId) return;
  isDragging.value = false;
  activePointerId.value = null;
  previewRef.value?.releasePointerCapture?.(event.pointerId);
}

function setNorthLeftEdge() {
  northOffsetDeg.value = 0;
}

function setNorthCenter() {
  northOffsetDeg.value = 180;
}

function resetNorth() {
  northOffsetDeg.value = 180;
}

function validateForm() {
  const nextErrors = { image: '', name: '', folderName: '' };

  if (!imageFile.value) {
    nextErrors.image = t('plugins.landscaperCreator.validation.imageRequired');
  }
  if (!landscapeName.value.trim()) {
    nextErrors.name = t('plugins.landscaperCreator.validation.nameRequired');
  }

  const safeFolderName = normalizeFolderName(folderName.value);
  if (!safeFolderName) {
    nextErrors.folderName = t('plugins.landscaperCreator.validation.folderNameRequired');
  } else if (!folderNamePattern.test(safeFolderName)) {
    nextErrors.folderName = t('plugins.landscaperCreator.validation.folderNameInvalid');
  }

  formErrors.value = nextErrors;
  if (nextErrors.image || nextErrors.name || nextErrors.folderName) {
    toastStore.showToast({
      type: 'warning',
      title: t('plugins.landscaperCreator.toast.validationTitle'),
      message: t('plugins.landscaperCreator.validation.fixErrors'),
      autoClose: true,
    });
    return false;
  }

  folderName.value = safeFolderName;
  return true;
}

function appendOptionalField(formData, key, value) {
  const trimmed = String(value ?? '').trim();
  if (trimmed.length > 0) {
    formData.append(key, trimmed);
  }
}

async function parseBackendError(error) {
  if (!error?.response) {
    return error?.message || t('plugins.landscaperCreator.errors.requestFailed');
  }

  const { data, status, statusText } = error.response;
  if (data instanceof Blob) {
    try {
      const rawText = await data.text();
      if (rawText) {
        try {
          const parsed = JSON.parse(rawText);
          return parsed?.message || parsed?.error || rawText;
        } catch {
          return rawText;
        }
      }
    } catch {
      // Ignore parse errors and continue with fallback.
    }
  }

  if (typeof data === 'string' && data.trim()) {
    return data;
  }
  if (data && typeof data === 'object') {
    return data.message || data.error || JSON.stringify(data);
  }

  return (
    `${status ?? ''} ${statusText ?? ''}`.trim() ||
    t('plugins.landscaperCreator.errors.requestFailed')
  );
}

function triggerZipDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1200);
}

async function submitLandscape() {
  submitError.value = '';
  if (!validateForm()) return;

  isSubmitting.value = true;
  const safeFolderName = normalizeFolderName(folderName.value);

  try {
    const formData = new FormData();
    formData.append('image', imageFile.value);
    formData.append('name', landscapeName.value.trim());
    formData.append('folderName', safeFolderName);
    formData.append('northOffsetDeg', northOffsetDeg.value.toString());
    appendOptionalField(formData, 'description', description.value);
    appendOptionalField(formData, 'latitude', latitude.value);
    appendOptionalField(formData, 'longitude', longitude.value);
    appendOptionalField(formData, 'altitude', altitude.value);
    appendOptionalField(formData, 'author', author.value);

    const zipBlob = await apiService.createStellariumLandscape(formData);
    if (!(zipBlob instanceof Blob)) {
      throw new Error(t('plugins.landscaperCreator.errors.requestFailed'));
    }

    const zipFilename = `${safeFolderName}.zip`;
    triggerZipDownload(zipBlob, zipFilename);

    toastStore.showToast({
      type: 'success',
      title: t('plugins.landscaperCreator.toast.successTitle'),
      message: t('plugins.landscaperCreator.toast.successMessage', { filename: zipFilename }),
      autoClose: true,
    });
  } catch (error) {
    submitError.value = await parseBackendError(error);
    toastStore.showToast({
      type: 'error',
      title: t('plugins.landscaperCreator.toast.errorTitle'),
      message: submitError.value,
      autoClose: true,
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>
