<template>
  <div class="container py-4 sm:py-8 px-3 sm:px-4">
    <div class="mx-auto max-w-6xl">
      <div class="mb-4 flex flex-col gap-2">
        <h1 class="text-xl sm:text-2xl font-bold text-white">
          {{ $t('plugins.filebrowser.title') }}
        </h1>
        <p class="text-sm text-gray-400">
          {{ $t('plugins.filebrowser.subtitle') }}
        </p>
      </div>

      <div class="rounded-xl border border-gray-700 bg-gray-900/70 overflow-hidden">
        <div class="border-b border-gray-700 p-3 sm:p-4 flex flex-col gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <div
              class="flex-1 overflow-x-auto scrollbar-thin px-3 py-2 rounded-lg border border-gray-600/50 bg-gray-800/40 min-w-0"
            >
              <span
                class="text-sm font-mono whitespace-nowrap"
                :class="currentPath ? 'text-gray-200' : 'text-gray-500 italic'"
              >
                {{ currentPath || $t('components.settings.imageSavePath.placeholder') }}
              </span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              class="h-9 px-3 rounded-md border border-gray-600 bg-gray-800 text-sm text-gray-100 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="jumpToImageSavePath"
            >
              {{ $t('plugins.filebrowser.jumpToImagePath') }}
            </button>
            <button
              class="h-9 px-3 rounded-md border border-gray-600 bg-gray-800 text-sm text-gray-100 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="!canGoUp || isLoading"
              @click="goUp"
            >
              {{ $t('plugins.filebrowser.goUp') }}
            </button>
            <button
              class="h-9 px-3 rounded-md border border-gray-600 bg-gray-800 text-sm text-gray-100 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="isLoading"
              @click="refreshCurrent"
            >
              {{ $t('plugins.filebrowser.refresh') }}
            </button>
            <label class="ml-auto flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                v-model="showImagesOnly"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-500"
              />
              <span>{{ $t('plugins.filebrowser.imagesOnly') }}</span>
            </label>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="px-2 py-1 rounded bg-gray-800 text-gray-300">
              {{ $t('plugins.filebrowser.directoriesCount', { count: directories.length }) }}
            </span>
            <span class="px-2 py-1 rounded bg-gray-800 text-gray-300">
              {{ $t('plugins.filebrowser.filesCount', { count: filteredFiles.length }) }}
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <input
              v-model="newFolderName"
              class="w-full sm:w-80 rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-cyan-600"
              :placeholder="$t('plugins.filebrowser.newFolderPlaceholder')"
              @keydown.enter="createDirectory"
            />
            <button
              class="h-9 px-3 rounded-md border border-cyan-700 bg-cyan-900/40 text-sm text-cyan-100 hover:bg-cyan-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="isLoading || !newFolderName.trim()"
              @click="createDirectory"
            >
              {{ $t('plugins.filebrowser.createFolder') }}
            </button>
          </div>

          <div
            v-if="breadcrumbs.length"
            class="flex flex-wrap items-center gap-1 text-xs sm:text-sm"
          >
            <button
              v-for="(crumb, idx) in breadcrumbs"
              :key="crumb.path"
              class="rounded px-2 py-1 transition-colors"
              :class="
                idx === breadcrumbs.length - 1
                  ? 'bg-gray-700 text-gray-100 cursor-default'
                  : 'text-cyan-300 hover:bg-gray-800'
              "
              :disabled="idx === breadcrumbs.length - 1"
              @click="browse(crumb.path)"
            >
              {{ crumb.label }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] min-h-[460px]">
          <div class="border-r border-gray-700">
            <div
              v-if="isLoading"
              class="h-full min-h-[260px] flex items-center justify-center text-gray-400"
            >
              {{ $t('plugins.filebrowser.loading') }}
            </div>

            <div
              v-else-if="errorMessage"
              class="h-full min-h-[260px] flex items-center justify-center px-4 text-center text-red-400"
            >
              {{ errorMessage }}
            </div>

            <div
              v-else-if="!directories.length && !filteredFiles.length"
              class="h-full min-h-[260px] flex items-center justify-center text-gray-500"
            >
              {{ $t('plugins.filebrowser.empty') }}
            </div>

            <ul v-else class="divide-y divide-gray-800">
              <li
                v-for="dir in directories"
                :key="dir.path"
                class="group flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 sm:px-4 py-2 hover:bg-gray-800/60"
                :class="selectedPath === dir.path ? 'bg-cyan-900/15' : ''"
              >
                <button
                  class="flex w-full sm:w-auto min-w-0 sm:flex-1 items-center gap-3 text-left"
                  @click="openDirectory(dir)"
                >
                  <svg
                    class="h-4 w-4 text-amber-400 shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
                    />
                  </svg>
                  <span class="truncate text-sm text-gray-100">{{ dir.name }}</span>
                </button>

                <div class="ml-auto flex w-full sm:w-auto justify-end items-center gap-2">
                  <button
                    class="h-8 w-8 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors flex items-center justify-center"
                    :title="$t('common.edit')"
                    @click="openRenameDialog(dir, 'directory')"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                  <button
                    class="h-8 w-8 rounded-md border border-red-800 text-red-300 hover:bg-red-900/30 transition-colors flex items-center justify-center"
                    @click="deleteDirectory(dir)"
                    :title="$t('common.delete')"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </li>

              <li
                v-for="file in filteredFiles"
                :key="file.path"
                class="group flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 sm:px-4 py-2 hover:bg-gray-800/60"
                :class="selectedPath === file.path ? 'bg-cyan-900/15' : ''"
              >
                <button
                  class="flex w-full sm:w-auto min-w-0 sm:flex-1 items-center gap-3 text-left"
                  @click="selectFile(file)"
                >
                  <svg
                    class="h-4 w-4 text-slate-400 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span class="truncate text-sm text-gray-100">{{ file.name }}</span>
                </button>

                <div class="ml-auto flex w-full sm:w-auto justify-end items-center gap-2">
                  <span class="hidden sm:inline text-xs text-gray-500">{{
                    formatSize(file.size)
                  }}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 uppercase">
                    {{ getFileExtension(file.name) || 'file' }}
                  </span>
                  <button
                    class="h-8 w-8 rounded-md border border-cyan-700 text-cyan-300 hover:bg-cyan-900/20 transition-colors flex items-center justify-center"
                    :title="$t('plugins.filebrowser.openFolder')"
                    @click="openFile(file)"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M15 3h6v6" />
                      <path d="M10 14 21 3" />
                      <path d="M21 14v7h-7" />
                      <path d="M3 10v11h11" />
                    </svg>
                  </button>
                  <button
                    class="h-8 w-8 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors flex items-center justify-center"
                    :title="$t('common.edit')"
                    @click="openRenameDialog(file, 'file')"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                  <button
                    class="h-8 w-8 rounded-md border border-red-800 text-red-300 hover:bg-red-900/30 transition-colors flex items-center justify-center"
                    @click="deleteFile(file)"
                    :title="$t('common.delete')"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <div class="p-4 flex flex-col gap-4 bg-gray-900/40">
            <h3 class="text-sm font-semibold text-gray-200">
              {{ $t('plugins.filebrowser.details') }}
            </h3>

            <div
              v-if="selectedEntry"
              class="rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm"
            >
              <p class="text-gray-300 break-all font-medium">{{ selectedEntry.name }}</p>
              <p class="text-xs text-gray-500 mt-1 break-all">{{ selectedEntry.path }}</p>

              <div class="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-400">
                <div>
                  <span class="text-gray-500">{{ $t('plugins.filebrowser.type') }}:</span>
                  <span class="ml-2 text-gray-300">{{ selectedEntryTypeLabel }}</span>
                </div>
                <div v-if="selectedEntryType === 'file'">
                  <span class="text-gray-500">{{ $t('plugins.filebrowser.size') }}:</span>
                  <span class="ml-2 text-gray-300">{{ formatSize(selectedEntry.size) }}</span>
                </div>
                <div v-if="selectedEntryType === 'file'">
                  <span class="text-gray-500">{{ $t('plugins.filebrowser.modified') }}:</span>
                  <span class="ml-2 text-gray-300">{{
                    formatDateTime(selectedEntry.lastModified)
                  }}</span>
                </div>
                <div v-if="selectedEntryType === 'file'">
                  <span class="text-gray-500">{{ $t('plugins.filebrowser.isImage') }}:</span>
                  <span
                    class="ml-2"
                    :class="isSelectedEntryImage ? 'text-green-400' : 'text-gray-300'"
                  >
                    {{ isSelectedEntryImage ? $t('general.yes') : $t('general.no') }}
                  </span>
                </div>
              </div>
            </div>

            <div
              v-else
              class="rounded-lg border border-dashed border-gray-700 p-4 text-sm text-gray-500"
            >
              {{ $t('plugins.filebrowser.selectEntryHint') }}
            </div>

            <div v-if="selectedEntry" class="rounded-lg border border-gray-700 bg-gray-800/30 p-3">
              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-if="selectedEntryType === 'file'"
                  class="h-9 px-3 rounded-md border border-cyan-700 text-cyan-300 hover:bg-cyan-900/20 transition-colors text-xs"
                  @click="openFile(selectedEntry)"
                >
                  {{ $t('plugins.filebrowser.openFolder') }}
                </button>
                <button
                  class="h-9 px-3 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors text-xs"
                  @click="openRenameDialog(selectedEntry, selectedEntryType)"
                >
                  {{ $t('common.edit') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="previewVisible"
        class="fixed inset-0 z-top bg-black/75 backdrop-blur-sm p-4 flex items-center justify-center"
        @click.self="closePreview"
      >
        <div
          class="w-full max-w-5xl max-h-[92vh] bg-[#1a1f2e] border border-[#2e3650] rounded-lg overflow-hidden shadow-xl"
        >
          <div class="flex items-center justify-between px-4 py-3 border-b border-[#2e3650]">
            <p class="text-sm font-semibold text-slate-200 truncate pr-4">{{ previewFileName }}</p>
            <button
              class="text-slate-500 text-sm px-2 py-1 rounded hover:text-slate-200 hover:bg-[#2e3650] transition-colors"
              @click="closePreview"
            >
              ✕
            </button>
          </div>
          <div class="p-3 bg-[#0f1420] max-h-[calc(92vh-56px)] overflow-auto">
            <div
              v-if="previewLoading"
              class="min-h-[300px] flex items-center justify-center text-sm text-slate-400"
            >
              {{ $t('plugins.filebrowser.loading') }}
            </div>

            <div
              v-else-if="previewError"
              class="min-h-[300px] flex items-center justify-center text-sm text-red-400 text-center px-4"
            >
              {{ previewError }}
            </div>

            <img
              v-else-if="previewMode === 'image'"
              :src="previewUrl"
              :alt="previewFileName"
              class="mx-auto max-w-full max-h-[calc(92vh-92px)] object-contain"
              @error="handlePreviewError"
            />

            <canvas
              v-else
              ref="fitsCanvasRef"
              class="mx-auto max-w-full max-h-[calc(92vh-92px)] object-contain"
              style="image-rendering: auto"
            />

            <div
              v-if="previewMode === 'fits' && !previewLoading && !previewError && fitsStats"
              class="mt-3 rounded-md border border-[#2e3650] bg-[#111827] p-3 text-xs text-slate-300"
            >
              <div class="text-[11px] uppercase tracking-wide text-slate-400 mb-2">FITS Debug</div>
              <div class="mb-3 rounded border border-[#2e3650] bg-[#0b1220] p-2">
                <div class="grid grid-cols-1 md:grid-cols-[150px_1fr_auto] gap-2 items-center">
                  <label class="text-slate-400">Pre-stretch</label>
                  <select
                    v-model="fitsStretchMode"
                    class="h-8 rounded border border-gray-600 bg-gray-800 px-2 text-xs text-slate-100"
                  >
                    <option value="linear">Linear</option>
                    <option value="sqrt">Sqrt</option>
                    <option value="log">Log</option>
                    <option value="asinh">Asinh</option>
                  </select>
                  <span class="text-slate-500">mode</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-[150px_1fr_auto] gap-2 items-center mt-2">
                  <label class="text-slate-400">Stretch strength</label>
                  <input
                    v-model.number="fitsStretchStrength"
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    class="w-full"
                  />
                  <span class="text-slate-300 min-w-[40px] text-right">
                    {{ fitsStretchStrength.toFixed(1) }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <span class="text-slate-500">Pattern:</span>
                  {{ fitsStats.bayerPattern || 'none' }}
                </div>
                <div><span class="text-slate-500">BITPIX:</span> {{ fitsStats.bitpix }}</div>
                <div>
                  <span class="text-slate-500">Size:</span> {{ fitsStats.width }} x
                  {{ fitsStats.height }}
                </div>
                <div>
                  <span class="text-slate-500">Stretch:</span> {{ fitsStats.low.toFixed(2) }}..{{
                    fitsStats.high.toFixed(2)
                  }}
                </div>
                <div>
                  <span class="text-slate-500">Clip base:</span>
                  {{ fitsStats.clippedLow.toFixed(2) }}..{{ fitsStats.clippedHigh.toFixed(2) }}
                </div>
                <div><span class="text-slate-500">Min:</span> {{ fitsStats.min.toFixed(2) }}</div>
                <div><span class="text-slate-500">Max:</span> {{ fitsStats.max.toFixed(2) }}</div>
                <div><span class="text-slate-500">Mean:</span> {{ fitsStats.mean.toFixed(2) }}</div>
                <div><span class="text-slate-500">Std:</span> {{ fitsStats.std.toFixed(2) }}</div>
                <div><span class="text-slate-500">Mode:</span> {{ fitsStats.stretchMode }}</div>
                <div>
                  <span class="text-slate-500">Strength:</span>
                  {{ fitsStats.stretchStrength.toFixed(1) }}
                </div>
                <div>
                  <span class="text-slate-500">Prep:</span> {{ fitsPerf.prepareMs.toFixed(1) }} ms
                </div>
                <div>
                  <span class="text-slate-500">Parse:</span> {{ fitsPerf.parseMs.toFixed(1) }} ms
                </div>
                <div>
                  <span class="text-slate-500">Decode:</span> {{ fitsPerf.decodeMs.toFixed(1) }} ms
                </div>
                <div>
                  <span class="text-slate-500">Debayer:</span>
                  {{ fitsPerf.demosaicMs.toFixed(1) }} ms
                </div>
                <div>
                  <span class="text-slate-500">Render:</span> {{ fitsPerf.renderMs.toFixed(1) }} ms
                </div>
                <div><span class="text-slate-500">Renders:</span> {{ fitsPerf.renderCount }}</div>
                <div><span class="text-slate-500">Queued:</span> {{ fitsPerf.queueSkips }}</div>
                <div><span class="text-slate-500">Reason:</span> {{ fitsPerf.lastReason }}</div>
                <div>
                  <span class="text-slate-500">Curve 10/50/90:</span>
                  {{
                    `${fitsStats.curveSamples.p10.toFixed(3)}/${fitsStats.curveSamples.p50.toFixed(3)}/${fitsStats.curveSamples.p90.toFixed(3)}`
                  }}
                </div>
              </div>

              <details v-if="fitsHeaderEntries.length" class="mt-3">
                <summary class="cursor-pointer text-slate-300 hover:text-white">
                  Header (top keys)
                </summary>
                <div
                  class="mt-2 max-h-48 overflow-auto rounded border border-[#2e3650] bg-[#0b1220]"
                >
                  <div
                    v-for="entry in fitsHeaderEntries"
                    :key="entry.key"
                    class="grid grid-cols-[120px_1fr] gap-2 px-2 py-1 border-b border-[#1f2937] last:border-b-0"
                  >
                    <span class="text-slate-400">{{ entry.key }}</span>
                    <span class="text-slate-200 break-all">{{ entry.value }}</span>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="renameDialogVisible"
        class="fixed inset-0 z-top bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center"
        @click.self="closeRenameDialog"
      >
        <div
          class="w-full max-w-md bg-[#1a1f2e] border border-[#2e3650] rounded-lg overflow-hidden shadow-xl"
        >
          <div class="flex items-center justify-between px-4 py-3 border-b border-[#2e3650]">
            <p class="text-sm font-semibold text-slate-200">{{ renameDialogTitle }}</p>
            <button
              class="text-slate-500 text-sm px-2 py-1 rounded hover:text-slate-200 hover:bg-[#2e3650] transition-colors"
              @click="closeRenameDialog"
            >
              ✕
            </button>
          </div>

          <div class="p-4 flex flex-col gap-3">
            <label class="text-xs text-slate-400">{{ $t('common.name') }}</label>
            <input
              ref="renameInputRef"
              v-model="renameInputValue"
              type="text"
              class="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-cyan-600"
              @keydown.enter="confirmRenameDialog"
              @keydown.esc="closeRenameDialog"
            />
            <p v-if="renameDialogError" class="text-xs text-red-400">
              {{ renameDialogError }}
            </p>
          </div>

          <div class="flex justify-end gap-2 px-4 py-3 border-t border-[#2e3650]">
            <button class="default-button-gray" @click="closeRenameDialog">
              {{ $t('common.cancel') }}
            </button>
            <button
              class="default-button-cyan"
              :disabled="!renameInputValue.trim()"
              @click="confirmRenameDialog"
            >
              {{ $t('common.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';

const { t } = useI18n();
const store = apiStore();
const toastStore = useToastStore();

const IMAGE_FILE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'tif',
  'tiff',
  'fit',
  'fits',
  'fts',
];

const PREVIEWABLE_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tif', 'tiff'];
const FITS_EXTENSIONS = ['fit', 'fits', 'fts'];
const BAYER_PATTERNS = new Set(['RGGB', 'BGGR', 'GRBG', 'GBRG']);

const currentPath = ref('');
const parentPath = ref('');
const directories = ref([]);
const files = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const newFolderName = ref('');
const selectedPath = ref('');
const showImagesOnly = ref(true);
const selectedEntry = ref(null);
const selectedEntryType = ref(null);
const previewVisible = ref(false);
const previewUrl = ref('');
const previewFileName = ref('');
const previewMode = ref('image');
const previewLoading = ref(false);
const previewError = ref('');
const fitsCanvasRef = ref(null);
const fitsPrepared = ref(null);
const fitsStretchMode = ref('asinh');
const fitsStretchStrength = ref(6);
const fitsStats = ref(null);
const fitsHeaderEntries = ref([]);
const fitsPerf = ref({
  prepareMs: 0,
  parseMs: 0,
  decodeMs: 0,
  demosaicMs: 0,
  renderMs: 0,
  renderCount: 0,
  queueSkips: 0,
  lastReason: 'idle',
});
const renameDialogVisible = ref(false);
const renameDialogError = ref('');
const renameInputValue = ref('');
const renameTarget = ref(null);
const renameInputRef = ref(null);

let fitsRenderFrame = 0;
let fitsImageData = null;

const filteredFiles = computed(() => {
  if (!showImagesOnly.value) {
    return files.value;
  }

  return files.value.filter((file) => IMAGE_FILE_EXTENSIONS.includes(getFileExtension(file.name)));
});

const selectedEntryTypeLabel = computed(() => {
  if (selectedEntryType.value === 'directory') {
    return t('plugins.filebrowser.directory');
  }

  if (selectedEntryType.value === 'file') {
    return t('plugins.filebrowser.file');
  }

  return '—';
});

const isSelectedEntryImage = computed(() => {
  if (selectedEntryType.value !== 'file' || !selectedEntry.value) {
    return false;
  }

  return IMAGE_FILE_EXTENSIONS.includes(getFileExtension(selectedEntry.value.name));
});

const renameDialogTitle = computed(() => {
  if (!renameTarget.value) {
    return t('common.edit');
  }

  const typeLabel =
    renameTarget.value.entryType === 'file'
      ? t('plugins.filebrowser.file')
      : t('plugins.filebrowser.directory');
  return `${t('common.edit')} ${typeLabel}`;
});

const canGoUp = computed(() => {
  return !!parentPath.value && parentPath.value !== currentPath.value;
});

const breadcrumbs = computed(() => {
  const path = currentPath.value;
  if (!path) {
    return [];
  }

  const isWindows = path.includes('\\');
  const separator = isWindows ? '\\' : '/';
  const parts = path.split(separator).filter(Boolean);

  return parts.map((label, idx) => {
    let builtPath = parts.slice(0, idx + 1).join(separator);

    if (idx === 0 && isWindows) {
      builtPath += separator;
    }

    if (!isWindows) {
      builtPath = '/' + builtPath;
    }

    return {
      label,
      path: builtPath,
    };
  });
});

function getFileExtension(name) {
  return String(name || '')
    .split('.')
    .pop()
    ?.toLowerCase();
}

function formatSize(bytes) {
  if (bytes == null) {
    return '—';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(isoDate) {
  if (!isoDate) {
    return '—';
  }

  const date = new Date(isoDate);
  return date.toLocaleString();
}

function clearSelection() {
  selectedEntry.value = null;
  selectedEntryType.value = null;
  selectedPath.value = '';
}

function closePreview() {
  if (fitsRenderFrame) {
    cancelAnimationFrame(fitsRenderFrame);
    fitsRenderFrame = 0;
  }

  fitsImageData = null;
  previewVisible.value = false;
  previewUrl.value = '';
  previewFileName.value = '';
  previewMode.value = 'image';
  previewLoading.value = false;
  previewError.value = '';
  fitsPrepared.value = null;
  fitsStats.value = null;
  fitsHeaderEntries.value = [];
  fitsPerf.value = {
    prepareMs: 0,
    parseMs: 0,
    decodeMs: 0,
    demosaicMs: 0,
    renderMs: 0,
    renderCount: 0,
    queueSkips: 0,
    lastReason: 'idle',
  };
}

function openRenameDialog(entry, entryType) {
  if (!entry?.path || !entry?.name) {
    return;
  }

  renameTarget.value = {
    path: entry.path,
    name: entry.name,
    entryType,
  };
  renameDialogError.value = '';
  renameInputValue.value = entry.name;
  renameDialogVisible.value = true;

  nextTick(() => {
    renameInputRef.value?.focus();
    renameInputRef.value?.select();
  });
}

function closeRenameDialog() {
  renameDialogVisible.value = false;
  renameDialogError.value = '';
  renameInputValue.value = '';
  renameTarget.value = null;
}

function setSelectedDirectory(path) {
  if (!path) {
    clearSelection();
    return;
  }

  const name = String(path).split(/[/\\]/).filter(Boolean).pop() || path;
  selectedEntry.value = { name, path };
  selectedEntryType.value = 'directory';
  selectedPath.value = path;
}

async function browse(path = '') {
  errorMessage.value = '';
  isLoading.value = true;
  closePreview();

  try {
    const response = await apiService.browseFilesystem(path || '');
    if (!response?.success) {
      throw new Error(response?.error || t('plugins.filebrowser.loadError'));
    }

    currentPath.value = response.currentPath || path || '';
    parentPath.value = response.parentPath || '';
    directories.value = Array.isArray(response.directories) ? response.directories : [];
    files.value = Array.isArray(response.files) ? response.files : [];
    setSelectedDirectory(currentPath.value);
  } catch (error) {
    errorMessage.value = error?.message || t('plugins.filebrowser.loadError');
    directories.value = [];
    files.value = [];
    clearSelection();
  } finally {
    isLoading.value = false;
  }
}

function refreshCurrent() {
  browse(currentPath.value);
}

function goUp() {
  if (!canGoUp.value) {
    return;
  }

  browse(parentPath.value);
}

function openDirectory(directory) {
  browse(directory.path);
}

function selectFile(file) {
  selectedEntry.value = file;
  selectedEntryType.value = 'file';
  selectedPath.value = file.path;
}

function buildSiblingPath(sourcePath, newName) {
  const source = String(sourcePath || '');
  const isWindows = source.includes('\\');
  const separator = isWindows ? '\\' : '/';
  const normalized = source.replace(/[/\\]+$/, '');
  const lastSeparator = normalized.lastIndexOf(separator);

  if (lastSeparator < 0) {
    return newName;
  }

  if (!isWindows && lastSeparator === 0) {
    return `${separator}${newName}`;
  }

  return `${normalized.slice(0, lastSeparator)}${separator}${newName}`;
}

function isPreviewableImage(fileName) {
  return PREVIEWABLE_IMAGE_EXTENSIONS.includes(getFileExtension(fileName));
}

function isFitsFile(fileName) {
  return FITS_EXTENSIONS.includes(getFileExtension(fileName));
}

function parseFitsValue(raw) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("'")) {
    return trimmed.replace(/^'/, '').replace(/'$/, '').trim();
  }

  if (trimmed === 'T') {
    return true;
  }

  if (trimmed === 'F') {
    return false;
  }

  const numberValue = Number(trimmed);
  return Number.isNaN(numberValue) ? trimmed : numberValue;
}

function parseFitsHeader(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder('ascii');
  const header = {};

  let offset = 0;
  while (offset + 80 <= bytes.length) {
    const card = decoder.decode(bytes.slice(offset, offset + 80));
    const key = card.slice(0, 8).trim();

    if (key === 'END') {
      offset += 80;
      break;
    }

    if (card[8] === '=') {
      const valuePart = card.slice(10, 80).split('/')[0] || '';
      header[key] = parseFitsValue(valuePart);
    }

    offset += 80;
  }

  const dataOffset = Math.ceil(offset / 2880) * 2880;
  return { header, dataOffset };
}

function readFitsPixel(dataView, bitpix, byteOffset) {
  switch (bitpix) {
    case 8:
      return dataView.getUint8(byteOffset);
    case 16:
      return dataView.getInt16(byteOffset, false);
    case 32:
      return dataView.getInt32(byteOffset, false);
    case -32:
      return dataView.getFloat32(byteOffset, false);
    case -64:
      return dataView.getFloat64(byteOffset, false);
    default:
      throw new Error(`Unsupported FITS BITPIX: ${bitpix}`);
  }
}

function bitpixSize(bitpix) {
  return Math.abs(bitpix) / 8;
}

function buildFitsHeaderEntries(header, maxEntries = 40) {
  const preferred = [
    'BAYERPAT',
    'BAYERPATTERN',
    'BITPIX',
    'NAXIS',
    'NAXIS1',
    'NAXIS2',
    'BSCALE',
    'BZERO',
    'EXPTIME',
    'GAIN',
    'OFFSET',
    'XBINNING',
    'YBINNING',
    'XPIXSZ',
    'YPIXSZ',
    'FILTER',
    'CAMERA',
    'INSTRUME',
    'OBJECT',
    'DATE-OBS',
    'RA',
    'DEC',
  ];

  const preferredSet = new Set(preferred);
  const orderedKeys = [
    ...preferred.filter((key) => key in header),
    ...Object.keys(header).filter((key) => !preferredSet.has(key)),
  ].slice(0, maxEntries);

  return orderedKeys.map((key) => ({
    key,
    value: String(header[key]),
  }));
}

function getFitsBayerPattern(header) {
  const rawPattern = String(header.BAYERPAT || header.BAYERPATTERN || '')
    .trim()
    .toUpperCase();
  return BAYER_PATTERNS.has(rawPattern) ? rawPattern : '';
}

function getBayerColor(pattern, x, y) {
  const xx = x & 1;
  const yy = y & 1;

  switch (pattern) {
    case 'RGGB':
      return yy === 0 ? (xx === 0 ? 'R' : 'G') : xx === 0 ? 'G' : 'B';
    case 'BGGR':
      return yy === 0 ? (xx === 0 ? 'B' : 'G') : xx === 0 ? 'G' : 'R';
    case 'GRBG':
      return yy === 0 ? (xx === 0 ? 'G' : 'R') : xx === 0 ? 'B' : 'G';
    case 'GBRG':
      return yy === 0 ? (xx === 0 ? 'G' : 'B') : xx === 0 ? 'R' : 'G';
    default:
      return 'G';
  }
}

function averageAtOffsets(values, width, height, x, y, offsets, fallback) {
  let sum = 0;
  let count = 0;

  for (const [dx, dy] of offsets) {
    const xx = x + dx;
    const yy = y + dy;
    if (xx < 0 || yy < 0 || xx >= width || yy >= height) {
      continue;
    }

    sum += values[yy * width + xx];
    count += 1;
  }

  return count ? sum / count : fallback;
}

function clampToByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function createStretchMapper(low, high, mode, strength) {
  const range = Math.max(1e-9, high - low);
  const safeStrength = Math.max(1e-3, Number(strength) || 1);

  const normalize = (value) => Math.max(0, Math.min(1, (value - low) / range));

  if (mode === 'sqrt') {
    return (value) => Math.sqrt(normalize(value));
  }

  if (mode === 'log') {
    const denom = Math.log1p(safeStrength);
    return (value) => Math.log1p(safeStrength * normalize(value)) / denom;
  }

  if (mode === 'asinh') {
    const denom = Math.asinh(safeStrength);
    return (value) => Math.asinh(safeStrength * normalize(value)) / denom;
  }

  return (value) => normalize(value);
}

function buildDebayerChannels(values, width, height, pattern) {
  const rChannel = new Float32Array(width * height);
  const gChannel = new Float32Array(width * height);
  const bChannel = new Float32Array(width * height);

  const cardinal = [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
  ];
  const diagonal = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];
  const horizontal = [
    [-1, 0],
    [1, 0],
  ];
  const vertical = [
    [0, -1],
    [0, 1],
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIndex = y * width + x;
      const center = values[srcIndex];
      const color = getBayerColor(pattern, x, y);

      let r = center;
      let g = center;
      let b = center;

      if (color === 'R') {
        g = averageAtOffsets(values, width, height, x, y, cardinal, center);
        b = averageAtOffsets(values, width, height, x, y, diagonal, center);
      } else if (color === 'B') {
        g = averageAtOffsets(values, width, height, x, y, cardinal, center);
        r = averageAtOffsets(values, width, height, x, y, diagonal, center);
      } else {
        const neighborX = x + 1 < width ? x + 1 : x - 1;
        const horizontalColor = getBayerColor(pattern, Math.max(0, neighborX), y);
        if (horizontalColor === 'R') {
          r = averageAtOffsets(values, width, height, x, y, horizontal, center);
          b = averageAtOffsets(values, width, height, x, y, vertical, center);
        } else {
          r = averageAtOffsets(values, width, height, x, y, vertical, center);
          b = averageAtOffsets(values, width, height, x, y, horizontal, center);
        }
      }

      rChannel[srcIndex] = r;
      gChannel[srcIndex] = g;
      bChannel[srcIndex] = b;
    }
  }

  return {
    rChannel,
    gChannel,
    bChannel,
  };
}

function percentileFromSorted(values, p) {
  if (!values.length) {
    return 0;
  }

  const index = Math.min(values.length - 1, Math.max(0, Math.floor(p * (values.length - 1))));
  return values[index];
}

function prepareFitsRenderData(arrayBuffer) {
  const prepareStart = performance.now();
  const parseStart = performance.now();
  const { header, dataOffset } = parseFitsHeader(arrayBuffer);
  const parseMs = performance.now() - parseStart;

  const width = Number(header.NAXIS1 || 0);
  const height = Number(header.NAXIS2 || 0);
  const bitpix = Number(header.BITPIX || 0);
  const bzero = Number(header.BZERO ?? 0);
  const bscale = Number(header.BSCALE ?? 1);

  if (!width || !height || !bitpix) {
    throw new Error('Invalid FITS header (missing NAXIS1/NAXIS2/BITPIX)');
  }

  const pixelBytes = bitpixSize(bitpix);
  if (!pixelBytes) {
    throw new Error(`Unsupported FITS BITPIX: ${bitpix}`);
  }

  const pixelCount = width * height;
  const availableBytes = arrayBuffer.byteLength - dataOffset;
  const requiredBytes = pixelCount * pixelBytes;
  if (availableBytes < requiredBytes) {
    throw new Error('FITS file is truncated');
  }

  const decodeStart = performance.now();
  const dataView = new DataView(arrayBuffer, dataOffset);
  const values = new Float32Array(pixelCount);
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sum = 0;
  let sumSq = 0;

  for (let i = 0; i < pixelCount; i++) {
    const raw = readFitsPixel(dataView, bitpix, i * pixelBytes);
    const scaled = raw * bscale + bzero;
    const safe = Number.isFinite(scaled) ? scaled : 0;
    values[i] = safe;
    if (safe < min) {
      min = safe;
    }
    if (safe > max) {
      max = safe;
    }
    sum += safe;
    sumSq += safe * safe;
  }
  const decodeMs = performance.now() - decodeStart;

  const bayerPattern = getFitsBayerPattern(header);
  const sample = [];
  const sampleStep = Math.max(1, Math.floor(values.length / 50000));
  for (let i = 0; i < values.length; i += sampleStep) {
    const value = values[i];
    if (Number.isFinite(value)) {
      sample.push(value);
    }
  }

  sample.sort((a, b) => a - b);
  let low = percentileFromSorted(sample, 0.01);
  let high = percentileFromSorted(sample, 0.995);
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) {
    low = 0;
    high = 1;
  }

  const mean = sum / Math.max(1, pixelCount);
  const variance = Math.max(0, sumSq / Math.max(1, pixelCount) - mean * mean);
  const std = Math.sqrt(variance);

  let demosaicMs = 0;
  let debayeredChannels = null;
  if (bayerPattern) {
    const demosaicStart = performance.now();
    debayeredChannels = buildDebayerChannels(values, width, height, bayerPattern);
    demosaicMs = performance.now() - demosaicStart;
  }

  return {
    width,
    height,
    bitpix,
    bayerPattern,
    low,
    high,
    min,
    max,
    mean,
    std,
    monoValues: bayerPattern ? null : values,
    debayeredChannels,
    headerEntries: buildFitsHeaderEntries(header),
    perf: {
      prepareMs: performance.now() - prepareStart,
      parseMs,
      decodeMs,
      demosaicMs,
    },
  };
}

function renderPreparedFitsToCanvas(prepared, canvas, options = {}) {
  const renderStart = performance.now();
  const {
    width,
    height,
    bitpix,
    bayerPattern,
    low,
    high,
    min,
    max,
    mean,
    std,
    monoValues,
    debayeredChannels,
  } = prepared;

  const stretchMode = options.stretchMode || 'asinh';
  const stretchStrength = Number(options.stretchStrength) || 1;
  const stretchLow = stretchMode === 'linear' ? min : low;
  const stretchHigh = stretchMode === 'linear' ? max : high;
  const mapValueToUnit = createStretchMapper(stretchLow, stretchHigh, stretchMode, stretchStrength);

  const curveMapper = createStretchMapper(0, 1, stretchMode, stretchStrength);
  const curveSamples = {
    p10: curveMapper(0.1),
    p50: curveMapper(0.5),
    p90: curveMapper(0.9),
  };

  if (!fitsImageData || fitsImageData.width !== width || fitsImageData.height !== height) {
    fitsImageData = new ImageData(width, height);
  }

  const pixels = fitsImageData.data;
  if (bayerPattern && debayeredChannels) {
    const { rChannel, gChannel, bChannel } = debayeredChannels;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIndex = y * width + x;
        const dstIndex = ((height - 1 - y) * width + x) * 4;
        pixels[dstIndex] = clampToByte(mapValueToUnit(rChannel[srcIndex]) * 255);
        pixels[dstIndex + 1] = clampToByte(mapValueToUnit(gChannel[srcIndex]) * 255);
        pixels[dstIndex + 2] = clampToByte(mapValueToUnit(bChannel[srcIndex]) * 255);
        pixels[dstIndex + 3] = 255;
      }
    }
  } else {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIndex = y * width + x;
        const dstIndex = ((height - 1 - y) * width + x) * 4;
        const gray = clampToByte(mapValueToUnit(monoValues[srcIndex]) * 255);
        pixels[dstIndex] = gray;
        pixels[dstIndex + 1] = gray;
        pixels[dstIndex + 2] = gray;
        pixels[dstIndex + 3] = 255;
      }
    }
  }

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to render FITS preview');
  }

  ctx.putImageData(fitsImageData, 0, 0);

  return {
    stats: {
      width,
      height,
      bitpix,
      bayerPattern,
      stretchMode,
      stretchStrength,
      low: stretchLow,
      high: stretchHigh,
      clippedLow: low,
      clippedHigh: high,
      min,
      max,
      mean,
      std,
      curveSamples,
    },
    renderMs: performance.now() - renderStart,
  };
}

function renderCurrentFitsBuffer(reason = 'render') {
  if (!fitsPrepared.value || !fitsCanvasRef.value) {
    return;
  }

  const result = renderPreparedFitsToCanvas(fitsPrepared.value, fitsCanvasRef.value, {
    stretchMode: fitsStretchMode.value,
    stretchStrength: fitsStretchStrength.value,
  });

  fitsStats.value = result?.stats || null;
  fitsPerf.value = {
    ...fitsPerf.value,
    renderMs: result?.renderMs || 0,
    renderCount: fitsPerf.value.renderCount + 1,
    lastReason: reason,
  };
}

function scheduleFitsRender(reason = 'update') {
  if (!fitsPrepared.value || !fitsCanvasRef.value) {
    return;
  }

  if (fitsRenderFrame) {
    fitsPerf.value = {
      ...fitsPerf.value,
      queueSkips: fitsPerf.value.queueSkips + 1,
      lastReason: `queued:${reason}`,
    };
    return;
  }

  fitsRenderFrame = requestAnimationFrame(() => {
    fitsRenderFrame = 0;
    try {
      renderCurrentFitsBuffer(reason);
    } catch (error) {
      previewError.value = error?.message || 'Failed to render FITS preview';
    }
  });
}

async function openFitsFile(file) {
  previewFileName.value = file.name || file.path;
  previewMode.value = 'fits';
  previewVisible.value = true;
  previewUrl.value = '';
  previewLoading.value = true;
  previewError.value = '';

  try {
    const buffer = await apiService.fetchFilesystemFileBuffer(file.path);
    const prepared = prepareFitsRenderData(buffer);
    fitsPrepared.value = prepared;
    fitsHeaderEntries.value = prepared.headerEntries;
    fitsPerf.value = {
      ...fitsPerf.value,
      prepareMs: prepared.perf.prepareMs,
      parseMs: prepared.perf.parseMs,
      decodeMs: prepared.perf.decodeMs,
      demosaicMs: prepared.perf.demosaicMs,
      renderMs: 0,
      renderCount: 0,
      queueSkips: 0,
      lastReason: 'prepared',
    };

    // Render target is behind v-if/v-else, so we must leave loading state first.
    previewLoading.value = false;
    await nextTick();

    if (!fitsCanvasRef.value) {
      throw new Error('FITS canvas is not available');
    }

    renderCurrentFitsBuffer('initial-open');
  } catch (error) {
    previewError.value = error?.message || 'Failed to render FITS preview';
    fitsPrepared.value = null;
    fitsImageData = null;
    fitsStats.value = null;
    fitsHeaderEntries.value = [];
  } finally {
    previewLoading.value = false;
  }
}

watch([fitsStretchMode, fitsStretchStrength], () => {
  if (
    !previewVisible.value ||
    previewMode.value !== 'fits' ||
    previewLoading.value ||
    previewError.value
  ) {
    return;
  }

  scheduleFitsRender('stretch-change');
});

function openFile(file) {
  if (!file?.path) {
    return;
  }

  if (isFitsFile(file.name)) {
    openFitsFile(file);
    return;
  }

  const streamUrl = apiService.getFilesystemFileStreamUrl(file.path);

  if (isPreviewableImage(file.name)) {
    previewFileName.value = file.name || file.path;
    previewUrl.value = streamUrl;
    previewMode.value = 'image';
    previewLoading.value = false;
    previewError.value = '';
    previewVisible.value = true;
    return;
  }

  window.open(streamUrl, '_blank', 'noopener');
}

function handlePreviewError() {
  if (previewMode.value !== 'image') {
    return;
  }

  const fallbackUrl = previewUrl.value;
  closePreview();
  if (fallbackUrl) {
    window.open(fallbackUrl, '_blank', 'noopener');
  }
}

async function confirmRenameDialog() {
  const target = renameTarget.value;
  if (!target?.path || !target?.name) {
    return;
  }

  const nextName = renameInputValue.value.trim();
  if (!nextName) {
    renameDialogError.value = t('plugins.filebrowser.loadError');
    return;
  }

  if (nextName === target.name) {
    closeRenameDialog();
    return;
  }

  const targetPath = buildSiblingPath(target.path, nextName);

  try {
    await apiService.renameFilesystemEntry(target.path, targetPath);
    closeRenameDialog();
    await browse(currentPath.value);

    if (target.entryType === 'file') {
      const renamedFile = files.value.find((f) => f.path === targetPath);
      if (renamedFile) {
        selectFile(renamedFile);
      }
    } else {
      setSelectedDirectory(targetPath);
    }
  } catch (error) {
    renameDialogError.value = error?.message || t('plugins.filebrowser.loadError');
  }
}

async function createDirectory() {
  const folderName = newFolderName.value.trim();
  if (!folderName || !currentPath.value) {
    return;
  }

  const isWindows = currentPath.value.includes('\\');
  const separator = isWindows ? '\\' : '/';
  const newDirectoryPath = currentPath.value.replace(/[/\\]+$/, '') + separator + folderName;

  try {
    await apiService.createFilesystemDirectory(newDirectoryPath);
    newFolderName.value = '';
    await browse(currentPath.value);
  } catch (error) {
    errorMessage.value = error?.message || t('plugins.filebrowser.createError');
  }
}

async function deleteDirectory(directory) {
  const confirmed = await toastStore.showConfirmation(
    t('plugins.filebrowser.deleteDirectoryTitle'),
    t('plugins.filebrowser.deleteDirectoryMessage', { name: directory.name }),
    t('common.delete'),
    t('common.cancel')
  );

  if (!confirmed) {
    return;
  }

  try {
    await apiService.deleteFilesystemDirectory(directory.path);
    await browse(currentPath.value);
  } catch (error) {
    errorMessage.value = error?.message || t('plugins.filebrowser.deleteError');
  }
}

async function deleteFile(file) {
  const confirmed = await toastStore.showConfirmation(
    t('plugins.filebrowser.deleteFileTitle'),
    t('plugins.filebrowser.deleteFileMessage', { name: file.name }),
    t('common.delete'),
    t('common.cancel')
  );

  if (!confirmed) {
    return;
  }

  try {
    await apiService.deleteFilesystemFile(file.path);
    await browse(currentPath.value);
  } catch (error) {
    errorMessage.value = error?.message || t('plugins.filebrowser.deleteError');
  }
}

async function jumpToImageSavePath() {
  const path = store.imageSavePath || '';
  if (!path) {
    await browse('');
    return;
  }

  await browse(path);

  if (errorMessage.value) {
    await browse('');
  }
}

onMounted(() => {
  jumpToImageSavePath();
});
</script>
