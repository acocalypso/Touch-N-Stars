import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { DIAGNOSTICS_STATUS, applyArchiveStatusTransition } from '../utils/diagnosticsSupport';

export const useLogCollectorStore = defineStore('logCollector', () => {
  // State
  const submissions = ref([]);
  const diagnosticsRun = ref(createInitialDiagnosticsRun());

  // Getters
  const getAllSubmissions = computed(() => submissions.value);
  const getSubmissionByToken = computed(
    () => (token) => submissions.value.find((sub) => sub.token === token)
  );
  const diagnosticsIsActive = computed(() => {
    return (
      diagnosticsRun.value.status === DIAGNOSTICS_STATUS.QUEUED ||
      diagnosticsRun.value.status === DIAGNOSTICS_STATUS.RUNNING
    );
  });

  // Actions
  function addSubmission({ date, filename, token }) {
    const submission = {
      id: Date.now(), // Simple ID generation
      date,
      filename,
      token,
      createdAt: new Date().toISOString(),
    };

    submissions.value.unshift(submission); // Add to beginning of array

    // Keep only last 100 submissions to prevent storage bloat
    if (submissions.value.length > 100) {
      submissions.value = submissions.value.slice(0, 100);
    }

    // Persist to localStorage
    persistToStorage();

    return submission;
  }

  function removeSubmission(id) {
    const index = submissions.value.findIndex((sub) => sub.id === id);
    if (index > -1) {
      submissions.value.splice(index, 1);
      persistToStorage();
      return true;
    }
    return false;
  }

  function clearAllSubmissions() {
    submissions.value = [];
    persistToStorage();
  }

  function persistToStorage() {
    try {
      localStorage.setItem('logCollector_submissions', JSON.stringify(submissions.value));
    } catch (error) {
      console.error('Failed to persist log collector submissions:', error);
    }
  }

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem('logCollector_submissions');
      if (stored) {
        submissions.value = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load log collector submissions:', error);
      submissions.value = [];
    }
  }

  function resetDiagnosticsRun() {
    diagnosticsRun.value = createInitialDiagnosticsRun();
  }

  function beginDiagnosticsRun(startResponse) {
    diagnosticsRun.value = {
      archiveId: startResponse?.archiveId || '',
      status: startResponse?.status || DIAGNOSTICS_STATUS.QUEUED,
      error: null,
      pollUrl: startResponse?.pollUrl || '',
      downloadUrl: startResponse?.downloadUrl || '',
      startedAt: Date.now(),
      finishedAt: null,
      autoDownloaded: false,
      uploadedToSupport: false,
      lastMessage: '',
    };
  }

  function setDiagnosticsStatusResponse(statusResponse, options) {
    diagnosticsRun.value = applyArchiveStatusTransition(
      diagnosticsRun.value,
      statusResponse,
      options
    );
  }

  function setDiagnosticsError(message) {
    diagnosticsRun.value = {
      ...diagnosticsRun.value,
      status: DIAGNOSTICS_STATUS.FAILED,
      error: message || 'Diagnostics run failed.',
      finishedAt: Date.now(),
    };
  }

  function markDiagnosticsAutoDownloaded() {
    diagnosticsRun.value = {
      ...diagnosticsRun.value,
      autoDownloaded: true,
    };
  }

  function markDiagnosticsUploadedToSupport() {
    diagnosticsRun.value = {
      ...diagnosticsRun.value,
      uploadedToSupport: true,
    };
  }

  function setDiagnosticsLastMessage(message) {
    diagnosticsRun.value = {
      ...diagnosticsRun.value,
      lastMessage: message || '',
    };
  }

  // Load data on store initialization
  loadFromStorage();

  return {
    // State
    submissions,

    // Getters
    getAllSubmissions,
    getSubmissionByToken,
    diagnosticsIsActive,

    // Actions
    addSubmission,
    removeSubmission,
    clearAllSubmissions,
    loadFromStorage,
    resetDiagnosticsRun,
    beginDiagnosticsRun,
    setDiagnosticsStatusResponse,
    setDiagnosticsError,
    markDiagnosticsAutoDownloaded,
    markDiagnosticsUploadedToSupport,
    setDiagnosticsLastMessage,
    diagnosticsRun,
  };
});

function createInitialDiagnosticsRun() {
  return {
    archiveId: '',
    status: DIAGNOSTICS_STATUS.IDLE,
    error: null,
    pollUrl: '',
    downloadUrl: '',
    startedAt: null,
    finishedAt: null,
    autoDownloaded: false,
    uploadedToSupport: false,
    lastMessage: '',
  };
}
