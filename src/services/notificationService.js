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
        // Register notification channels for Android
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

          await LocalNotifications.createChannel({
            id: 'phd2-events',
            name: 'PHD2 Events',
            description: 'Notifications for PHD2 guiding events',
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

  async sendNotification(
    title,
    body,
    id = Math.floor(Math.random() * 10000),
    channelId = 'sequence-events'
  ) {
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
            channelId: this.platform === 'android' ? channelId : null,
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

  async sendPhd2Notification(event, details = '') {
    const settingsStore = useSettingsStore();

    if (!settingsStore.notifications.phd2.enabled) {
      return;
    }

    let title, body;

    switch (event) {
      case 'star-lost':
        title = 'PHD2: Star Lost';
        body = 'Guiding star has been lost and requires attention';
        break;
      case 'guiding-started':
        title = 'PHD2: Guiding Started';
        body = 'PHD2 has successfully started guiding';
        break;
      case 'guiding-stopped':
        title = 'PHD2: Guiding Stopped';
        body = 'PHD2 guiding has been stopped';
        break;
      case 'calibration-complete':
        title = 'PHD2: Calibration Complete';
        body = 'PHD2 calibration has completed successfully';
        break;
      case 'calibration-failed':
        title = 'PHD2: Calibration Failed';
        body = `PHD2 calibration failed: ${details}`;
        break;
      case 'error':
        title = 'PHD2: Error';
        body = `PHD2 error: ${details}`;
        break;
      default:
        title = 'PHD2: Event';
        body = details || 'A PHD2 event occurred';
    }

    await this.sendNotification(title, body, Math.floor(Math.random() * 10000), 'phd2-events');
  }
}

export default new NotificationService();
