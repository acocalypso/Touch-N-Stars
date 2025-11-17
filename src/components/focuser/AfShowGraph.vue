<template>
  <AfLiveGraph v-if="store.checkVersionNewerOrEqual(store.currentApiVersion,'2.2.11.0')" />
  <AfGraphNinaFocus v-else-if="!isHocusFocus" />
  <AfGraphHocusFocus v-else />
</template>

<script setup>
import { ref, watch } from 'vue';
import AfGraphHocusFocus from '@/components/focuser/AfGraphHocusFocus.vue';
import AfGraphNinaFocus from '@/components/focuser/AfGraphNinaFocus.vue';
import AfLiveGraph from './AfLiveGraph.vue';
import { useLogStore } from '@/store/logStore';
import { apiStore } from '@/store/store';

const logStore = useLogStore();
const store = apiStore();
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
        //console.log('Hocus Focus running');
      }
    }
  },
  { deep: true }
);
</script>
