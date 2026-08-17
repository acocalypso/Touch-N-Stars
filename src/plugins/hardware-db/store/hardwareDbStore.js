import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { generateInstallId } from '../utils/reportToken';

const SUBMISSIONS_KEY = 'hardwareDb_submissions';
const INSTALL_ID_KEY = 'hardwareDb_installId';
const KNOWLEDGE_CACHE_KEY = 'hardwareDb_knowledgeCache';

const MAX_SUBMISSIONS = 50;

export const useHardwareDbStore = defineStore('hardwareDb', () => {
  const submissions = ref([]);
  const installId = ref('');
  const knowledgeCache = ref({ fetchedAt: 0, entries: [] });

  const hasSubmissions = computed(() => submissions.value.length > 0);

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

  function addSubmission({ reportToken, deviceCount }) {
    submissions.value.unshift({
      reportToken,
      deviceCount,
      status: 'pending',
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

  function clearSubmissions() {
    submissions.value = [];
    writeJson(SUBMISSIONS_KEY, submissions.value);
  }

  function setKnowledgeCache(entries) {
    knowledgeCache.value = { fetchedAt: Date.now(), entries };
    writeJson(KNOWLEDGE_CACHE_KEY, knowledgeCache.value);
  }

  function loadFromStorage() {
    const storedSubmissions = readJson(SUBMISSIONS_KEY, []);
    submissions.value = Array.isArray(storedSubmissions) ? storedSubmissions : [];

    const storedCache = readJson(KNOWLEDGE_CACHE_KEY, null);
    if (storedCache && Array.isArray(storedCache.entries)) {
      knowledgeCache.value = storedCache;
    }
  }

  loadFromStorage();

  return {
    submissions,
    installId,
    knowledgeCache,
    hasSubmissions,
    ensureInstallId,
    addSubmission,
    setSubmissionStatus,
    removeSubmission,
    clearSubmissions,
    setKnowledgeCache,
    loadFromStorage,
  };
});
