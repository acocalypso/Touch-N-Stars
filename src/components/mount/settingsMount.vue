<template>
  <SettingsSerialConnection equipmentType="mount" :selectedDevice="selectedMountDevice" />
</template>

<script setup>
import SettingsSerialConnection from '@/components/equipment/SettingsSerialConnection.vue';

defineProps({
  selectedMountDevice: { type: String, default: '' },
});
</script>
