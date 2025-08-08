<template>
  <div class="container py-16 flex items-center justify-center">
    <div class="container max-w-4xl">
      <h5 class="text-2xl text-center font-bold text-white mb-4">
        {{ $t('plugins.telescopius.title') }}
      </h5>

      <div class="flex flex-col space-y-4">
        <div
          class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
        >
          <p class="text-white text-center">{{ $t('plugins.telescopius.welcome') }}</p>
          <p class="text-gray-400 text-center mt-2">{{ $t('plugins.telescopius.description') }}</p>

          <!-- API Key Status -->
          <div
            v-if="telescopiusStore.hasApiKey"
            class="mt-4 p-3 bg-green-900/30 border border-green-600 rounded-lg"
          >
            <div class="flex items-center justify-center text-green-400 text-sm">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ $t('plugins.telescopius.apiKey.configured') }}
            </div>
          </div>

          <div v-else class="mt-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
            <div class="flex items-center justify-center text-yellow-400 text-sm">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ $t('plugins.telescopius.apiKey.required') }}
            </div>
          </div>

          <!-- API Key Settings -->
          <div class="flex justify-center mt-6">
            <button
              @click="showApiKeyModal = true"
              class="default-button-blue flex items-center gap-2"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                ></path>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              {{ $t('plugins.telescopius.apiKey.configure') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- API Key Modal -->
    <ApiKeyModal :show="showApiKeyModal" @close="showApiKeyModal = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ApiKeyModal from '../components/ApiKeyModal.vue';
import { useTelescopisStore } from '../store/telescopiusStore';

const showApiKeyModal = ref(false);
const telescopiusStore = useTelescopisStore();

onMounted(async () => {
  if (!telescopiusStore.isLoaded) {
    await telescopiusStore.loadApiKey();
  }
});
</script>
