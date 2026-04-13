<template>
  <div class="flex flex-col space-y-6">
    <PinsSambaCard
      :enabled="sambaEnabled"
      :disabled="disabled"
      @toggle="$emit('toggle-samba', $event)"
    />

    <PinsPhd2Card
      :enabled="phd2Enabled"
      :running="phd2Running"
      :disabled="disabled"
      @toggle="$emit('toggle-phd2', $event)"
    />
  </div>
</template>

<script setup>
import PinsSambaCard from '../PinsSambaCard.vue';
import PinsPhd2Card from '../PinsPhd2Card.vue';

defineProps({
  sambaEnabled: {
    type: Boolean,
    required: true,
  },
  phd2Enabled: {
    type: Boolean,
    required: true,
  },
  phd2Running: {
    type: Boolean,
    required: true,
  },
  disabled: {
    type: Boolean,
    required: true,
  },
});

defineEmits(['toggle-samba', 'toggle-phd2']);
</script>
