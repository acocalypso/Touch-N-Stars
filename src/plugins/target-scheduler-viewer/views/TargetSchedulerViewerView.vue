<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import ProjectCard from '../components/ProjectCard.vue';
import SchedulePreview from '../components/SchedulePreview.vue';
import StatTile from '../components/StatTile.vue';
import {
  targetSchedulerApi,
  getStoredPort,
  setStoredPort,
  getStoredProfileId,
  setStoredProfileId,
  getStoredHeaderCollapsed,
  setStoredHeaderCollapsed,
} from '../services/targetSchedulerApi';
import { THEME } from '../theme';
import { fuzzyMatch } from '../fuzzyMatch';
import { computeSummary, classifyTargetCompletion } from '../calculations';

const { t } = useI18n();

const port = ref(getStoredPort());
const profiles = ref([]);
const selectedProfileId = ref('');
const projects = ref(null);
const targetsByProject = ref({});
const loading = ref(false);
const error = ref('');
const lastUpdated = ref(null);

const showSchedule = ref(false);
const schedule = ref(null);
const scheduleLoading = ref(false);
const scheduleError = ref('');

const apiVersion = ref('');

const headerCollapsed = ref(getStoredHeaderCollapsed());
function toggleHeader() {
  headerCollapsed.value = !headerCollapsed.value;
  setStoredHeaderCollapsed(headerCollapsed.value);
}

const searchQuery = ref('');
const stateFilter = ref('all');
const completionFilter = ref('all');
const filtersExpanded = ref(false);

const availableStates = computed(() => {
  if (!projects.value) return [];
  return [...new Set(projects.value.map((p) => p.State))];
});

// A target counts for a project's visibility when it satisfies both the
// completion filter and the search query — the completion filter is
// inherently about individual targets, so (unlike search) it never falls
// back to "the project name matched, show everything".
function targetMatchesFilters(target, query, completion) {
  if (completion !== 'all' && classifyTargetCompletion(target) !== completion) return false;
  if (query && !fuzzyMatch(target.Name, query)) return false;
  return true;
}

function projectMatchesFilters(project, targets, query, completion) {
  if (targets.some((t) => targetMatchesFilters(t, query, completion))) return true;
  if (completion !== 'all') return false;
  if (!query) return true;
  return fuzzyMatch(project.Name, query);
}

const visibleProjects = computed(() => {
  if (!projects.value) return [];
  const query = searchQuery.value.trim();
  return projects.value.filter((project) => {
    if (stateFilter.value !== 'all' && project.State !== stateFilter.value) return false;
    const targets = targetsByProject.value[project.Id]?.targets || [];
    return projectMatchesFilters(project, targets, query, completionFilter.value);
  });
});

let pollTimer = null;
const POLL_MS = 30000;

async function loadProfiles(signal) {
  profiles.value = await targetSchedulerApi.getProfiles({ signal });
  const storedId = getStoredProfileId();
  const remembered = storedId && profiles.value.find((p) => p.Id === storedId);
  const fallback = profiles.value.find((p) => p.Active) || profiles.value[0];
  const chosen = remembered || fallback;
  if (chosen) selectedProfileId.value = chosen.Id;
}

targetSchedulerApi
  .getVersion()
  .then((v) => {
    apiVersion.value = String(v);
  })
  .catch(() => {});

async function loadProjects(signal) {
  if (!selectedProfileId.value) return;
  loading.value = true;
  error.value = '';
  try {
    const fetchedProjects = await targetSchedulerApi.getProjects(selectedProfileId.value, {
      signal,
    });
    projects.value = fetchedProjects;

    const entries = await Promise.all(
      fetchedProjects.map(async (project) => {
        try {
          const targets = await targetSchedulerApi.getTargets(project.Id, { signal });
          return [project.Id, { targets, error: '' }];
        } catch (e) {
          return [project.Id, { targets: [], error: e.message }];
        }
      })
    );
    targetsByProject.value = Object.fromEntries(entries);
    lastUpdated.value = new Date();
  } catch (e) {
    // A cancellation must propagate to the caller (onPortChange reverts the
    // port field on cancel) rather than being swallowed as a normal error.
    if (e.kind === 'cancelled') throw e;
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function refreshAll() {
  error.value = '';
  loading.value = true;
  try {
    if (!profiles.value.length) await loadProfiles();
    await loadProjects();
    if (showSchedule.value) await loadSchedule();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

// Changing the port re-connects from scratch (new profiles, new projects).
// That connection can hang for up to the request timeout against a wrong or
// unreachable port, so it's cancellable and the port field is locked while
// it's in flight — editing it again mid-attempt would race two connections
// against each other.
const connectingPort = ref(false);
let portAbortController = null;
let lastGoodPort = getStoredPort();

async function onPortChange() {
  const attemptedPort = port.value;
  portAbortController?.abort();
  const controller = new AbortController();
  portAbortController = controller;

  connectingPort.value = true;
  error.value = '';
  setStoredPort(attemptedPort);
  profiles.value = [];
  selectedProfileId.value = '';
  projects.value = null;
  targetsByProject.value = {};
  lastUpdated.value = null;

  try {
    await loadProfiles(controller.signal);
    await loadProjects(controller.signal);
    lastGoodPort = attemptedPort;
  } catch (e) {
    if (controller.signal.aborted) {
      port.value = lastGoodPort;
      setStoredPort(lastGoodPort);
    } else {
      error.value = e.message;
    }
  } finally {
    if (portAbortController === controller) {
      connectingPort.value = false;
      portAbortController = null;
    }
  }
}

function cancelPortConnect() {
  portAbortController?.abort();
}

function onProfileChange() {
  setStoredProfileId(selectedProfileId.value);
  projects.value = null;
  targetsByProject.value = {};
  schedule.value = null;
  loadProjects();
}

async function loadSchedule() {
  if (!selectedProfileId.value) return;
  scheduleLoading.value = true;
  scheduleError.value = '';
  try {
    schedule.value = await targetSchedulerApi.getPreview(selectedProfileId.value);
  } catch (e) {
    scheduleError.value = e.message;
  } finally {
    scheduleLoading.value = false;
  }
}

function toggleSchedule() {
  showSchedule.value = !showSchedule.value;
  if (showSchedule.value) loadSchedule();
}

const summary = computed(() => computeSummary(projects.value, targetsByProject.value));

onMounted(() => {
  refreshAll();
  pollTimer = setInterval(() => {
    if (!selectedProfileId.value) return;
    loadProjects();
    if (showSchedule.value) loadSchedule();
  }, POLL_MS);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<template>
  <div
    class="min-h-screen p-3 md:p-5"
    :style="{ backgroundColor: THEME.surface1, color: THEME.inkPrimary }"
  >
    <div class="mx-auto max-w-5xl space-y-4 pb-24">
      <section
        class="rounded-xl border-t-2 p-4"
        :style="{
          backgroundColor: THEME.surface2,
          borderColor: THEME.border,
          borderTopColor: THEME.accent,
        }"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold md:text-2xl">
              {{ t('plugins.targetSchedulerViewer.title') }}
            </h1>
            <p class="text-xs" :style="{ color: THEME.inkMuted }">
              {{ t('plugins.targetSchedulerViewer.subtitle') }}
            </p>
          </div>
          <div class="flex gap-2">
            <button
              class="rounded border px-3 py-1.5 text-sm transition-colors"
              :style="{ borderColor: THEME.warning, color: THEME.warning }"
              @click="toggleSchedule"
            >
              {{
                showSchedule
                  ? t('plugins.targetSchedulerViewer.actions.hideSchedule')
                  : t('plugins.targetSchedulerViewer.actions.showSchedule')
              }}
            </button>
            <button
              class="rounded border px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
              :style="{ borderColor: THEME.border, color: THEME.inkSecondary }"
              :disabled="loading"
              @click="refreshAll"
            >
              {{
                loading
                  ? t('plugins.targetSchedulerViewer.actions.refreshing')
                  : t('plugins.targetSchedulerViewer.actions.refresh')
              }}
            </button>
            <button
              class="rounded border p-1.5 transition-colors"
              :style="{ borderColor: THEME.border, color: THEME.inkMuted }"
              :aria-label="
                headerCollapsed
                  ? t('plugins.targetSchedulerViewer.actions.expandHeader')
                  : t('plugins.targetSchedulerViewer.actions.collapseHeader')
              "
              @click="toggleHeader"
            >
              <svg
                class="h-4 w-4 transition-transform"
                :class="{ 'rotate-180': headerCollapsed }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4.5 15.75l7.5-7.5 7.5 7.5"
                />
              </svg>
            </button>
          </div>
        </div>

        <p v-if="headerCollapsed" class="mt-2 text-xs" :style="{ color: THEME.inkMuted }">
          {{ profiles.find((p) => p.Id === selectedProfileId)?.Name }}
          <span v-if="summary">
            · {{ summary.completionPct }}% complete · {{ summary.targetCount }} targets</span
          >
        </p>

        <div
          class="grid transition-[grid-template-rows] duration-200 ease-out"
          :style="{ gridTemplateRows: headerCollapsed ? '0fr' : '1fr' }"
        >
          <div class="overflow-hidden">
            <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label class="text-xs" :style="{ color: THEME.inkMuted }">
                {{ t('plugins.targetSchedulerViewer.labels.apiPort') }}
                <div class="mt-1 flex items-center gap-2">
                  <input
                    v-model="port"
                    type="text"
                    inputmode="numeric"
                    class="h-9 w-full rounded border px-2 disabled:opacity-60"
                    :disabled="connectingPort"
                    :style="{
                      borderColor: THEME.border,
                      backgroundColor: THEME.surface1,
                      color: THEME.inkPrimary,
                    }"
                    @change="onPortChange"
                  />
                  <svg
                    v-if="connectingPort"
                    class="h-4 w-4 shrink-0 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    :style="{ color: THEME.accent }"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <button
                    v-if="connectingPort"
                    type="button"
                    class="h-9 shrink-0 rounded border px-2 text-xs"
                    :style="{ borderColor: THEME.border, color: THEME.inkSecondary }"
                    @click="cancelPortConnect"
                  >
                    {{ t('plugins.targetSchedulerViewer.actions.cancel') }}
                  </button>
                </div>
              </label>

              <label class="text-xs" :style="{ color: THEME.inkMuted }">
                {{ t('plugins.targetSchedulerViewer.labels.profile') }}
                <select
                  v-model="selectedProfileId"
                  class="mt-1 h-9 w-full appearance-none rounded border bg-[length:1.1em] bg-[right_0.5rem_center] bg-no-repeat px-2 pr-8"
                  :style="{
                    borderColor: THEME.border,
                    backgroundColor: THEME.surface1,
                    color: THEME.inkPrimary,
                    backgroundImage:
                      'url(\'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238fa3bf%22 stroke-width=%222%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M19.5 8.25l-7.5 7.5-7.5-7.5%22/></svg>\')',
                  }"
                  @change="onProfileChange"
                >
                  <option v-for="p in profiles" :key="p.Id" :value="p.Id">
                    {{ p.Name
                    }}{{ p.Active ? ` (${t('plugins.targetSchedulerViewer.labels.active')})` : '' }}
                  </option>
                </select>
              </label>
            </div>

            <div
              v-if="summary"
              class="mt-4 grid grid-cols-2 gap-3 border-t pt-3 sm:grid-cols-3 lg:grid-cols-5"
              :style="{ borderColor: THEME.border }"
            >
              <StatTile
                :label="t('plugins.targetSchedulerViewer.labels.activeProjects')"
                :value="summary.activeProjects"
              />
              <StatTile
                :label="t('plugins.targetSchedulerViewer.labels.targets')"
                :value="summary.targetCount"
              />
              <StatTile
                :label="t('plugins.targetSchedulerViewer.labels.completion')"
                :value="summary.completionPct + '%'"
                accent
              />
              <StatTile
                :label="t('plugins.targetSchedulerViewer.labels.integrationTime')"
                :value="summary.integrationTime"
              />
              <StatTile
                :label="t('plugins.targetSchedulerViewer.labels.remainingTime')"
                :value="summary.remainingIntegrationTime"
              />
            </div>

            <p v-if="lastUpdated" class="mt-3 text-[11px]" :style="{ color: THEME.inkMuted }">
              {{ t('plugins.targetSchedulerViewer.labels.lastUpdated') }}:
              {{ lastUpdated.toLocaleTimeString() }}
            </p>
          </div>
        </div>
      </section>

      <template v-if="showSchedule">
        <div
          v-if="scheduleError"
          class="rounded-lg border p-3 text-sm"
          :style="{
            borderColor: THEME.critical,
            backgroundColor: THEME.criticalBg,
            color: THEME.critical,
          }"
        >
          {{ scheduleError }}
        </div>
        <div
          v-else-if="scheduleLoading && !schedule"
          class="h-16 animate-pulse rounded-lg"
          :style="{ backgroundColor: THEME.surface2 }"
        />
        <SchedulePreview v-else-if="schedule" :segments="schedule" />
      </template>

      <div
        v-if="error"
        class="flex items-center gap-2 rounded-lg border p-3 text-sm"
        :style="{
          borderColor: THEME.critical,
          backgroundColor: THEME.criticalBg,
          color: THEME.critical,
        }"
      >
        <svg
          class="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        {{ error }}
      </div>

      <div v-else-if="loading && !projects" class="space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="h-14 animate-pulse rounded-lg"
          :style="{ backgroundColor: THEME.surface2 }"
        />
      </div>

      <div
        v-else-if="projects && !projects.length"
        class="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm"
        :style="{ borderColor: THEME.border, color: THEME.inkMuted }"
      >
        <svg
          class="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
        {{ t('plugins.targetSchedulerViewer.labels.noProjects') }}
      </div>

      <template v-else>
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative min-w-[220px] flex-1">
            <svg
              class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              :style="{ color: THEME.inkMuted }"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"
              />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('plugins.targetSchedulerViewer.labels.searchPlaceholder')"
              class="h-9 w-full rounded border pl-8 pr-8 text-sm"
              :style="{
                borderColor: THEME.border,
                backgroundColor: THEME.surface2,
                color: THEME.inkPrimary,
              }"
            />
            <button
              v-if="searchQuery"
              class="absolute right-2 top-1/2 -translate-y-1/2"
              :style="{ color: THEME.inkMuted }"
              :aria-label="t('plugins.targetSchedulerViewer.labels.clearSearch')"
              @click="searchQuery = ''"
            >
              <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <button
            class="relative flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition-colors"
            :style="
              filtersExpanded
                ? { borderColor: THEME.accent, color: THEME.inkPrimary }
                : { borderColor: THEME.border, color: THEME.inkMuted }
            "
            @click="filtersExpanded = !filtersExpanded"
          >
            <svg
              class="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
              />
            </svg>
            {{ t('plugins.targetSchedulerViewer.labels.filtersToggle') }}
            <span
              v-if="stateFilter !== 'all' || completionFilter !== 'all'"
              class="h-1.5 w-1.5 rounded-full"
              :style="{ backgroundColor: THEME.accent }"
            />
          </button>
        </div>

        <div
          class="grid transition-[grid-template-rows] duration-200 ease-out"
          :style="{ gridTemplateRows: filtersExpanded ? '1fr' : '0fr' }"
        >
          <div class="space-y-2 overflow-hidden">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[11px]" :style="{ color: THEME.inkMuted }">{{
                t('plugins.targetSchedulerViewer.labels.stateFilterLabel')
              }}</span>
              <button
                class="rounded-full border px-2.5 py-1 text-[11px] transition-colors"
                :style="
                  stateFilter === 'all'
                    ? {
                        borderColor: THEME.accent,
                        backgroundColor: THEME.goodBg,
                        color: THEME.inkPrimary,
                      }
                    : { borderColor: THEME.border, color: THEME.inkMuted }
                "
                @click="stateFilter = 'all'"
              >
                {{ t('plugins.targetSchedulerViewer.labels.allStates') }}
              </button>
              <button
                v-for="s in availableStates"
                :key="s"
                class="rounded-full border px-2.5 py-1 text-[11px] transition-colors"
                :style="
                  stateFilter === s
                    ? {
                        borderColor: THEME.accent,
                        backgroundColor: THEME.goodBg,
                        color: THEME.inkPrimary,
                      }
                    : { borderColor: THEME.border, color: THEME.inkMuted }
                "
                @click="stateFilter = s"
              >
                {{ s }}
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[11px]" :style="{ color: THEME.inkMuted }">{{
                t('plugins.targetSchedulerViewer.labels.completionFilterLabel')
              }}</span>
              <button
                v-for="opt in [
                  ['all', t('plugins.targetSchedulerViewer.labels.allStates')],
                  ['not-started', t('plugins.targetSchedulerViewer.labels.notStarted')],
                  ['in-progress', t('plugins.targetSchedulerViewer.labels.inProgress')],
                  ['done', t('plugins.targetSchedulerViewer.labels.done')],
                ]"
                :key="opt[0]"
                class="rounded-full border px-2.5 py-1 text-[11px] transition-colors"
                :style="
                  completionFilter === opt[0]
                    ? {
                        borderColor: THEME.accent,
                        backgroundColor: THEME.goodBg,
                        color: THEME.inkPrimary,
                      }
                    : { borderColor: THEME.border, color: THEME.inkMuted }
                "
                @click="completionFilter = opt[0]"
              >
                {{ opt[1] }}
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="!visibleProjects.length"
          class="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm"
          :style="{ borderColor: THEME.border, color: THEME.inkMuted }"
        >
          {{ t('plugins.targetSchedulerViewer.labels.noResults') }}
        </div>

        <div v-else class="space-y-3">
          <ProjectCard
            v-for="project in visibleProjects"
            :key="project.Id"
            :project="project"
            :targets="targetsByProject[project.Id]?.targets || []"
            :targets-error="targetsByProject[project.Id]?.error || ''"
            :search-query="searchQuery.trim()"
            :completion-filter="completionFilter"
          />
        </div>
      </template>

      <div class="space-y-3 rounded-lg p-3" :style="{ backgroundColor: THEME.surface2 }">
        <p class="text-[11px] font-medium" :style="{ color: THEME.inkSecondary }">
          {{ t('plugins.targetSchedulerViewer.labels.legendTitle') }}
        </p>

        <div>
          <p class="mb-1 text-[10px] uppercase tracking-wide" :style="{ color: THEME.inkMuted }">
            {{ t('plugins.targetSchedulerViewer.labels.legendBarsTitle') }}
          </p>
          <p
            class="flex flex-wrap items-center gap-3 text-[11px]"
            :style="{ color: THEME.inkMuted }"
          >
            <span class="flex items-center gap-1">
              <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: THEME.good }" />
              {{ t('plugins.targetSchedulerViewer.labels.legendAccepted') }}
            </span>
            <span class="flex items-center gap-1">
              <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: THEME.warning }" />
              {{ t('plugins.targetSchedulerViewer.labels.legendPending') }}
            </span>
          </p>
        </div>

        <div>
          <p class="mb-1 text-[10px] uppercase tracking-wide" :style="{ color: THEME.inkMuted }">
            {{ t('plugins.targetSchedulerViewer.labels.legendDotsTitle') }}
          </p>
          <p
            class="flex flex-wrap items-center gap-3 text-[11px]"
            :style="{ color: THEME.inkMuted }"
          >
            <span class="flex items-center gap-1">
              <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: THEME.good }" />
              {{ t('plugins.targetSchedulerViewer.labels.legendActive') }}
            </span>
            <span class="flex items-center gap-1">
              <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: THEME.warning }" />
              {{ t('plugins.targetSchedulerViewer.labels.legendInactive') }}
            </span>
            <span class="flex items-center gap-1">
              <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: THEME.accent }" />
              {{ t('plugins.targetSchedulerViewer.labels.legendDraft') }}
            </span>
            <span class="flex items-center gap-1">
              <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: THEME.critical }" />
              {{ t('plugins.targetSchedulerViewer.labels.legendClosed') }}
            </span>
          </p>
        </div>
      </div>

      <footer class="space-y-1 pt-2 text-[11px]" :style="{ color: THEME.inkMuted }">
        <p>{{ t('plugins.targetSchedulerViewer.labels.unofficialDisclaimer') }}</p>
        <p>
          {{ t('plugins.targetSchedulerViewer.labels.dataFrom') }}
          <a
            href="https://tcpalmer.github.io/nina-scheduler/"
            target="_blank"
            rel="noopener noreferrer"
            class="underline"
            :style="{ color: THEME.accent }"
            >Target Scheduler</a
          >
          <span v-if="apiVersion"> v{{ apiVersion }}</span>
          — {{ t('plugins.targetSchedulerViewer.labels.readOnlyNote') }}
        </p>
        <p>
          {{ t('plugins.targetSchedulerViewer.labels.creditNote') }}
          <a
            href="https://github.com/tcpalmer"
            target="_blank"
            rel="noopener noreferrer"
            class="underline"
            :style="{ color: THEME.accent }"
            >tcpalmer</a
          >.
        </p>
      </footer>
    </div>
  </div>
</template>
