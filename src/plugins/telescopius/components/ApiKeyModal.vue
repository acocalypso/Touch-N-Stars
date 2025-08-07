<template>
  <Modal :show="show" @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-bold">{{ $t('plugins.telescopius.apiKey.title') }}</h2>
    </template>

    <template #body>
      <div class="w-full max-w-md mx-auto space-y-6">
        <!-- Beschreibung -->
        <div class="text-gray-300 text-sm leading-relaxed">
          <p class="mb-3">
            {{ $t('plugins.telescopius.apiKey.description') }}
          </p>
          <p class="mb-3">
            <a 
              href="https://telescopius.com/api" 
              target="_blank" 
              class="text-blue-400 hover:text-blue-300 underline"
            >
              {{ $t('plugins.telescopius.apiKey.linkText') }}
            </a>
          </p>
          <p class="text-gray-400">
            {{ $t('plugins.telescopius.apiKey.securityNote') }}
          </p>
        </div>

        <!-- API Key Input -->
        <div class="space-y-3">
          <label for="apiKey" class="block text-sm font-medium text-gray-300">
            API Key
          </label>
          <input
            id="apiKey"
            v-model="localApiKey"
            type="password"
            :placeholder="$t('plugins.telescopius.apiKey.placeholder')"
            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @keyup.enter="saveApiKey"
          />
        </div>

        <!-- Status -->
        <div v-if="hasCurrentApiKey" class="flex items-center text-green-400 text-sm">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          {{ $t('plugins.telescopius.apiKey.configured') }}
        </div>

        <!-- Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            @click="saveApiKey"
            :disabled="!localApiKey.trim() || isLoading"
            class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
          >
            <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ $t('plugins.telescopius.apiKey.save') }}
          </button>
          
          <button
            v-if="hasCurrentApiKey"
            @click="deleteApiKey"
            :disabled="isLoading"
            class="px-4 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {{ $t('plugins.telescopius.apiKey.delete') }}
          </button>

          <button
            @click="$emit('close')"
            class="px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
          >
            {{ $t('plugins.telescopius.apiKey.cancel') }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/helpers/Modal.vue'
import { useTelescopisStore } from '../store/telescopiusStore'
import { handleApiError } from '@/utils/utils'

const { t: $t } = useI18n()

const emit = defineEmits(['close'])

defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const telescopiusStore = useTelescopisStore()
const localApiKey = ref('')
const isLoading = ref(false)

const hasCurrentApiKey = computed(() => telescopiusStore.hasApiKey)

onMounted(async () => {
  if (!telescopiusStore.isLoaded) {
    await telescopiusStore.loadApiKey()
  }
})

async function saveApiKey() {
  if (!localApiKey.value.trim()) return
  
  isLoading.value = true
  try {
    await telescopiusStore.saveApiKey(localApiKey.value.trim())
    localApiKey.value = ''
    emit('close')
  } catch (error) {
    handleApiError(error.response?.data, {
      title: 'Fehler beim Speichern',
      defaultMessage: $t('plugins.telescopius.apiKey.errors.saveFailed')
    })
  } finally {
    isLoading.value = false
  }
}

async function deleteApiKey() {
  isLoading.value = true
  try {
    await telescopiusStore.deleteApiKey()
    localApiKey.value = ''
    emit('close')
  } catch (error) {
    handleApiError(error.response?.data, {
      title: 'Fehler beim Löschen',
      defaultMessage: $t('plugins.telescopius.apiKey.errors.deleteFailed')
    })
  } finally {
    isLoading.value = false
  }
}
</script>