<template>
  <div v-for="(WritableSwitche, index) in store.switchInfo.WritableSwitches" :key="index">
    <div v-if="WritableSwitche.Maximum === 1.0">
      <div
        class="flex flex-row items-center justify-between w-full border border-gray-300 p-3 rounded-xl transition-all duration-200 hover:border-cyan-500 focus-within:border-cyan-500 hover:shadow-lg md:p-4"
      >
        <div>
          <p class="text-sm font-medium text-gray-400 md:text-base">{{ WritableSwitche.Name }}</p>
          <p class="text-xs text-gray-700 mt-1">{{ WritableSwitche.Description }}</p>
        </div>
        <toggleButton
          @click="setBool(index, WritableSwitche.Value)"
          :status-value="WritableSwitche.TargetValue === 1"
        />
      </div>
    </div>
  </div>
  <div v-for="(WritableSwitche, index) in store.switchInfo.WritableSwitches" :key="index">
    <div v-if="WritableSwitche.Maximum > 1.0">
      <div
        class="flex flex-row items-center justify-between w-full border border-gray-300 p-3 rounded-xl transition-all duration-200 hover:border-cyan-500 focus-within:border-cyan-500 hover:shadow-lg md:p-4"
      >
        <div>
          <p class="text-sm font-medium text-gray-400 md:text-base">{{ WritableSwitche.Name }}</p>
          <p class="text-xs text-gray-700 mt-1">{{ WritableSwitche.Description }}</p>
        </div>
        <SetValue
          @blur="setValue(index, $event, WritableSwitche.Minimum, WritableSwitche.Maximum)"
          :store-value="WritableSwitche.Value"
          :min="WritableSwitche.Minimum"
          :max="WritableSwitche.Maximum"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import toggleButton from '@/components/helpers/toggleButton.vue';
import SetValue from '@/components/switch/SetValue.vue';

const store = apiStore();

async function setBool(id, value) {
  try {
    console.log('id: ', id, 'value: ', value);
    if (value === 1.0) {
      await apiService.setSwitch(id, 0);
      console.log('Switch off ID: ', id);
    } else {
      await apiService.setSwitch(id, 1);
      console.log('Switch on ID: ', id);
    }
  } catch (error) {
    console.log('Error while setting the switch');
  }
}

async function setValue(id, value, valueMin, valueMax) {
  try {
    if (value < valueMin) {
      value = valueMin;
    }
    if (value > valueMax) {
      value = valueMax;
    }
    await apiService.setSwitch(id, value);
    console.log('Value set: ', value);
  } catch (error) {
    console.log('Error while setting the switch');
  }
}
</script>
