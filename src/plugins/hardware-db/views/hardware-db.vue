<template>
  <div class="container mx-auto p-4 flex flex-col gap-4 max-w-3xl">
    <div class="flex items-start justify-between gap-2">
      <div>
        <h1 class="text-2xl font-bold text-white">{{ $t('plugins.hardwareDb.title') }}</h1>
        <p class="text-sm text-gray-400 mt-1">{{ $t('plugins.hardwareDb.intro') }}</p>
      </div>
      <button
        class="tns-btn-secondary w-auto! px-3"
        :disabled="snapshot.loading.value"
        @click="refresh"
      >
        {{ $t('common.refresh') }}
      </button>
    </div>

    <p v-if="snapshot.loading.value" class="text-blue-400 text-sm">
      {{ $t('plugins.hardwareDb.collecting') }}
    </p>
    <p v-else-if="snapshot.error.value" class="text-red-400 text-sm">
      {{ snapshot.error.value }}
    </p>

    <div v-else-if="candidates.length === 0" class="tns-card p-4">
      <p class="text-gray-300">{{ $t('plugins.hardwareDb.noDevices') }}</p>
    </div>

    <template v-else>
      <HardwareDeviceRow
        v-for="candidate in candidates"
        :key="candidate.id"
        :candidate="candidate"
        :rating="ratingFor(candidate.id)"
        @update:rating="setRating(candidate.id, $event)"
      />

      <button class="tns-btn-primary" :disabled="ratedCount === 0" @click="openPreview">
        {{ $t('plugins.hardwareDb.reviewAndSend', { count: ratedCount }) }}
      </button>
      <p v-if="ratedCount === 0" class="text-xs text-gray-500 text-center">
        {{ $t('plugins.hardwareDb.selectAtLeastOne') }}
      </p>
    </template>

    <!-- Submission receipt: the token is the only way back to one's own report. -->
    <div v-if="lastToken" class="tns-card p-4 flex flex-col gap-2 border border-green-700">
      <p class="text-green-300 font-semibold">{{ $t('plugins.hardwareDb.submitSuccess') }}</p>
      <p class="text-sm text-gray-300">{{ $t('plugins.hardwareDb.submitSuccessHint') }}</p>
      <div class="flex items-center gap-2">
        <code class="tns-input flex items-center overflow-x-auto text-sm">{{ lastToken }}</code>
        <button class="tns-btn-secondary w-auto! px-3" @click="copyToken(lastToken)">
          {{
            copiedToken === lastToken
              ? $t('plugins.hardwareDb.copied')
              : $t('plugins.hardwareDb.copy')
          }}
        </button>
      </div>
    </div>

    <div v-if="store.submissions.length" class="tns-card p-4 flex flex-col gap-3">
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-lg font-semibold text-white">
          {{ $t('plugins.hardwareDb.history.title') }}
        </h2>
        <button
          class="tns-btn-secondary w-auto! px-3"
          :disabled="refreshingStatus"
          @click="refreshStatuses"
        >
          {{ $t('plugins.hardwareDb.history.refreshStatus') }}
        </button>
      </div>

      <div
        v-for="submission in store.submissions"
        :key="submission.reportToken"
        class="flex items-center justify-between gap-2 border-b border-gray-700 last:border-0 pb-2 last:pb-0"
      >
        <div class="min-w-0">
          <p class="text-sm text-gray-200 truncate">{{ submission.reportToken }}</p>
          <p class="text-xs text-gray-500">
            {{ formatDate(submission.createdAt) }} ·
            {{ $t('plugins.hardwareDb.history.deviceCount', { count: submission.deviceCount }) }}
          </p>
        </div>
        <span class="text-xs font-semibold shrink-0" :class="statusClass(submission.status)">
          {{ $t(`plugins.hardwareDb.history.status.${submission.status}`) }}
        </span>
      </div>

      <button class="tns-btn-secondary" @click="store.clearSubmissions()">
        {{ $t('plugins.hardwareDb.history.clear') }}
      </button>
    </div>

    <HardwareReportPreviewModal
      :show="showPreview"
      :payload="previewPayload"
      :sending="sending"
      :error-message="submitError"
      @close="closePreview"
      @confirm="submit"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import HardwareDeviceRow from '../components/HardwareDeviceRow.vue';
import HardwareReportPreviewModal from '../components/HardwareReportPreviewModal.vue';
import { useHardwareSnapshot } from '../composables/useHardwareSnapshot';
import { useHardwareDbStore } from '../store/hardwareDbStore';
import { createHardwareDbApi } from '../utils/hardwareDbApi';
import { generateReportToken } from '../utils/reportToken';
import { buildSubmissionPayload } from '../utils/snapshotSerializer';
import metadata from '../plugin.json';

const { t } = useI18n();
const store = useHardwareDbStore();
const snapshot = useHardwareSnapshot();
const api = createHardwareDbApi({ baseUrl: metadata.config.pocketbaseUrl });

const ratings = ref({});
const showPreview = ref(false);
const previewPayload = ref(null);
const sending = ref(false);
const submitError = ref('');
const lastToken = ref('');
const copiedToken = ref('');
const refreshingStatus = ref(false);

const candidates = computed(() => snapshot.candidates.value);
const ratedCount = computed(
  () => Object.values(ratings.value).filter((rating) => rating?.status).length
);

function ratingFor(id) {
  return ratings.value[id] || { status: null, note: '' };
}

function setRating(id, rating) {
  ratings.value = { ...ratings.value, [id]: rating };
}

async function refresh() {
  await snapshot.collect();
}

function openPreview() {
  submitError.value = '';
  previewPayload.value = buildSubmissionPayload({
    candidates: candidates.value,
    ratings: ratings.value,
    installId: store.ensureInstallId(),
    ...snapshot.collectMeta(),
  });
  showPreview.value = true;
}

function closePreview() {
  if (sending.value) return;
  showPreview.value = false;
}

async function submit() {
  if (!previewPayload.value) return;

  sending.value = true;
  submitError.value = '';
  const reportToken = generateReportToken();

  try {
    await api.submitReport({
      reportToken,
      installId: previewPayload.value.installId,
      payload: previewPayload.value,
    });

    store.addSubmission({ reportToken, deviceCount: previewPayload.value.devices.length });
    lastToken.value = reportToken;
    showPreview.value = false;
    // Ratings are cleared so the same report cannot be sent twice by accident.
    ratings.value = {};
  } catch (error) {
    console.error('[hardware-db] Submission failed:', error);
    submitError.value = error?.message || t('plugins.hardwareDb.submitError');
  } finally {
    sending.value = false;
  }
}

async function refreshStatuses() {
  refreshingStatus.value = true;
  try {
    for (const submission of store.submissions) {
      if (submission.status !== 'pending') continue;
      try {
        const status = await api.fetchSubmissionStatus(submission.reportToken);
        store.setSubmissionStatus(submission.reportToken, status);
      } catch (error) {
        console.warn('[hardware-db] Status lookup failed:', error?.message || error);
      }
    }
  } finally {
    refreshingStatus.value = false;
  }
}

async function copyToken(token) {
  try {
    await navigator.clipboard.writeText(token);
    copiedToken.value = token;
    setTimeout(() => {
      if (copiedToken.value === token) copiedToken.value = '';
    }, 3000);
  } catch (error) {
    console.error('[hardware-db] Clipboard write failed:', error);
  }
}

function formatDate(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function statusClass(status) {
  if (status === 'approved') return 'text-green-400';
  if (status === 'rejected') return 'text-red-400';
  if (status === 'duplicate') return 'text-gray-400';
  return 'text-amber-400';
}

onMounted(refresh);
</script>
