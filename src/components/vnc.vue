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
      type: [String, Number], // Corrected prop type definition
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
      status: 'disconnected', // Possible states: disconnected, connecting, connected, error
      errorMessage: null,
    };
  },
  computed: {
    websocketUrl() {
      return `${this.encrypt ? 'wss' : 'ws'}://${this.host}:${this.port}${this.path}`;
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
      this.status = 'connecting';
      this.errorMessage = null;

      try {
        this.rfb = new RFB(this.$refs.screen, this.websocketUrl, {
          credentials: {
            password: this.password,
          },
        });

        this.setupEventHandlers();
        this.rfb.scaleViewport = true;
        this.rfb.viewOnly = this.viewOnly;
      } catch (error) {
        this.handleError(error);
      }
    },

    setupEventHandlers() {
      this.rfb.addEventListener('connect', this.handleConnect);
      this.rfb.addEventListener('disconnect', this.handleDisconnect);
      this.rfb.addEventListener('credentialsrequired', this.handleCredentialsRequired);
      this.rfb.addEventListener('securityfailure', this.handleSecurityFailure);
    },

    handleConnect() {
      this.status = 'connected';
      this.$emit('connected');
    },

    handleDisconnect(event) {
      this.status = 'disconnected';
      this.$emit('disconnected', event.detail);
      if (event.detail.clean) {
        this.errorMessage = null;
      } else {
        this.errorMessage = event.detail.message || 'Unexpected disconnect';
      }
    },

    handleCredentialsRequired() {
      if (this.password) {
        this.rfb.sendCredentials({
          password: this.password,
        });
      } else {
        this.handleError(new Error('Server requires password'));
      }
    },

    handleSecurityFailure(event) {
      this.handleError(new Error(`Security failure: ${event.detail.status}`));
    },

    handleError(error) {
      this.status = 'error';
      this.errorMessage = error.message;
      this.$emit('error', error);
      console.error('noVNC error:', error);
    },

    disconnect() {
      if (this.rfb) {
        this.rfb.disconnect();
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
