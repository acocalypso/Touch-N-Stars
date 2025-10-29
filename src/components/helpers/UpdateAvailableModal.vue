<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
  >
    <div
      class="relative mx-4 w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-500/40 bg-gray-900 shadow-2xl"
    >
      <div class="p-6 sm:p-8">
        <div class="mb-6 flex items-start gap-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-cyan-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="m5 13 4 4L19 7"
              />
            </svg>
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-semibold text-white">{{ t('updates.title') }}</h2>
            <p class="mt-2 text-sm text-gray-300">
              {{ t('updates.description', { version }) }}
            </p>
          </div>
        </div>

        <div
          v-if="releaseNotes"
          class="mb-6 max-h-52 overflow-y-auto rounded-xl border border-gray-700 bg-gray-800/60 p-4 text-sm text-gray-200"
        >
          <p class="mb-2 font-semibold text-gray-100">{{ t('updates.releaseNotes') }}</p>
          <pre
            class="whitespace-pre-wrap font-sans leading-relaxed text-gray-300"
            v-text="releaseNotes"
          ></pre>
        </div>

        <div v-if="status === 'downloading'" class="mb-6">
          <p class="mb-2 text-sm text-gray-300">
            {{ t('updates.downloading', { progress: formattedProgress }) }}
          </p>
          <div class="h-2 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              class="h-full rounded-full bg-cyan-400 transition-all duration-200"
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div>

        <div v-if="status === 'setting'" class="mb-4 text-sm text-gray-300">
          {{ t('updates.preparing') }}
        </div>

        <p v-if="error" class="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
          {{ error }}
        </p>

        <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-xl border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-gray-500 hover:text-white disabled:cursor-not-allowed disabled:border-gray-800 disabled:text-gray-500"
            :disabled="isBusy"
            @click="$emit('cancel')"
          >
            {{ t('updates.later') }}
          </button>
          <button
            type="button"
            class="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-800 disabled:text-gray-200"
            :disabled="isBusy"
            @click="$emit('confirm')"
          >
            <span v-if="isBusy">{{ t('updates.working') }}</span>
            <span v-else>{{ t('updates.updateNow') }}</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        class="absolute right-4 top-4 rounded-full bg-gray-800/80 p-2 text-gray-400 transition hover:text-white"
        :disabled="isBusy"
        @click="$emit('cancel')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  version: {
    type: String,
    required: true,
  },
  releaseNotes: {
    type: String,
    default: '',
  },
  progress: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    default: 'idle',
  },
  error: {
    type: String,
    default: '',
  },
});

defineEmits(['confirm', 'cancel']);

const busyStatuses = new Set(['downloading', 'setting']);

const isBusy = computed(() => busyStatuses.has(props.status));
const formattedProgress = computed(() => Math.round(props.progress));

const { t } = useI18n();
</script>
