<template>
<div>
  <p>Letzte WebSocket Nachricht:</p>
  <pre>{{ lastMessage || 'Keine Nachricht empfangen' }}</pre>
</div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import websocketService from '@/services/websocketTppa';

const lastMessage = ref(null);

onMounted(() => {
  websocketService.setMessageCallback((message) => {
    lastMessage.value = JSON.stringify(message, null, 2);
  });
});

onUnmounted(() => {
  websocketService.setMessageCallback(null);
});
</script>