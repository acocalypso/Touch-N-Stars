<template>
  <div class="relative">
    <div
      class="grid grid-cols-3 gap-1 sm:gap-4 p-1 sm:p-4 place-items-center w-40 sm:w-64 mx-auto move-axis-grid"
    >
      <!-- Obere Reihe (Nord) -->
      <div></div>
      <button
        @mousedown="sendCommand('north')"
        @mouseup="sendStop"
        @mouseleave="sendStop"
        @touchstart.prevent="sendCommand('north')"
        @touchend.prevent="sendStop"
        @touchcancel="sendStop"
        @contextmenu.prevent
        class="btn"
        :class="mountStore.lastDirection === 'north' ? 'glow-green' : ''"
      >
        <ArrowUpCircleIcon
          :class="mountStore.lastDirection === 'north' ? 'text-green-500' : 'text-gray-400'"
          class="w-6 h-6 sm:w-12 sm:h-12 move-axis-icon"
        />
      </button>
      <div></div>

      <!-- Mittlere Reihe (West, Stop, Ost) -->
      <button
        @mousedown="sendCommand('west')"
        @mouseup="sendStop"
        @mouseleave="sendStop"
        @touchstart.prevent="sendCommand('west')"
        @touchend.prevent="sendStop"
        @touchcancel="sendStop"
        @contextmenu.prevent
        class="btn"
        :class="mountStore.lastDirection === 'west' ? 'glow-green' : ''"
      >
        <ArrowLeftCircleIcon
          :class="mountStore.lastDirection === 'west' ? 'text-green-500' : 'text-gray-400'"
          class="w-6 h-6 sm:w-12 sm:h-12 move-axis-icon"
        />
      </button>
      <button @click="sendStop" class="btn btn-stop">
        <StopCircleIcon
          class="w-6 h-6 sm:w-12 sm:h-12 move-axis-icon"
          :class="mountStore.lastDirection === '' ? 'text-red-500' : 'text-gray-400'"
        />
      </button>
      <button
        @mousedown="sendCommand('east')"
        @mouseup="sendStop"
        @mouseleave="sendStop"
        @touchstart.prevent="sendCommand('east')"
        @touchend.prevent="sendStop"
        @touchcancel="sendStop"
        @contextmenu.prevent
        class="btn"
        :class="mountStore.lastDirection === 'east' ? 'glow-green' : ''"
      >
        <ArrowRightCircleIcon
          :class="mountStore.lastDirection === 'east' ? 'text-green-500' : 'text-gray-400'"
          class="w-6 h-6 sm:w-12 sm:h-12 move-axis-icon"
        />
      </button>

      <!-- Untere Reihe (Süd) -->
      <div></div>
      <button
        @mousedown="sendCommand('south')"
        @mouseup="sendStop"
        @mouseleave="sendStop"
        @touchstart.prevent="sendCommand('south')"
        @touchend.prevent="sendStop"
        @touchcancel="sendStop"
        @contextmenu.prevent
        class="btn"
        :class="mountStore.lastDirection === 'south' ? 'glow-green' : ''"
      >
        <ArrowDownCircleIcon
          :class="mountStore.lastDirection === 'south' ? 'text-green-500' : 'text-gray-400'"
          class="w-6 h-6 sm:w-12 sm:h-12 move-axis-icon"
        />
      </button>
    </div>
    <div
      class="flex flex-col bg-gray-900/80 w-full border border-gray-300 p-1 sm:p-2 mt-1 rounded-xl gap-1"
    >
      <div class="flex flex-col w-full gap-1">
        <div>
          <p class="text-xs sm:text-sm min-w-24 sm:min-w-32 font-medium text-gray-500">
            {{ $t('components.mount.control.slewRate') }}
          </p>
        </div>
        <div class="flex flex-row w-full justify-center gap-1 sm:gap-2">
          <button
            class="btn min-w-8 sm:min-w-12 text-xs sm:text-sm"
            @click="settingsStore.mount.slewRate = 0.017"
          >
            4x
          </button>
          <button
            class="btn min-w-8 sm:min-w-12 text-xs sm:text-sm"
            @click="settingsStore.mount.slewRate = 0.067"
          >
            16x
          </button>
          <button
            class="btn min-w-8 sm:min-w-12 text-xs sm:text-sm"
            @click="settingsStore.mount.slewRate = 0.133"
          >
            32x
          </button>
          <button
            class="btn min-w-8 sm:min-w-12 text-xs sm:text-sm"
            @click="settingsStore.mount.slewRate = 0.267"
          >
            62x
          </button>
        </div>
      </div>
      <div class="flex flex-row w-full items-center">
        <input
          class="w-full mx-1 sm:mx-2"
          type="range"
          min="0.01"
          max="5"
          step="0.001"
          v-model="settingsStore.mount.slewRate"
        />
        <input
          class="default-input w-16 sm:w-20 h-6 sm:h-8 text-xs sm:text-sm"
          type="number"
          v-model="settingsStore.mount.slewRate"
          min="0.001"
          max="3"
          step="0.001"
        />
      </div>
    </div>

    <!-- Loading Overlay -->
    <div 
      v-if="!mountStore.wsIsConnected" 
      class="absolute inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center rounded-xl z-10"
    >
      <div class="flex flex-col items-center space-y-3">
        <!-- Spinner -->
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        <p class="text-gray-300 text-sm">Connecting...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import websocketMountControl from '@/services/websocketMountControl';
import { useMountStore } from '@/store/mountStore';
import { useSettingsStore } from '@/store/settingsStore';
import {
  ArrowRightCircleIcon,
  ArrowLeftCircleIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  StopCircleIcon,
} from '@heroicons/vue/24/outline';

const mountStore = useMountStore();
const settingsStore = useSettingsStore();
let commandInterval = null; // Speichert das Intervall

const sendCommand = (direction) => {
  if (!websocketMountControl.socket || websocketMountControl.socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket ist nicht verbunden.');
    return;
  }

  mountStore.lastDirection = direction;

  const sendMessage = () => {
    console.log('sendMessage');
    const message = {
      direction: direction,
      rate: settingsStore.mount.slewRate,
    };

    websocketMountControl.socket.send(JSON.stringify(message));
    console.log(`WS-Befehl gesendet:`, message);
  };

  sendMessage(); // Sende den Befehl sofort
  commandInterval = setInterval(sendMessage, 800); // Wiederhole jede Sekunde
};

const sendStop = () => {
  if (!mountStore.lastDirection) {
    console.log('Kein vorheriger Befehl zum Stoppen.');
    return;
  }

  if (!websocketMountControl.socket || websocketMountControl.socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket ist nicht verbunden.');
    return;
  }

  clearInterval(commandInterval); // Stoppe das Wiederholen
  commandInterval = null;

  const message = {
    direction: mountStore.lastDirection,
    rate: 0,
  };

  websocketMountControl.socket.send(JSON.stringify(message));
  console.log(`WS-Stop-Befehl gesendet.`);
  mountStore.lastDirection = '';
};

onMounted(() => {
  websocketMountControl.setStatusCallback((status) => {
    console.log('Status aktualisiert:', status);
    if (status === 'connected') {
      mountStore.wsIsConnected = true;
    }
  });
  websocketMountControl.connect();
});

onBeforeUnmount(() => {
  websocketMountControl.setStatusCallback(null);
  websocketMountControl.setMessageCallback(null);
  websocketMountControl.disconnect();
  mountStore.lastDirection = '';
  mountStore.wsIsConnected = false;
});
</script>

<style scoped>
.btn {
  border-radius: 1rem;
  background-color: #334155;
  padding: 0.25rem;
  box-shadow: 0 2px 15px black;
  border: 1px solid #0a0a0a;
}

@media (min-width: 640px) {
  .btn {
    padding: 0.5rem;
  }
}

/* Landscape-Modus Anpassungen für kleine Bildschirme */
@media screen and (orientation: landscape) and (max-height: 600px) {
  .move-axis-grid {
    width: 12rem; /* w-48 */
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .move-axis-icon {
    width: 2.25rem; /* w-9 */
    height: 2.25rem; /* h-9 */
  }

  .btn {
    padding: 0.375rem;
  }
}
.glow-green {
  box-shadow: 0 0 10px #00ff00;
}
.glow-red {
  box-shadow: 0 0 10px rgb(255, 0, 0); /* Roter Schein */
}
</style>
