<template>
  <div class="vnc-container">
    <div ref="screen" class="vnc-screen"></div>
    <div class="status-indicator" :class="statusClass">{{ statusText }}</div>
  </div>
</template>

<script>
import RFB from '@novnc/novnc';

export default {
  name: 'NoVncClient',
  props: {
    host: {
      type: String,
      default: 'localhost',
    },
    port: {
      type: [String, Number],
      default: 6001,
    },
    path: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      default: '',
    },
    encrypt: {
      type: Boolean,
      default: false,
    },
    viewOnly: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      rfb: null,
      status: 'disconnected',
      errorMessage: null,
    };
  },
  computed: {
    websocketUrl() {
      const url = `${this.encrypt ? 'wss' : 'ws'}://${this.host}:${this.port}${this.path}`;
      console.debug('[WebSocket] Constructed URL:', url);
      return url;
    },
    statusText() {
      if (this.status === 'error') return `Error: ${this.errorMessage}`;
      return this.status.charAt(0).toUpperCase() + this.status.slice(1);
    },
    statusClass() {
      return `status-${this.status}`;
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initializeNoVnc();
    });
  },
  beforeUnmount() {
    this.disconnect();
  },
  methods: {
    initializeNoVnc() {
      console.debug('[noVNC] Initializing with URL:', this.websocketUrl);
      this.status = 'connecting';
      this.errorMessage = null;

      try {
        this.rfb = new RFB(this.$refs.screen, this.websocketUrl, {
          credentials: { password: this.password },
          wsProtocols: ['binary', 'base64'],
          wsOptions: {
            origin: 'http://127.0.0.1:8080', // Match your dev server origin
            headers: { 
              'X-Client-Type': 'noVNC',
              'X-Forwarded-For': '127.0.0.1' 
            },
            onopen: () => console.debug('[WebSocket] Connection opened'),
            onclose: (e) => console.debug('[WebSocket] Connection closed', e),
            onerror: (e) => console.debug('[WebSocket] Error occurred', e),
            onmessage: (e) => console.debug('[WebSocket] Message received', e),
          },
          fragment: 65535,
        });

        console.debug('[RFB] Instance created with settings:', {
          scaleViewport: this.rfb.scaleViewport,
          viewOnly: this.rfb.viewOnly,
          protocol: this.rfb.protocol,
          encodings: this.rfb.encodings,
        });

        this.setupEventHandlers();
        this.rfb.scaleViewport = true;
        this.rfb.viewOnly = this.viewOnly;
      } catch (error) {
        console.error('[noVNC] Initialization error:', error);
        this.handleError(error);
      }
    },

    setupEventHandlers() {
      const events = [
        'connect',
        'disconnect',
        'credentialsrequired',
        'securityfailure',
        'error',
        'clipboard',
        'bell',
        'desktopname',
        'capabilities',
      ];

      events.forEach((event) => {
        this.rfb.addEventListener(event, (e) => {
          console.debug(`[RFB Event] ${event}`, e.detail);
          switch (event) {
            case 'connect':
              this.handleConnect(e);
              break;
            case 'disconnect':
              this.handleDisconnect(e);
              break;
            case 'credentialsrequired':
              this.handleCredentialsRequired(e);
              break;
            case 'securityfailure':
              this.handleSecurityFailure(e);
              break;
            case 'error':
              this.handleRfbError(e);
              break;
            case 'capabilities':
              this.handleCapabilities(e);
              break;
            default:
              this[`handle${event.charAt(0).toUpperCase() + event.slice(1)}`]?.(e);
          }
        });
      });
    },

    handleRfbError(event) {
      console.error('[RFB Error]', event.detail);
      this.handleError(new Error(`RFB Error: ${event.detail.message}`));
    },

    handleConnect(event) {
      console.debug('[RFB] Connected successfully', {
        desktopName: this.rfb.desktopName,
        display: this.rfb._display,
        capabilities: this.rfb.capabilities,
      });
      this.status = 'connected';
      this.$emit('connected');
      console.log('event: %s', event);
    },

    handleDisconnect(event) {
      console.warn('[RFB] Disconnected:', event.detail);
      this.status = 'disconnected';
      this.$emit('disconnected', event.detail);

      if (event.detail.clean) {
        this.errorMessage = null;
      } else {
        const errorInfo = {
          code: event.detail.code,
          reason: event.detail.reason,
          wasClean: event.detail.clean,
        };
        console.error('[RFB] Unexpected disconnect:', errorInfo);
        this.errorMessage = event.detail.message || 'Unexpected disconnect';
      }
    },

    handleCredentialsRequired(event) {
      console.debug('[RFB] Credentials required:', event.detail);
      if (this.password) {
        console.debug('[RFB] Sending credentials');
        this.rfb.sendCredentials({
          username: '',
          password: this.password,
        });
      } else {
        console.error('[RFB] No password provided');
        this.handleError(new Error('Server requires password'));
      }
    },

    handleSecurityFailure(event) {
      const failureDetails = {
        status: event.detail.status,
        message: event.detail.message,
        securityType: event.detail.securityType,
      };
      console.error('[RFB] Security failure:', failureDetails);
      this.handleError(new Error(`Security failure: ${event.detail.status}`));
    },

    handleCapabilities(event) {
      console.debug('[RFB] Server capabilities:', event.detail);
    },

    handleError(error) {
      console.error('[noVNC] Global error handler:', error);
      this.status = 'error';
      this.errorMessage = error.message;
      this.$emit('error', error);

      if (this.rfb) {
        console.error('[RFB] Current state:', {
          connected: this.rfb.connected,
          desktopName: this.rfb.desktopName,
          protocol: this.rfb.protocol,
        });
      }
    },

    disconnect() {
      if (this.rfb) {
        console.debug('[noVNC] Disconnecting...');
        try {
          this.rfb.disconnect();
          console.debug('[noVNC] Disconnected cleanly');
        } catch (disconnectError) {
          console.error('[noVNC] Disconnection error:', disconnectError);
        }
        this.rfb = null;
      }
    },
  },
};
</script>

<style scoped>
.vnc-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #000;
}

.vnc-screen {
  width: 100%;
  height: 100%;
}

.status-indicator {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 5px 10px;
  border-radius: 3px;
  color: white;
  font-family: monospace;
  font-size: 0.9em;
  background: rgba(0, 0, 0, 0.7);
}

.status-connected {
  background: rgba(0, 255, 0, 0.3);
}

.status-connecting {
  background: rgba(255, 255, 0, 0.3);
}

.status-disconnected {
  background: rgba(255, 0, 0, 0.3);
}

.status-error {
  background: rgba(255, 0, 0, 0.5);
}
</style>
