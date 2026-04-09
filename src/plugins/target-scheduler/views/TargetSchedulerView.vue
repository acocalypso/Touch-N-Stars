<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-slate-100 p-3 md:p-5"
  >
    <div class="mx-auto max-w-7xl space-y-4 pb-24">
      <section class="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl md:text-2xl font-bold">{{ t('plugins.targetScheduler.title') }}</h1>
            <p class="text-xs text-slate-400">
              {{ t('plugins.targetScheduler.subtitle') }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              class="rounded border border-cyan-600 px-3 py-1.5 text-sm text-cyan-200 hover:bg-cyan-900/30"
              @click="openNewTarget"
            >
              {{ t('plugins.targetScheduler.actions.addTarget') }}
            </button>
            <button
              class="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
              @click="openFavorites"
            >
              {{ t('plugins.targetScheduler.actions.addFromFavorites') }}
            </button>
            <button
              class="rounded border border-emerald-600 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-900/30 disabled:opacity-50"
              :disabled="isApplyingToSequence"
              @click="applyScheduleToSequence"
            >
              {{
                isApplyingToSequence
                  ? t('plugins.targetScheduler.actions.applying')
                  : t('plugins.targetScheduler.actions.addScheduleToSequence')
              }}
            </button>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label class="text-xs text-slate-400">
            {{ t('plugins.targetScheduler.labels.sessionStart') }}
            <input
              v-model="sessionStartInput"
              type="datetime-local"
              class="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-slate-100"
            />
          </label>

          <label class="text-xs text-slate-400">
            {{ t('plugins.targetScheduler.labels.sessionEnd') }}
            <input
              v-model="sessionEndInput"
              type="datetime-local"
              class="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-slate-100"
            />
          </label>

          <label class="text-xs text-slate-400">
            {{ t('plugins.targetScheduler.labels.samplingStepMinutes') }}
            <input
              v-model.number="stepMinutes"
              type="number"
              min="2"
              max="30"
              class="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-slate-100"
            />
          </label>

          <label class="text-xs text-slate-400">
            {{ t('plugins.targetScheduler.labels.maxChunkMinutes') }}
            <input
              v-model.number="maxChunkMinutes"
              type="number"
              min="5"
              max="240"
              class="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-slate-100"
            />
          </label>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span
            >{{ t('plugins.targetScheduler.labels.siteLat') }}:
            {{ displayCoord(location.latitude) }}</span
          >
          <span
            >{{ t('plugins.targetScheduler.labels.siteLon') }}:
            {{ displayCoord(location.longitude) }}</span
          >
          <span>
            {{ t('plugins.targetScheduler.labels.siteAlt') }}: {{ displayCoord(location.altitude) }}
            {{ t('plugins.targetScheduler.common.meters') }}
          </span>
          <span>
            {{ t('plugins.targetScheduler.labels.scheduled') }}:
            {{ totalScheduledMinutes.toFixed(0) }} {{ t('plugins.targetScheduler.common.minutes') }}
          </span>
          <span v-if="!canApplyToSequence" class="text-amber-300">
            {{ t('plugins.targetScheduler.warnings.sequenceVersionRequired') }}
          </span>
        </div>
      </section>

      <div
        v-if="computeError"
        class="rounded border border-red-700/60 bg-red-900/20 px-3 py-2 text-xs text-red-300"
      >
        {{ computeError }}
      </div>

      <section class="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1.25fr]">
        <div class="rounded-xl border border-slate-700 bg-slate-800/55 p-3">
          <div class="mb-2 flex items-center justify-between">
            <button
              class="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              :disabled="isComputing"
              @click="recomputeSchedule"
            >
              {{
                isComputing
                  ? t('plugins.targetScheduler.actions.computing')
                  : t('plugins.targetScheduler.actions.recomputeSchedule')
              }}
            </button>

            <button
              v-if="targets.length"
              class="rounded border border-red-700/70 px-2 py-1 text-xs text-red-300 hover:bg-red-900/30"
              @click="removeAllTargets"
            >
              {{ t('plugins.targetScheduler.actions.clearAll') }}
            </button>
          </div>

          <TargetList
            :targets="targets"
            :selected-target-id="selectedTargetId"
            :target-summary-by-id="targetSummaryById"
            @select="selectedTargetId = $event"
            @edit="openEditEditor"
            @duplicate="duplicateTarget"
            @remove="removeTarget"
            @reorder="reorderTargets"
          />
        </div>

        <div class="space-y-4">
          <ScheduleTimeline
            :session="scheduleResult.session"
            :segments="scheduleResult.segments"
            :idle-segments="scheduleResult.idleSegments"
            :targets="targets"
          />

          <div class="rounded-xl border border-slate-700 bg-slate-800/60 p-3">
            <h3 class="text-sm font-semibold text-slate-200 mb-2">
              {{ t('plugins.targetScheduler.unscheduled.title') }}
            </h3>

            <div v-if="!scheduleResult.unscheduled.length" class="text-xs text-slate-500">
              {{ t('plugins.targetScheduler.unscheduled.allScheduled') }}
            </div>

            <ul v-else class="space-y-2">
              <li
                v-for="item in scheduleResult.unscheduled"
                :key="item.targetId"
                class="rounded border border-amber-700/40 bg-amber-900/20 px-2 py-1.5 text-xs"
              >
                <span class="text-amber-200">{{ item.name }}</span>
                <span class="text-amber-300/80">
                  {{
                    t('plugins.targetScheduler.unscheduled.remaining', {
                      minutes: item.remainingMinutes.toFixed(0),
                    })
                  }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="isEditorOpen && editingTarget"
      class="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto"
      @click.self="closeEditor"
    >
      <div class="mx-auto max-w-3xl">
        <TargetEditor :target="editingTarget" @save="handleSaveTarget" @cancel="closeEditor" />
      </div>
    </div>

    <div
      v-if="showFavoritesPicker"
      class="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm p-3"
      @click.self="showFavoritesPicker = false"
    >
      <div
        class="mx-auto max-w-2xl rounded-xl border border-slate-700 bg-slate-900 p-4 max-h-[90vh] overflow-y-auto"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-base font-semibold">
            {{ t('plugins.targetScheduler.favorites.importTitle') }}
          </h3>
          <button class="text-slate-400 hover:text-slate-200" @click="showFavoritesPicker = false">
            {{ t('plugins.targetScheduler.common.close') }}
          </button>
        </div>

        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs text-slate-400">
            {{ t('plugins.targetScheduler.favorites.available', { count: favorites.length }) }}
          </p>
          <button
            class="rounded border border-cyan-600 px-2 py-1 text-xs text-cyan-200 hover:bg-cyan-900/30 disabled:opacity-40"
            :disabled="!favorites.length"
            @click="addAllFavorites"
          >
            {{ t('plugins.targetScheduler.favorites.addAll') }}
          </button>
        </div>

        <div v-if="!favorites.length" class="text-xs text-slate-500">
          {{ t('plugins.targetScheduler.favorites.noneFound') }}
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="fav in favorites"
            :key="fav.Id || fav.id || `${fav.Name}-${fav.Ra}-${fav.Dec}`"
            class="rounded border border-slate-700 bg-slate-800/70 p-2 flex items-center justify-between gap-2"
          >
            <div class="min-w-0">
              <p class="truncate text-sm text-slate-200">
                {{ fav.Name || fav.name || t('plugins.targetScheduler.favorites.unnamed') }}
              </p>
              <p class="truncate text-[11px] text-slate-500 font-mono">
                {{ t('plugins.targetScheduler.common.ra') }}
                {{ fav.RaString || fav.Ra || fav.ra || '--' }} |
                {{ t('plugins.targetScheduler.common.dec') }}
                {{ fav.DecString || fav.Dec || fav.dec || '--' }}
              </p>
            </div>

            <button
              class="rounded border border-cyan-600 px-2 py-1 text-xs text-cyan-200 hover:bg-cyan-900/30"
              @click="addTargetFromFavorite(fav)"
            >
              {{ t('plugins.targetScheduler.common.add') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import TargetList from '../components/TargetList.vue';
import TargetEditor from '../components/TargetEditor.vue';
import ScheduleTimeline from '../components/ScheduleTimeline.vue';
import { useTargetScheduler } from '../composables/useTargetScheduler';

const { t } = useI18n();

const {
  targets,
  favorites,
  selectedTargetId,
  isEditorOpen,
  editingTarget,
  showFavoritesPicker,
  sessionStartInput,
  sessionEndInput,
  stepMinutes,
  maxChunkMinutes,
  location,
  scheduleResult,
  targetSummaryById,
  totalScheduledMinutes,
  isComputing,
  computeError,
  isApplyingToSequence,
  canApplyToSequence,
  addTarget,
  updateTarget,
  removeTarget,
  duplicateTarget,
  reorderTargets,
  openCreateEditor,
  openEditEditor,
  closeEditor,
  loadFavorites,
  addTargetFromFavorite,
  addAllFavorites,
  removeAllTargets,
  recomputeSchedule,
  applyScheduleToSequence,
} = useTargetScheduler();

function openNewTarget() {
  openCreateEditor();
}

function handleSaveTarget(payload) {
  const exists = targets.value.some((target) => target.id === payload.id);
  if (exists) {
    updateTarget(payload);
  } else {
    addTarget(payload);
  }
  closeEditor();
}

async function openFavorites() {
  await loadFavorites();
  showFavoritesPicker.value = true;
}

function displayCoord(value) {
  if (value == null || Number.isNaN(Number(value))) return '--';
  return Number(value).toFixed(3);
}
</script>
