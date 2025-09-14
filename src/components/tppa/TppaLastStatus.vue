<template>
<div>
  <p>{{ statusText }}</p>
  <p v-if="progressPercent !== null">{{ progressPercent }}%</p>
</div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import websocketService from '@/services/websocketTppa';

const lastMessage = ref(null);

const statusText = computed(() => {
  if (!lastMessage.value?.Response?.Status) return 'Keine Nachricht empfangen';
  return lastMessage.value.Response.Status;
});

const progressPercent = computed(() => {
  if (!lastMessage.value?.Response?.Progress || lastMessage.value.Response.Progress === -1) return null;
  return Math.round(lastMessage.value.Response.Progress * 100);
});

onMounted(() => {
  websocketService.setMessageCallback((message) => {
    lastMessage.value = message;
  });
});

onUnmounted(() => {
  websocketService.setMessageCallback(null);
});
</script>