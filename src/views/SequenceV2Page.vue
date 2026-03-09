<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-6">
    <div class="max-w-6xl mx-auto">
      <div class="backdrop-blur-sm bg-gray-800/50 rounded-xl p-4 shadow-xl">
        <SequenceCurrentView />
      </div>
    </div>
  </div>
</template>

<script setup>
import SequenceCurrentView from '@/components/sequence/SequenceCurrentView.vue';
</script>
