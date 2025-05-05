import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useSettingsStore } from '@/store/settingsStore';

class NotificationService {
  constructor() {
    this.initialized = false;
    this.platform = Capacitor.getPlatform();
    this.isMobile = ['android', 'ios'].includes(this.platform);
  }

  async initialize() {
    if (!this.isMobile || this.initialized) {
      return;
    }

    try {
      // Check if plugin is available first
      if (!LocalNotifications) {
        console.log('LocalNotifications plugin not available');
        return false;
      }

      // Request permission
      const permission = await LocalNotifications.requestPermissions();

      if (permission.display === 'granted') {
        // Register notification channel for Android
        if (this.platform === 'android') {
          await LocalNotifications.createChannel({
            id: 'sequence-events',
            name: 'Sequence Events',
            description: 'Notifications for sequence events',
            importance: 4, // High importance
            visibility: 1, // Public visibility
            sound: 'beep.wav', // Default sound
            vibration: true,
          });
        }

        this.initialized = true;
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  async sendNotification(title, body, id = Math.floor(Math.random() * 10000)) {
    const settingsStore = useSettingsStore();

    if (!this.isMobile || !settingsStore.notifications.enabled) {
      return;
    }

    if (!this.initialized) {
      const initialized = await this.initialize();
      if (!initialized) return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id,
            sound: this.platform === 'android' ? 'beep.wav' : null,
            channelId: this.platform === 'android' ? 'sequence-events' : null,
            smallIcon: 'ic_stat_icon',
            iconColor: '#0891b2', // Cyan-600 from Tailwind
            actionTypeId: '',
            extra: {
              timestamp: new Date().toISOString(),
            },
          },
        ],
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  async sendSequenceNotification(event, details = '') {
    const settingsStore = useSettingsStore();

    if (!settingsStore.notifications.sequence.enabled) {
      return;
    }

    let title, body;

    switch (event) {
      case 'started':
        title = 'Sequence Started';
        body = 'Your imaging sequence has started';
        break;
      case 'reset':
        title = 'Sequence Reset';
        body = 'Your imaging sequence has been reset';
        break;
      case 'completed':
        title = 'Sequence Completed';
        body = 'Your imaging sequence has completed successfully';
        break;
      case 'error':
        title = 'Sequence Error';
        body = `Error in sequence: ${details}`;
        break;
      default:
        title = 'Sequence Event';
        body = details || 'A sequence event occurred';
    }

    await this.sendNotification(title, body);
  }
}

export default new NotificationService();
