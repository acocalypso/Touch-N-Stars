<template>
  <!-- Kompakte Grid-Layout für mobile Geräte -->
  <div class="grid grid-cols-2 gap-3 w-full">
    
    <!-- FOV Bereich -->
    <div class="col-span-2 sm:col-span-1">
      <div class="flex flex-col space-y-2 p-3 border border-gray-600 rounded-lg bg-gray-800/50">
        <div class="flex items-center justify-between">
          <label class="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {{ $t('components.framing.fovSettings.fov') }}
          </label>
          <div class="flex items-center space-x-1">
            <span v-if="framingStore.fov > 20" class="text-xs text-orange-400">!</span>
            <span class="text-xs text-gray-500">°</span>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <input
            class="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-cyan-500 focus:outline-none"
            type="number"
            v-model="framingStore.fov"
            min="0.1"
            max="180"
            step="0.1"
            @focus="$event.target.select()"
          />
          <div class="flex space-x-1">
            <button 
              @click="adjustFov(-0.5)"
              class="w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs font-bold transition-colors"
            >-</button>
            <button 
              @click="adjustFov(0.5)"
              class="w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs font-bold transition-colors"
            >+</button>
          </div>
        </div>
        <!-- Kompakter FOV Range-Slider (häufig genutzte Werte 0.1-20°) -->
        <input
          class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          type="range"
          min="0.1"
          max="20"
          step="0.1"
          :value="Math.min(framingStore.fov, 20)"
          @input="updateFovFromSlider($event.target.value)"
        />
      </div>
    </div>

    <!-- Rotation Bereich -->
    <div class="col-span-2 sm:col-span-1">
      <div class="flex flex-col space-y-2 p-3 border border-gray-600 rounded-lg bg-gray-800/50">
        <div class="flex items-center justify-between">
          <label class="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {{ $t('components.framing.fovSettings.rotationAngle') }}
          </label>
          <span class="text-xs text-gray-500">°</span>
        </div>
        <div class="flex items-center space-x-2">
          <input
            class="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-cyan-500 focus:outline-none"
            type="number"
            v-model="framingStore.rotationAngle"
            min="0"
            max="360"
            step="1"
            @focus="$event.target.select()"
          />
          <div class="flex space-x-1">
            <button 
              @click="adjustRotation(-5)"
              class="w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs font-bold transition-colors"
            >-</button>
            <button 
              @click="adjustRotation(5)"
              class="w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs font-bold transition-colors"
            >+</button>
          </div>
        </div>
        <!-- Kompakter Range-Slider -->
        <input
          class="w-full h-1 bg-gray-600 rounded-lg appearance-none slider"
          type="range"
          min="0"
          max="360"
          v-model="framingStore.rotationAngle"
        />
      </div>
    </div>

    <!-- getImageRotation Komponente -->
    <div class="col-span-2">
      <getImageRotation />
    </div>

    <!-- Schließen Button -->
    <div class="col-span-2">
      <button
        class="flex items-center justify-center w-full h-10 bg-cyan-900/20 hover:bg-cyan-900/30 border border-green-500/50 hover:border-green-400 rounded-lg text-green-400 font-medium transition-all duration-200"
        @click="framingStore.showFramingModal = false"
      >
        <CheckCircleIcon class="w-5 h-5 mr-2" />
        <span class="text-sm">{{ $t('common.done') || 'Fertig' }}</span>
      </button>
    </div>
  </div>
</template>
<script setup>
import { useFramingStore } from '@/store/framingStore';
import getImageRotation from '@/components/framing/getImageRotation.vue';
import { CheckCircleIcon } from '@heroicons/vue/24/outline';

const framingStore = useFramingStore();

// FOV Anpassung mit +/- Buttons
function adjustFov(delta) {
  const newValue = parseFloat(framingStore.fov) + delta;
  framingStore.fov = Math.max(0.1, Math.min(180, Math.round(newValue * 10) / 10));
}

// FOV Update vom Slider (nur für Werte 0.1-20°)
function updateFovFromSlider(value) {
  framingStore.fov = parseFloat(value);
}

// Rotation Anpassung mit +/- Buttons
function adjustRotation(delta) {
  let newValue = parseInt(framingStore.rotationAngle) + delta;
  // Wrap around: 0-360 Grad
  if (newValue < 0) newValue += 360;
  if (newValue >= 360) newValue -= 360;
  framingStore.rotationAngle = newValue;
}
</script>

<style scoped>
/* Custom Slider Styling */
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: #06b6d4; /* cyan-500 */
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: #06b6d4; /* cyan-500 */
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-webkit-slider-track {
  height: 4px;
  border-radius: 2px;
  background: #4b5563; /* gray-600 */
}

.slider::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: #4b5563; /* gray-600 */
  border: none;
}
</style>
