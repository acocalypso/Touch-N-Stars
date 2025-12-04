import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import signalRMessageboxesService from '@/services/signalRMessageboxesService';

export const useMessageboxStore = defineStore('messageboxStore', {
  state: () => ({
    messageboxes: [],
    messageboxCount: 0,
    intervalId: null,
    isPolling: false,
    isConnectedToSignalR: false,
  }),
  actions: {
    async fetchMessageboxes() {
      const store = apiStore();
      try {
        if (!store.isBackendReachable) {
          console.warn('[messageboxStore] Backend is not reachable');
          return;
        }

        const response = await apiService.getMessageboxList();
        if (response.Success) {
          this.messageboxes = response.Response.Messageboxes || [];
          this.messageboxCount = response.Response.Count;
        }
      } catch (error) {
        console.error('[messageboxStore] Error fetching messageboxes:', error);
      }
    },

    async fetchMessageboxCount() {
      const store = apiStore();
      try {
        if (!store.isBackendReachable) {
          console.warn('[messageboxStore] Backend is not reachable');
          return;
        }

        const response = await apiService.getMessageboxCount();
        if (response.Success) {
          this.messageboxCount = response.Response;
        }
      } catch (error) {
        console.error('[messageboxStore] Error fetching messagebox count:', error);
      }
    },

    async clickButton(buttonName, windowHashCode = null) {
      try {
        const store = apiStore();

        // In PINS mode, use SignalR to click the button directly
        if (store.isPINS && signalRMessageboxesService.isSignalRConnected()) {
          console.log('[messageboxStore] Clicking button via SignalR:', buttonName);

          // Find the current messagebox's ContentType
          const currentMessagebox =
            this.messageboxes.length > 0 ? this.messageboxes[this.messageboxes.length - 1] : null;
          if (currentMessagebox && currentMessagebox.ContentType) {
            console.log(
              '[messageboxStore] Sending ClickMessageboxButton:',
              currentMessagebox.ContentType,
              buttonName
            );
            await signalRMessageboxesService.connection.invoke(
              'ClickMessageboxButton',
              currentMessagebox.ContentType,
              buttonName
            );
            return { Success: true };
          } else {
            console.warn('[messageboxStore] No messagebox found to click button on');
            return { Success: false, Error: 'No active messagebox' };
          }
        } else {
          // WPF mode - use HTTP API
          const response = await apiService.clickMessageboxButton(buttonName, windowHashCode);
          if (response.Success) {
            await this.fetchMessageboxes();
          }
          return response;
        }
      } catch (error) {
        console.error(`[messageboxStore] Error clicking button ${buttonName}:`, error);
        throw error;
      }
    },

    async closeAllMessageboxes(confirm = true) {
      try {
        const response = await apiService.closeAllMessageboxes(confirm);
        if (response.Success) {
          await this.fetchMessageboxes();
        }
        return response;
      } catch (error) {
        console.error('[messageboxStore] Error closing all messageboxes:', error);
        throw error;
      }
    },

    async closeMessageboxByType(type, confirm = true) {
      try {
        const response = await apiService.closeMessageboxByType(type, confirm);
        if (response.Success) {
          await this.fetchMessageboxes();
        }
        return response;
      } catch (error) {
        console.error(`[messageboxStore] Error closing messagebox by type ${type}:`, error);
        throw error;
      }
    },

    startPolling(interval = 2000) {
      if (!this.isPolling) {
        console.log('[messageboxStore] Start polling messageboxes...');
        this.isPolling = true;
        this.fetchMessageboxes();
        this.intervalId = setInterval(() => this.fetchMessageboxes(), interval);
      }
    },

    stopPolling() {
      if (this.isPolling) {
        console.log('[messageboxStore] Stop polling messageboxes...');
        this.isPolling = false;
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
      }
    },

    /**
     * Initialize SignalR connection for messagebox updates
     * This allows receiving real-time updates without polling
     */
    async initializeMessageboxSignalR() {
      const store = apiStore();

      if (!store.isBackendReachable) {
        console.warn(
          '[messageboxStore] Backend is not reachable, cannot establish SignalR connection'
        );
        return;
      }

      // Check if already connected
      if (signalRMessageboxesService.isSignalRConnected()) {
        console.log('[messageboxStore] SignalR already connected, skipping initialization');
        return;
      }

      try {
        console.log('[messageboxStore] Initializing SignalR connection via service');

        // Set up callbacks
        signalRMessageboxesService.setDialogCallback((messageboxData) => {
          console.log('[messageboxStore] Messagebox callback triggered:', messageboxData);
          this.handleMessageboxUpdate(messageboxData);
        });

        signalRMessageboxesService.setDialogStatusCallback((status) => {
          console.log('[messageboxStore] Status callback triggered:', status);
          this.handleStatusUpdate(status);
        });

        signalRMessageboxesService.setClearDialogCallback((contentType) => {
          console.log('[messageboxStore] Clear messagebox callback triggered:', contentType);
          this.handleClearMessagebox(contentType);
        });

        signalRMessageboxesService.setStatusCallback((status) => {
          console.log('[messageboxStore] SignalR connection status:', status);
          this.isConnectedToSignalR = status === 'Connected' || status === 'Reconnected';
        });

        // Connect
        await signalRMessageboxesService.connect();
        console.log('[messageboxStore] Messagebox SignalR connection established');
        this.isConnectedToSignalR = true;
      } catch (error) {
        console.error('[messageboxStore] Failed to establish SignalR connection:', error);
        this.isConnectedToSignalR = false;
      }
    },

    /**
     * Handle messagebox update from SignalR
     */
    handleMessageboxUpdate(messageboxData) {
      console.log('[messageboxStore] handleMessageboxUpdate received:', messageboxData);

      // Normalize property names (handle both camelCase and PascalCase)
      const normalizedMessagebox = {
        Title: messageboxData.Title || messageboxData.title,
        ContentType: messageboxData.ContentType || messageboxData.contentType,
        Active: messageboxData.Active ?? messageboxData.active ?? true,
        Status: messageboxData.Status || messageboxData.status || '',
        Message: messageboxData.Message || messageboxData.message || '',
        Parameters: messageboxData.Parameters || messageboxData.parameters || {},
        StatusMessage: messageboxData.StatusMessage || messageboxData.statusMessage,
        AvailableCommands:
          messageboxData.AvailableCommands || messageboxData.availableCommands || [],
      };

      console.log('[messageboxStore] Normalized messagebox:', normalizedMessagebox);
      console.log('[messageboxStore] ContentType:', normalizedMessagebox.ContentType);

      // Update or add the messagebox to the messageboxes array
      const existingIndex = this.messageboxes.findIndex(
        (m) => m.ContentType === normalizedMessagebox.ContentType
      );

      if (existingIndex >= 0) {
        // Update existing messagebox
        console.log('[messageboxStore] Updating existing messagebox at index', existingIndex);
        this.messageboxes[existingIndex] = {
          ...this.messageboxes[existingIndex],
          ...normalizedMessagebox,
        };
      } else {
        // Add new messagebox
        console.log('[messageboxStore] Adding new messagebox');
        this.messageboxes.push(normalizedMessagebox);
      }

      console.log('[messageboxStore] Current messageboxes array:', this.messageboxes);
    },

    /**
     * Handle status update from SignalR
     */
    handleStatusUpdate(status) {
      console.log('[messageboxStore] Status update:', status);
      // Handle general status updates if needed
    },

    /**
     * Handle clear messagebox from SignalR
     */
    handleClearMessagebox(contentType) {
      console.log('[messageboxStore] handleClearMessagebox called with contentType:', contentType);
      console.log('[messageboxStore] Current messageboxes before clear:', this.messageboxes);

      // Remove messagebox from the messageboxes array
      const beforeCount = this.messageboxes.length;
      this.messageboxes = this.messageboxes.filter((m) => m.ContentType !== contentType);
      const afterCount = this.messageboxes.length;

      console.log('[messageboxStore] Messageboxes removed:', beforeCount - afterCount);
      console.log('[messageboxStore] Current messageboxes after clear:', this.messageboxes);
    },

    /**
     * Generic close messagebox function
     */
    async closeMessagebox(contentType) {
      try {
        const messagebox = this.messageboxes.find((m) => m.ContentType === contentType);

        if (!messagebox) {
          console.warn(`[messageboxStore] No messagebox found with ContentType: ${contentType}`);
          return;
        }

        console.log(`[messageboxStore] Closing messagebox: ${contentType}`);

        // Close messagebox via button click
        const store = apiStore();
        const buttonToClick = store.isPINS ? 'OK' : 'PART_CloseButton';
        await this.clickButton(buttonToClick, messagebox.Title);

        // Remove messagebox from array (in case server doesn't send ClearDialog event)
        this.messageboxes = this.messageboxes.filter((m) => m.ContentType !== contentType);
        console.log(`[messageboxStore] Messagebox closed and removed: ${contentType}`);
      } catch (error) {
        console.error(`[messageboxStore] Error closing messagebox (${contentType}):`, error);
      }
    },

    /**
     * Disconnect from SignalR
     */
    async disconnectMessageboxSignalR() {
      try {
        await signalRMessageboxesService.disconnect();
        console.log('[messageboxStore] Disconnected from messagebox SignalR');
        this.isConnectedToSignalR = false;
      } catch (error) {
        console.error('[messageboxStore] Error disconnecting from SignalR:', error);
      }
    },
  },
});
