import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useLogCollectorStore = defineStore('logCollector', () => {
  // State
  const submissions = ref([]);

  // Getters
  const getAllSubmissions = computed(() => submissions.value);
  const getSubmissionByToken = computed(
    () => (token) => submissions.value.find((sub) => sub.token === token)
  );

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

  // Load data on store initialization
  loadFromStorage();

  return {
    // State
    submissions,

    // Getters
    getAllSubmissions,
    getSubmissionByToken,

    // Actions
    addSubmission,
    removeSubmission,
    clearAllSubmissions,
    loadFromStorage,
  };
});
