<template>
  <div class="relative">
    <div
      class="grid grid-cols-3 gap-2 sm:gap-4 p-2 sm:p-4 place-items-center w-48 sm:w-64 mx-auto move-axis-grid"
    >
      <!-- Obere Reihe (Nord) -->
      <div></div>
      <button
        @mousedown="sendCommand('north')"
        @mouseup="sendStop"
        @mouseleave="sendStop"
        @touchstart.prevent="handleTouchStart('north', $event)"
        @touchend.prevent="handleTouchEnd"
        @touchcancel.prevent="handleTouchEnd"
        @blur="sendStop"
        @contextmenu.prevent
        class="btn"
        :class="mountStore.lastDirection === 'north' ? 'glow-green' : ''"
      >
        <ArrowUpCircleIcon
          :class="mountStore.lastDirection === 'north' ? 'text-green-500' : 'text-gray-400'"
          class="w-8 h-8 sm:w-12 sm:h-12 move-axis-icon"
        />
      </button>
      <div></div>

      <!-- Mittlere Reihe (West, Stop, Ost) -->
      <button
        @mousedown="sendCommand('west')"
        @mouseup="sendStop"
        @mouseleave="sendStop"
        @touchstart.prevent="handleTouchStart('west', $event)"
        @touchend.prevent="handleTouchEnd"
        @touchcancel.prevent="handleTouchEnd"
        @blur="sendStop"
        @contextmenu.prevent
        class="btn"
        :class="mountStore.lastDirection === 'west' ? 'glow-green' : ''"
      >
        <ArrowLeftCircleIcon
          :class="mountStore.lastDirection === 'west' ? 'text-green-500' : 'text-gray-400'"
          class="w-8 h-8 sm:w-12 sm:h-12 move-axis-icon"
        />
      </button>
      <button @click="sendStop" class="btn btn-stop" :disabled="!mountStore.wsIsConnected">
        <StopCircleIcon
          class="w-8 h-8 sm:w-12 sm:h-12 move-axis-icon"
          :class="mountStore.lastDirection === '' ? 'text-red-500' : 'text-gray-400'"
        />
      </button>
      <button
        @mousedown="sendCommand('east')"
        @mouseup="sendStop"
        @mouseleave="sendStop"
        @touchstart.prevent="handleTouchStart('east', $event)"
        @touchend.prevent="handleTouchEnd"
        @touchcancel.prevent="handleTouchEnd"
        @blur="sendStop"
        @contextmenu.prevent
        class="btn"
        :class="mountStore.lastDirection === 'east' ? 'glow-green' : ''"
      >
        <ArrowRightCircleIcon
          :class="mountStore.lastDirection === 'east' ? 'text-green-500' : 'text-gray-400'"
          class="w-8 h-8 sm:w-12 sm:h-12 move-axis-icon"
        />
      </button>

      <!-- Untere Reihe (Süd) -->
      <div></div>
      <button
        @mousedown="sendCommand('south')"
        @mouseup="sendStop"
        @mouseleave="sendStop"
        @touchstart.prevent="handleTouchStart('south', $event)"
        @touchend.prevent="handleTouchEnd"
        @touchcancel.prevent="handleTouchEnd"
        @blur="sendStop"
        @contextmenu.prevent
        class="btn"
        :class="mountStore.lastDirection === 'south' ? 'glow-green' : ''"
      >
        <ArrowDownCircleIcon
          :class="mountStore.lastDirection === 'south' ? 'text-green-500' : 'text-gray-400'"
          class="w-8 h-8 sm:w-12 sm:h-12 move-axis-icon"
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
        <div class="flex flex-row w-full justify-center gap-1">
          <button
            class="btn-small text-xs"
            @click="settingsStore.mount.slewRate = 0.017"
          >
            4x
          </button>
          <button
            class="btn-small text-xs"
            @click="settingsStore.mount.slewRate = 0.067"
          >
            16x
          </button>
          <button
            class="btn-small text-xs"
            @click="settingsStore.mount.slewRate = 0.133"
          >
            32x
          </button>
          <button
            class="btn-small text-xs"
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
          class="default-input w-12 sm:w-16 h-6 sm:h-7 text-xs"
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
      class="absolute inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center rounded-xl z-50"
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
let failsafeTimeout = null; // Sicherheits-Timeout

const sendCommand = (direction) => {
  console.log('sendCommand called for:', direction);
  console.log('WebSocket exists:', !!websocketMountControl.socket);
  console.log('WebSocket state:', websocketMountControl.socket?.readyState);
  console.log('WebSocket OPEN constant:', WebSocket.OPEN);
  console.log('WebSocket connected:', mountStore.wsIsConnected);
  console.log('WebSocket comparison:', websocketMountControl.socket?.readyState === WebSocket.OPEN);
  
  // Prüfe zuerst den Store-Status
  if (!mountStore.wsIsConnected) {
    console.error('WebSocket ist nicht verbunden (Store).');
    return;
  }
  
  // Vereinfachte Überprüfung - nur auf readyState 1 (OPEN) prüfen
  if (!websocketMountControl.socket || websocketMountControl.socket.readyState !== 1) {
    console.error('WebSocket ist nicht verbunden (Socket). State:', websocketMountControl.socket?.readyState);
    return;
  }

  mountStore.lastDirection = direction;

  const sendMessage = () => {
    if (!websocketMountControl.socket || websocketMountControl.socket.readyState !== 1) {
      console.error('WebSocket verloren während Befehl. State:', websocketMountControl.socket?.readyState);
      clearInterval(commandInterval);
      commandInterval = null;
      return;
    }
    
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
  
  // Sicherheits-Timeout: Stoppt automatisch nach 30 Sekunden
  if (failsafeTimeout) {
    clearTimeout(failsafeTimeout);
  }
  failsafeTimeout = setTimeout(() => {
    console.log('FAILSAFE: Automatischer Stop nach 30s');
    sendStop();
  }, 30000);
};

// Spezielle Touch-Handler für Android
const handleTouchStart = (direction, event) => {
  console.log('handleTouchStart:', direction);
  
  // Verhindere alle Standard-Browser-Aktionen
  event.preventDefault();
  event.stopPropagation();
  
  // Entferne jegliche Text-Selektion
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  }
  
  // Starte Bewegung
  sendCommand(direction);
};

const handleTouchEnd = (event) => {
  console.log('handleTouchEnd');
  
  // Verhindere alle Standard-Browser-Aktionen
  event.preventDefault();
  event.stopPropagation();
  
  // Stoppe Bewegung
  sendStop();
};

const sendStop = () => {
  console.log('sendStop called');
  
  if (!mountStore.lastDirection) {
    console.log('Kein vorheriger Befehl zum Stoppen.');
    return;
  }

  // Stoppe das Intervall auf jeden Fall
  if (commandInterval) {
    clearInterval(commandInterval);
    commandInterval = null;
    console.log('Command interval cleared');
  }
  
  // Stoppe auch das Failsafe-Timeout
  if (failsafeTimeout) {
    clearTimeout(failsafeTimeout);
    failsafeTimeout = null;
    console.log('Failsafe timeout cleared');
  }

  // Vereinfachte WebSocket-Überprüfung wie bei sendCommand
  if (!websocketMountControl.socket || websocketMountControl.socket.readyState !== 1) {
    console.error('WebSocket ist nicht verbunden für Stop. State:', websocketMountControl.socket?.readyState);
    // Trotzdem lastDirection zurücksetzen
    mountStore.lastDirection = '';
    return;
  }

  const message = {
    direction: mountStore.lastDirection,
    rate: 0,
  };

  websocketMountControl.socket.send(JSON.stringify(message));
  console.log(`WS-Stop-Befehl gesendet:`, message);
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
  
  // Globaler Event-Listener für Sicherheit
  const handleGlobalStop = () => {
    if (mountStore.lastDirection) {
      console.log('Global emergency stop triggered');
      sendStop();
    }
  };
  
  document.addEventListener('visibilitychange', handleGlobalStop);
  window.addEventListener('blur', handleGlobalStop);
  window.addEventListener('pagehide', handleGlobalStop);
});

onBeforeUnmount(() => {
  // Sicherheits-Stop beim Unmount
  if (mountStore.lastDirection) {
    sendStop();
  }
  
  // Cleanup
  if (commandInterval) {
    clearInterval(commandInterval);
    commandInterval = null;
  }
  if (failsafeTimeout) {
    clearTimeout(failsafeTimeout);
    failsafeTimeout = null;
  }
  
  websocketMountControl.setStatusCallback(null);
  websocketMountControl.setMessageCallback(null);
  websocketMountControl.disconnect();
  mountStore.lastDirection = '';
  mountStore.wsIsConnected = false;
});
</script>

<style scoped>
.move-axis-grid {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.btn {
  border-radius: 1rem;
  background-color: #334155;
  padding: 0.5rem;
  box-shadow: 0 2px 15px black;
  border: 1px solid #0a0a0a;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  min-width: 3rem;
  min-height: 3rem;
}

.btn-small {
  border-radius: 0.5rem;
  background-color: #334155;
  padding: 0.25rem 0.5rem;
  box-shadow: 0 1px 8px black;
  border: 1px solid #0a0a0a;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  min-width: 2rem;
  min-height: 1.5rem;
  color: #e5e7eb;
  transition: all 0.2s;
}

.btn-small:hover {
  background-color: #475569;
}

@media (min-width: 640px) {
  .btn {
    padding: 0.75rem;
    min-width: 4rem;
    min-height: 4rem;
  }
  
  .btn-small {
    min-width: 2.5rem;
    min-height: 1.75rem;
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
