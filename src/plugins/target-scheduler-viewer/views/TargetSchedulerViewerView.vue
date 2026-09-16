<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import ProjectCard from '../components/ProjectCard.vue';
import {
  targetSchedulerApi,
  getStoredPort,
  setStoredPort,
} from '../services/targetSchedulerApi';

const { t } = useI18n();

const port = ref(getStoredPort());
const profiles = ref([]);
const selectedProfileId = ref('');
const projects = ref(null);
const loading = ref(false);
const error = ref('');
const lastUpdated = ref(null);

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
    projects.value = await targetSchedulerApi.getProjects(selectedProfileId.value);
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
  } catch (e) {
    error.value = e.message;
  }
}

function onPortChange() {
  setStoredPort(port.value);
  profiles.value = [];
  projects.value = null;
  refreshAll();
}

function onProfileChange() {
  projects.value = null;
  loadProjects();
}

onMounted(() => {
  refreshAll();
  pollTimer = setInterval(() => {
    if (selectedProfileId.value) loadProjects();
  }, POLL_MS);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 p-3 text-slate-100 md:p-5"
  >
    <div class="mx-auto max-w-5xl space-y-4 pb-24">
      <section class="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold md:text-2xl">
              {{ t('plugins.targetSchedulerViewer.title') }}
            </h1>
            <p class="text-xs text-slate-400">
              {{ t('plugins.targetSchedulerViewer.subtitle') }}
            </p>
          </div>
          <button
            class="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
            :disabled="loading"
            @click="refreshAll"
          >
            {{ loading ? t('plugins.targetSchedulerViewer.actions.refreshing') : t('plugins.targetSchedulerViewer.actions.refresh') }}
          </button>
        </div>

        <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label class="text-xs text-slate-400">
            {{ t('plugins.targetSchedulerViewer.labels.apiPort') }}
            <input
              v-model="port"
              type="text"
              inputmode="numeric"
              class="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-slate-100"
              @change="onPortChange"
            />
          </label>

          <label class="text-xs text-slate-400">
            {{ t('plugins.targetSchedulerViewer.labels.profile') }}
            <select
              v-model="selectedProfileId"
              class="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-slate-100"
              @change="onProfileChange"
            >
              <option v-for="p in profiles" :key="p.Id" :value="p.Id">
                {{ p.Name }}{{ p.Active ? ` (${t('plugins.targetSchedulerViewer.labels.active')})` : '' }}
              </option>
            </select>
          </label>
        </div>

        <p v-if="lastUpdated" class="mt-2 text-[11px] text-slate-500">
          {{ t('plugins.targetSchedulerViewer.labels.lastUpdated') }}: {{ lastUpdated.toLocaleTimeString() }}
        </p>
      </section>

      <div v-if="error" class="rounded-lg border border-red-700 bg-red-950/50 p-3 text-sm text-red-300">
        {{ error }}
      </div>

      <div v-else-if="loading && !projects" class="text-sm text-slate-400">
        {{ t('plugins.targetSchedulerViewer.labels.loading') }}
      </div>

      <div v-else-if="projects && !projects.length" class="text-sm text-slate-500">
        {{ t('plugins.targetSchedulerViewer.labels.noProjects') }}
      </div>

      <div v-else class="space-y-3">
        <ProjectCard v-for="project in projects" :key="project.Id" :project="project" />
      </div>
    </div>
  </div>
</template>
