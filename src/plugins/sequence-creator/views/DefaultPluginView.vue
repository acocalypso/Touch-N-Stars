<template>
  <div class="plugin-view h-screen bg-gray-100 dark:bg-gray-900">
    <SequenceEditor />
  </div>
</template>

<script setup>
import SequenceEditor from '../components/SequenceEditor.vue';
</script>

<style scoped>
.plugin-view {
  min-height: 100vh;
  overflow: hidden;
}
</style>
