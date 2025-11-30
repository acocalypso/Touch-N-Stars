import { ref, onMounted, onUnmounted } from 'vue';
import * as signalR from '@microsoft/signalr';

export const useSignalRNotifications = () => {
  const notifications = ref([]);
  let connection = null;

  const parseTimespan = (timespan) => {
    // Parse ISO 8601 duration or HH:MM:SS format
    if (typeof timespan !== 'string') return 5000;

    // ISO 8601 format: PT5S, PT1M30S, etc.
    const iso8601Regex = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/;
    const match = timespan.match(iso8601Regex);

    if (match) {
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      const seconds = parseFloat(match[3] || 0);
      return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }

    // HH:MM:SS format
    const parts = timespan.split(':');
    if (parts.length === 3) {
      const h = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      const s = parseInt(parts[2]);
      return (h * 3600 + m * 60 + s) * 1000;
    }

    return 5000; // Default 5 seconds
  };

  const connect = async () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      // Use NINA server port 4782
      const url = `${protocol}//localhost:4782/hubs/notifications`;
      console.log('Connecting to SignalR at:', url);

      connection = new signalR.HubConnectionBuilder()
        .withUrl(url, { withCredentials: false })
        .withAutomaticReconnect([1000, 3000, 5000, 10000, 30000])
        .build();

      connection.on('ReceiveNotification', (notification) => {
        console.log('Received notification:', notification);
        const notifObj = {
          ...notification,
          id: Date.now() + Math.random(),
          timestamp: new Date(notification.timestamp),
        };

        notifications.value.push(notifObj);
        console.log('Added to notifications array, total:', notifications.value.length);

        // Auto-remove after lifetime expires
        if (notification.lifetime) {
          const lifetimeMs = parseTimespan(notification.lifetime);
          setTimeout(() => {
            removeNotification(notifObj.id);
          }, lifetimeMs);
        }
      });

      connection.onreconnected(() => {
        console.log('SignalR reconnected');
      });

      connection.onreconnecting(() => {
        console.log('SignalR reconnecting...');
      });

      await connection.start();
      console.log('SignalR connected for notifications');
    } catch (err) {
      console.error('SignalR connection error:', err);
      setTimeout(connect, 5000);
    }
  };

  const removeNotification = (id) => {
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index >= 0) {
      notifications.value.splice(index, 1);
    }
  };

  const clearNotifications = () => {
    notifications.value = [];
  };

  const disconnect = async () => {
    if (connection) {
      await connection.stop();
      connection = null;
    }
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(async () => {
    await disconnect();
  });

  return {
    notifications,
    removeNotification,
    clearNotifications,
    disconnect,
    connect,
  };
};
