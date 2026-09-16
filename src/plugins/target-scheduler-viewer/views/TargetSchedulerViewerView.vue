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
} from '../services/targetSchedulerApi';
import { THEME } from '../theme';

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

let pollTimer = null;
const POLL_MS = 30000;

async function loadProfiles() {
  profiles.value = await targetSchedulerApi.getProfiles();
  const active = profiles.value.find((p) => p.Active) || profiles.value[0];
  if (active) selectedProfileId.value = active.Id;
}

async function loadProjects() {
  if (!selectedProfileId.value) return;
  loading.value = true;
  error.value = '';
  try {
    const fetchedProjects = await targetSchedulerApi.getProjects(selectedProfileId.value);
    projects.value = fetchedProjects;

    const entries = await Promise.all(
      fetchedProjects.map(async (project) => {
        try {
          const targets = await targetSchedulerApi.getTargets(project.Id);
          return [project.Id, { targets, error: '' }];
        } catch (e) {
          return [project.Id, { targets: [], error: e.message }];
        }
      })
    );
    targetsByProject.value = Object.fromEntries(entries);
    lastUpdated.value = new Date();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function refreshAll() {
  error.value = '';
  try {
    if (!profiles.value.length) await loadProfiles();
    await loadProjects();
    if (showSchedule.value) await loadSchedule();
  } catch (e) {
    error.value = e.message;
  }
}

function onPortChange() {
  setStoredPort(port.value);
  profiles.value = [];
  projects.value = null;
  targetsByProject.value = {};
  refreshAll();
}

function onProfileChange() {
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

const summary = computed(() => {
  if (!projects.value) return null;
  const activeProjects = projects.value.filter((p) => p.State === 'Active').length;

  let targetCount = 0;
  let desiredTotal = 0;
  let acceptedTotal = 0;
  for (const { targets } of Object.values(targetsByProject.value)) {
    targetCount += targets.length;
    for (const target of targets) {
      for (const plan of target.ExposurePlan || []) {
        desiredTotal += plan.Desired;
        acceptedTotal += plan.Accepted;
      }
    }
  }

  const completionPct =
    desiredTotal > 0 ? Math.min(100, Math.round((acceptedTotal / desiredTotal) * 100)) : 0;

  return { activeProjects, targetCount, completionPct };
});

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
  <div class="min-h-screen p-3 md:p-5" :style="{ backgroundColor: THEME.surface1, color: THEME.inkPrimary }">
    <div class="mx-auto max-w-5xl space-y-4 pb-24">
      <section
        class="rounded-xl border-t-2 p-4"
        :style="{ backgroundColor: THEME.surface2, borderColor: THEME.border, borderTopColor: THEME.accent }"
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
              {{ showSchedule ? t('plugins.targetSchedulerViewer.actions.hideSchedule') : t('plugins.targetSchedulerViewer.actions.showSchedule') }}
            </button>
            <button
              class="rounded border px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
              :style="{ borderColor: THEME.border, color: THEME.inkSecondary }"
              :disabled="loading"
              @click="refreshAll"
            >
              {{ loading ? t('plugins.targetSchedulerViewer.actions.refreshing') : t('plugins.targetSchedulerViewer.actions.refresh') }}
            </button>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label class="text-xs" :style="{ color: THEME.inkMuted }">
            {{ t('plugins.targetSchedulerViewer.labels.apiPort') }}
            <input
              v-model="port"
              type="text"
              inputmode="numeric"
              class="mt-1 h-9 w-full rounded border px-2"
              :style="{ borderColor: THEME.border, backgroundColor: THEME.surface1, color: THEME.inkPrimary }"
              @change="onPortChange"
            />
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
                {{ p.Name }}{{ p.Active ? ` (${t('plugins.targetSchedulerViewer.labels.active')})` : '' }}
              </option>
            </select>
          </label>
        </div>

        <div v-if="summary" class="mt-4 grid grid-cols-3 gap-3 border-t pt-3" :style="{ borderColor: THEME.border }">
          <StatTile :label="t('plugins.targetSchedulerViewer.labels.activeProjects')" :value="summary.activeProjects" />
          <StatTile :label="t('plugins.targetSchedulerViewer.labels.targets')" :value="summary.targetCount" />
          <StatTile :label="t('plugins.targetSchedulerViewer.labels.completion')" :value="summary.completionPct + '%'" accent />
        </div>

        <p v-if="lastUpdated" class="mt-3 text-[11px]" :style="{ color: THEME.inkMuted }">
          {{ t('plugins.targetSchedulerViewer.labels.lastUpdated') }}: {{ lastUpdated.toLocaleTimeString() }}
        </p>
      </section>

      <template v-if="showSchedule">
        <div
          v-if="scheduleError"
          class="rounded-lg border p-3 text-sm"
          :style="{ borderColor: THEME.critical, backgroundColor: THEME.criticalBg, color: THEME.critical }"
        >
          {{ scheduleError }}
        </div>
        <div v-else-if="scheduleLoading && !schedule" class="h-16 animate-pulse rounded-lg" :style="{ backgroundColor: THEME.surface2 }" />
        <SchedulePreview v-else-if="schedule" :segments="schedule" />
      </template>

      <div
        v-if="error"
        class="flex items-center gap-2 rounded-lg border p-3 text-sm"
        :style="{ borderColor: THEME.critical, backgroundColor: THEME.criticalBg, color: THEME.critical }"
      >
        <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        {{ error }}
      </div>

      <div v-else-if="loading && !projects" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-14 animate-pulse rounded-lg" :style="{ backgroundColor: THEME.surface2 }" />
      </div>

      <div
        v-else-if="projects && !projects.length"
        class="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm"
        :style="{ borderColor: THEME.border, color: THEME.inkMuted }"
      >
        <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
        {{ t('plugins.targetSchedulerViewer.labels.noProjects') }}
      </div>

      <template v-else>
        <p class="flex items-center gap-3 text-[11px]" :style="{ color: THEME.inkMuted }">
          <span class="flex items-center gap-1">
            <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: THEME.good }" />
            {{ t('plugins.targetSchedulerViewer.labels.legendAccepted') }}
          </span>
          <span class="flex items-center gap-1">
            <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: THEME.warning }" />
            {{ t('plugins.targetSchedulerViewer.labels.legendPending') }}
          </span>
        </p>

        <div class="space-y-3">
          <ProjectCard
            v-for="project in projects"
            :key="project.Id"
            :project="project"
            :targets="targetsByProject[project.Id]?.targets || []"
            :targets-error="targetsByProject[project.Id]?.error || ''"
          />
        </div>
      </template>
    </div>
  </div>
</template>
