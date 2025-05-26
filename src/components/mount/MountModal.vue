<template>

  <div class="container flex items-center justify-center">
    <div class="container max-w-md landscape:max-w-xl">

      <div v-if="store.mountInfo.Connected">
        <div
          class="mt-4 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg"
        >
          <div class="container pl-5 pb-5 pr-5">
            <div class="mt-5">
              <controlMount />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import controlMount from '@/components/mount/controlMount.vue';
import { apiStore } from '@/store/store';

const store = apiStore();
</script>

<style scoped></style>
