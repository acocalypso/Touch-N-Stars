<template>
  <div>
    <!-- Modal Trigger -->
    <button
      @click="isModalOpen = true"
      class="fixed bottom-12 right-3 p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md z-10"
      v-if="tppaStore.isTppaRunning"
    >
      <MagnifyingGlassIcon class="w-6 h-6 text-white" />
    </button>

    <!-- Modal Overlay -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      @click.self="isModalOpen = false"
    >
      <div
        class="bg-gray-800 text-white p-4 rounded-lg min-w-[400px] max-w-4xl max-h-[80vh] overflow-y-auto"
        @click.stop
      >
        <div class="flex justify-end items-center">
          <button @click="isModalOpen = false" class="text-white hover:text-gray-300">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        <div v-if="tppaStore.currentMessage && tppaStore.showAzimuthError">
          <div class="space-y-4">
            <div class="flex flex-col bg-gray-700 p-2 rounded-xl w-full">
              <!-- AltitudeError -->
              <p class="text-xs text-gray-400">
                {{ $t('components.tppa.altitude_error') }}
              </p>
              <div
                class="flex flex-row justify-between text-5xl xs:text-6xl sm:text-7xl md:text-8xl xl:text-9xl"
              >
                <p>{{ tppaStore.showAltitudeError }}</p>
                <div v-if="tppaStore.showAltitudeError">
                  <div
                    v-if="tppaStore.altitudeCorDirectionTop && !tppaStore.isSouthernHemisphere"
                    class="flex flex-row space-x-2"
                  >
                    <ArrowUpIcon class="size-16 sm:size-20 md:size-28 xl:size-36 text-blue-500" />
                  </div>
                  <div
                    v-if="!tppaStore.altitudeCorDirectionTop && !tppaStore.isSouthernHemisphere"
                    class="flex flex-row space-x-2"
                  >
                    <ArrowDownIcon class="size-16 sm:size-20 md:size-28 xl:size-36 text-blue-500" />
                  </div>
                  <div
                    v-if="!tppaStore.altitudeCorDirectionTop && tppaStore.isSouthernHemisphere"
                    class="flex flex-row space-x-2"
                  >
                    <ArrowUpIcon class="size-16 sm:size-20 md:size-28 xl:size-36 text-blue-500" />
                  </div>
                  <div
                    v-if="tppaStore.altitudeCorDirectionTop && tppaStore.isSouthernHemisphere"
                    class="flex flex-row space-x-2"
                  >
                    <ArrowDownIcon class="size-16 sm:size-20 md:size-28 xl:size-36 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
            <div class="flex space-x-4">
              <!-- AzimuthError -->
              <div class="flex flex-col bg-gray-700 p-2 rounded-xl w-full">
                <p class="text-xs text-gray-400">
                  <strong>{{ $t('components.tppa.azimuth_error') }}</strong>
                </p>
                <div
                  class="flex flex-row justify-between text-5xl xs:text-6xl sm:text-7xl md:text-8xl xl:text-9xl"
                >
                  <p>{{ tppaStore.showAzimuthError }}</p>
                  <div v-if="tppaStore.showAzimuthError">
                    <div
                      v-if="tppaStore.azimuthCorDirectionLeft && !tppaStore.isSouthernHemisphere"
                      class="flex flex-row space-x-2"
                    >
                      <ArrowLeftIcon
                        class="size-16 sm:size-20 md:size-28 xl:size-36 text-blue-500"
                      />
                    </div>
                    <div
                      v-if="!tppaStore.azimuthCorDirectionLeft && !tppaStore.isSouthernHemisphere"
                      class="flex flex-row space-x-2"
                    >
                      <ArrowRightIcon
                        class="size-16 sm:size-20 md:size-28 xl:size-36 text-blue-500"
                      />
                    </div>
                    <div
                      v-if="!tppaStore.azimuthCorDirectionLeft && tppaStore.isSouthernHemisphere"
                      class="flex flex-row space-x-2"
                    >
                      <ArrowRightIcon
                        class="size-16 sm:size-20 md:size-28 xl:size-36 text-blue-500"
                      />
                    </div>
                    <div
                      v-if="tppaStore.azimuthCorDirectionLeft && tppaStore.isSouthernHemisphere"
                      class="flex flex-row space-x-2"
                    >
                      <ArrowLeftIcon
                        class="size-16 sm:size-20 md:size-28 xl:size-36 text-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex space-x-4">
              <!-- TotalError -->
              <div class="flex flex-col bg-gray-700 p-2 rounded-xl w-full">
                <p class="text-xs text-gray-400">
                  <strong>{{ $t('components.tppa.total_error') }}</strong>
                </p>
                <div
                  class="flex flex-row justify-between text-5xl xs:text-6xl sm:text-7xl md:text-8xl xl:text-9xl"
                >
                  <p>{{ tppaStore.showTotalError }}</p>
                  <!-- Smiley Display -->
                  <span v-if="tppaStore.showTotalError">
                    <span v-if="tppaStore.isWithinTolerance">
                      <!-- Happy SVG -->
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="size-16 sm:size-20 md:size-28 xl:size-36 text-green-500 ml-5"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 23.25C18.2132 23.25 23.25 18.2132 23.25 12C23.25 5.7868 18.2132 0.75 12 0.75C5.7868 0.75 0.75 5.7868 0.75 12C0.75 18.2132 5.7868 23.25 12 23.25Z"
                          stroke="#71717A"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M11.9982 18.7542C13.2563 18.7542 14.4893 18.4027 15.5583 17.7394C16.6202 17.0804 17.4782 16.1399 18.0371 15.0224L5.94824 15C6.50681 16.1273 7.3692 17.076 8.43818 17.7394C9.50715 18.4027 10.7402 18.7542 11.9982 18.7542Z"
                          stroke="#71717A"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M18.75 10.5005C18.595 10.0617 18.3077 9.68178 17.9278 9.41305C17.5478 9.14432 17.0939 9.00001 16.6285 9.00001C16.1631 9.00001 15.7092 9.14432 15.3292 9.41305C14.9572 9.67617 14.6741 10.0459 14.5169 10.4731"
                          stroke="#71717A"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M5.25004 10.5005C5.40506 10.0617 5.69233 9.68178 6.07228 9.41305C6.45223 9.14432 6.90616 9.00001 7.37154 9.00001C7.83692 9.00001 8.29085 9.14432 8.6708 9.41305C9.04416 9.67713 9.32804 10.0486 9.48486 10.4778"
                          stroke="#71717A"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                    <span v-else>
                      <!-- Sad SVG -->
                      <svg
                        viewBox="0 0 256 256"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="size-16 sm:size-20 md:size-28 xl:size-36 text-red-500 ml-5"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="128" cy="128" r="100" stroke="currentColor" />
                        <path d="M160 160c-10-10-20-15-32-15s-22 5-32 15" stroke="currentColor" />
                        <path d="M96 96h0" stroke="currentColor" />
                        <path d="M160 96h0" stroke="currentColor" />
                      </svg>
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="tppaStore.showAzimuthError" class="flex justify-center pt-2">
          <ButtonPause class="w-28 h-28" />
        </div>
        <div
          v-if="tppaStore.isTppaRunning"
          class="bg-gray-800 p-5 m-5 border border-gray-500 rounded-md"
        >
          <TppaLastStatus />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { useTppaStore } from '@/store/tppaStore';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/vue/24/outline';
import TppaLastStatus from '@/components/tppa/TppaLastStatus.vue';
import ButtonPause from '@/components/tppa/ButtonPause.vue';

const tppaStore = useTppaStore();
const isModalOpen = ref(false);
</script>
