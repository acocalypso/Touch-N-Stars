import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { generateInstallId } from '../utils/reportToken';

const SUBMISSIONS_KEY = 'hardwareDb_submissions';
const INSTALL_ID_KEY = 'hardwareDb_installId';
const KNOWLEDGE_CACHE_KEY = 'hardwareDb_knowledgeCache';
const DRAFT_KEY = 'hardwareDb_draft';
const PENDING_KEY = 'hardwareDb_pending';

const MAX_SUBMISSIONS = 50;
const KNOWLEDGE_TTL_MS = 24 * 60 * 60 * 1000;
const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/**
 * A report is a snapshot of one rig at one moment. Keeping more than a handful
 * of undelivered ones would flood the review queue the day the user finally has
 * internet, with the oldest describing a setup that has since changed.
 */
const MAX_PENDING = 5;

export const useHardwareDbStore = defineStore('hardwareDb', () => {
  const submissions = ref([]);
  const installId = ref('');
  const knowledgeCache = ref({ fetchedAt: 0, entries: [], notes: [] });
  const draft = ref({ ratings: {}, savedAt: 0 });
  const pending = ref([]);

  const hasSubmissions = computed(() => submissions.value.length > 0);

  // The published database changes slowly; refetching once a day is plenty and
  // keeps the plugin page instant on every later visit.
  const isKnowledgeFresh = computed(
    () => Date.now() - (knowledgeCache.value.fetchedAt || 0) < KNOWLEDGE_TTL_MS
  );

  function readJson(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (error) {
      console.error(`[hardware-db] Failed to read ${key}:`, error);
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[hardware-db] Failed to persist ${key}:`, error);
    }
  }

  /**
   * The install id is created lazily on first use rather than at startup, so a
   * user who never opens this plugin never gets an identifier at all.
   */
  function ensureInstallId() {
    if (installId.value) return installId.value;

    let stored = '';
    try {
      stored = localStorage.getItem(INSTALL_ID_KEY) || '';
    } catch (error) {
      console.error('[hardware-db] Failed to read install id:', error);
    }

    installId.value = stored || generateInstallId();
    if (!stored) {
      try {
        localStorage.setItem(INSTALL_ID_KEY, installId.value);
      } catch (error) {
        console.error('[hardware-db] Failed to persist install id:', error);
      }
    }
    return installId.value;
  }

  function addSubmission({ reportToken, deviceCount, status = 'pending' }) {
    submissions.value.unshift({
      reportToken,
      deviceCount,
      status,
      createdAt: new Date().toISOString(),
    });
    if (submissions.value.length > MAX_SUBMISSIONS) {
      submissions.value = submissions.value.slice(0, MAX_SUBMISSIONS);
    }
    writeJson(SUBMISSIONS_KEY, submissions.value);
  }

  function setSubmissionStatus(reportToken, status) {
    const entry = submissions.value.find((item) => item.reportToken === reportToken);
    if (!entry || !status || entry.status === status) return;
    entry.status = status;
    writeJson(SUBMISSIONS_KEY, submissions.value);
  }

  function removeSubmission(reportToken) {
    const index = submissions.value.findIndex((item) => item.reportToken === reportToken);
    if (index === -1) return;
    submissions.value.splice(index, 1);
    writeJson(SUBMISSIONS_KEY, submissions.value);
  }

  /**
   * Clearing the history drops the queue with it. A queued report the user can
   * no longer see must not still go out days later — the history entry is the
   * only trace of it, and removing the trace has to mean withdrawing the report.
   */
  function clearSubmissions() {
    submissions.value = [];
    writeJson(SUBMISSIONS_KEY, submissions.value);
    pending.value = [];
    writeJson(PENDING_KEY, pending.value);
  }

  /**
   * The unsent form. Rating a full rig is several minutes of typing, and the
   * app is regularly reloaded or backgrounded in the field — losing it to a
   * reload would be losing the report.
   */
  function setDraft(ratings) {
    draft.value = { ratings: ratings || {}, savedAt: Date.now() };
    writeJson(DRAFT_KEY, draft.value);
  }

  function clearDraft() {
    draft.value = { ratings: {}, savedAt: 0 };
    writeJson(DRAFT_KEY, draft.value);
  }

  /**
   * Queues a report the server could not be reached for. The token is created
   * before the first attempt and reused on every retry, so a report that was
   * in fact delivered cannot come back as a second, differently identified one.
   */
  function enqueuePending({ reportToken, payload }) {
    if (!reportToken || !payload) return;
    if (pending.value.some((item) => item.reportToken === reportToken)) return;

    pending.value.push({
      reportToken,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    if (pending.value.length > MAX_PENDING) {
      pending.value = pending.value.slice(-MAX_PENDING);
    }
    writeJson(PENDING_KEY, pending.value);
  }

  function dequeuePending(reportToken) {
    const index = pending.value.findIndex((item) => item.reportToken === reportToken);
    if (index === -1) return;
    pending.value.splice(index, 1);
    writeJson(PENDING_KEY, pending.value);
  }

  function markPendingAttempt(reportToken) {
    const entry = pending.value.find((item) => item.reportToken === reportToken);
    if (!entry) return;
    entry.attempts = (entry.attempts || 0) + 1;
    writeJson(PENDING_KEY, pending.value);
  }

  function setKnowledgeCache({ entries = [], notes = [] } = {}) {
    knowledgeCache.value = { fetchedAt: Date.now(), entries, notes };
    writeJson(KNOWLEDGE_CACHE_KEY, knowledgeCache.value);
  }

  function loadFromStorage() {
    const storedSubmissions = readJson(SUBMISSIONS_KEY, []);
    submissions.value = Array.isArray(storedSubmissions) ? storedSubmissions : [];

    const storedCache = readJson(KNOWLEDGE_CACHE_KEY, null);
    if (storedCache && Array.isArray(storedCache.entries)) {
      // Notes were added later; a cache written before that has none.
      knowledgeCache.value = { notes: [], ...storedCache };
    }

    const storedDraft = readJson(DRAFT_KEY, null);
    // A month-old draft describes a rig the user has long since changed, and
    // restoring it silently would put stale claims into a new report.
    if (
      storedDraft &&
      storedDraft.ratings &&
      Date.now() - (storedDraft.savedAt || 0) < DRAFT_TTL_MS
    ) {
      draft.value = { ratings: storedDraft.ratings, savedAt: storedDraft.savedAt || 0 };
    }

    const storedPending = readJson(PENDING_KEY, []);
    pending.value = Array.isArray(storedPending) ? storedPending : [];
  }

  loadFromStorage();

  return {
    submissions,
    installId,
    knowledgeCache,
    draft,
    pending,
    hasSubmissions,
    isKnowledgeFresh,
    ensureInstallId,
    addSubmission,
    setSubmissionStatus,
    removeSubmission,
    clearSubmissions,
    setDraft,
    clearDraft,
    enqueuePending,
    dequeuePending,
    markPendingAttempt,
    setKnowledgeCache,
    loadFromStorage,
  };
});
