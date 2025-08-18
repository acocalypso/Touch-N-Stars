<template>
  <div>
    <button class="default-button-gray" @click="markBad(index)">
      <p><HandThumbDownIcon class="h-6" /></p>
    </button>
  </div>
</template>
<script setup>
import apiService from '@/services/apiService';
import { HandThumbDownIcon } from '@heroicons/vue/24/outline';

defineProps({
  index: Number,
});

async function markBad(index) {
  try {
    const response = await apiService.imageAction(index, 'prefix?prefix=BAD_');
    console.log('Mark Bad', index, response);
  } catch (error) {
    console.log('Error while setting the switch');
  }
}
</script>
