<template>
  <AfGraphNinaFocus v-if="!isHocusFocus" />
  <AfGraphHocusFocus v-else />
</template>

<script setup>
import { ref, watch } from 'vue';
import AfGraphHocusFocus from '@/components/focuser/AfGraphHocusFocus.vue';
import AfGraphNinaFocus from '@/components/focuser/AfGraphNinaFocus.vue';
import { useLogStore } from '@/store/logStore';

const logStore = useLogStore();
const isHocusFocus = ref(false);

watch(
  () => logStore.LogsInfo.logs,
  (newLogs) => {
    if (!newLogs || newLogs.length === 0) return;

    const sortedLogs = [...newLogs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const entry of sortedLogs) {
      const startMatch = entry.message.match(/Starting AutoFocus with initial position (\d+)/);
      if (startMatch) {
        isHocusFocus.value = true;
        console.log('Hocus Focus läuft');
      } 
    }


  },
  { deep: true }
);
</script>
