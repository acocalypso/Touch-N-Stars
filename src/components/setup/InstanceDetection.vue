<template>
  <div class="space-y-4">
    <!-- Auto-Detection Section -->
    <div class="p-4 bg-gray-700 rounded-lg">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-white">Auto-Detection</h3>
        <button
          @click="detectInstances"
          :disabled="isDetecting"
          class="default-button-blue max-w-32"
        >
          <span v-if="isDetecting" class="loader w-4 h-4"></span>
          {{ isDetecting ? 'Detecting...' : 'Detect' }}
        </button>
      </div>
      <!-- Detection Results -->
      <div v-if="detectionMessage" class="mb-4">
        <div :class="detectionSuccess ? 'text-green-400' : 'text-yellow-400'" class="text-sm">
          {{ detectionMessage }}
        </div>
      </div>
      <!-- No Instance Found Message -->
      <div v-if="showNoInstanceMessage" class="text-gray-400 text-sm">
        No NINA instance found. Please ensure NINA is running and on the same network.
      </div>
    </div>
    <!-- Manual Configuration -->
    <div v-if="!hideManualConfig" class="space-y-4">
      <h3 class="text-lg font-medium text-white">Manual Configuration</h3>
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-1">Instance Name</label>
        <input
          v-model="instanceName"
          type="text"
          class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md"
          placeholder="My Instance"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-1">IP Address / FQDN</label>
        <input
          v-model="instanceIP"
          type="text"
          class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md"
          placeholder="192.168.x.x"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-1">Port</label>
        <input
          v-model="instancePort"
          type="text"
          class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md"
          placeholder="5000"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, defineEmits, defineProps, watch } from 'vue';
import { Capacitor } from '@capacitor/core';
import { GetLocalIP } from 'capacitor-getlocalip';
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      name: '',
      ip: '',
      port: 5000,
    }),
  },
  hideManualConfig: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update:modelValue']);
const isDetecting = ref(false);
const detectionMessage = ref('');
const detectionSuccess = ref(false);
const showNoInstanceMessage = ref(false);
const instanceName = ref(props.modelValue.name);
const instanceIP = ref(props.modelValue.ip);
const instancePort = ref(props.modelValue.port);
// Watch for changes and emit to parent
watch(
  [instanceName, instanceIP, instancePort],
  () => {
    emit('update:modelValue', {
      name: instanceName.value,
      ip: instanceIP.value,
      port: instancePort.value,
    });
  },
  { deep: true }
);
async function detectInstances() {
  /* if (!['android', 'ios'].includes(Capacitor.getPlatform()) ) {
    detectionMessage.value = 'Auto-detection only available on mobile platforms';
    detectionSuccess.value = false;
    return;
  } */
  isDetecting.value = true;
  detectionMessage.value = 'Scanning local network for NINA instances...';
  detectionSuccess.value = false;
  showNoInstanceMessage.value = false;
  try {
    const found = await scanNetworkForNINA();
    if (!found) {
      showNoInstanceMessage.value = true;
      detectionMessage.value = 'No NINA instances found. Try manual configuration.';
      detectionSuccess.value = false;
    }
  } catch (error) {
    console.error('Error detecting instances:', error);
    detectionMessage.value = 'Error during detection: ' + error.message;
    detectionSuccess.value = false;
  } finally {
    isDetecting.value = false;
  }
}
// Helper function to scan network for NINA instances
async function scanNetworkForNINA() {
  try {
    detectionMessage.value = 'Getting device network info...';
    // Get device's current IP address
    const deviceIP = await getCurrentDeviceIP();
    console.log('Device IP:', deviceIP);
    if (!deviceIP) {
      console.log('Could not determine device IP');
      return false;
    }
    const networkBase = getNetworkBase(deviceIP);
    console.log(`Scanning network ${networkBase}.x for NINA instances`);
    detectionMessage.value = `Scanning ${networkBase}.x for NINA...`;
    // Generate IPs to scan in this network
    const ipsToScan = generateNetworkIPs(networkBase);
    // Scan in batches of 10 for better performance
    const batchSize = 10;
    for (let i = 0; i < ipsToScan.length; i += batchSize) {
      const batch = ipsToScan.slice(i, i + batchSize);
      const rangeStart = batch[0].split('.')[3];
      const rangeEnd = batch[batch.length - 1].split('.')[3];
      detectionMessage.value = `Scanning ${networkBase}.${rangeStart}-${rangeEnd}... (${i + batch.length}/${ipsToScan.length})`;
      const scanPromises = batch.map((ip) => checkNINAAtIP(ip));
      const results = await Promise.allSettled(scanPromises);
      // Check if any scan found NINA
      for (let j = 0; j < results.length; j++) {
        if (results[j].status === 'fulfilled' && results[j].value === true) {
          return true; // Found NINA
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Network scan error:', error);
    return false;
  }
}
// Get device's current IP address
async function getCurrentDeviceIP() {
  try {
    // Method 1: Try native plugin first (most reliable for mobile)
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await GetLocalIP.getLocalIP();
        if (result && result.ip) {
          console.log('Got IP via native plugin:', result.ip);
          return result.ip;
        }
      } catch (error) {
        console.error('Native plugin failed:', error);
      }
    }
    // Method 2: Fallback to WebRTC approach (works with and without internet)
    const webrtcIP = await getIPViaWebRTC();
    if (webrtcIP) {
      console.log('Got IP via WebRTC fallback:', webrtcIP);
      return webrtcIP;
    }
    // Method 3: Try to detect IP by creating a dummy connection
    const dummyIP = await getIPViaDummyConnection();
    if (dummyIP) {
      console.log('Got IP via dummy connection fallback:', dummyIP);
      return dummyIP;
    }
    // If all methods fail, return null
    console.log('Could not determine device IP');
    return null;
  } catch (error) {
    console.error('Error getting device IP:', error);
    return null;
  }
}
// Get IP using WebRTC method (works with and without internet)
async function getIPViaWebRTC() {
  try {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }, // Try internet STUN first
        { urls: 'stun:stun1.l.google.com:19302' }, // Backup STUN server
      ],
    });
    pc.createDataChannel('');
    return new Promise((resolve) => {
      let resolved = false;
      pc.onicecandidate = (event) => {
        if (event.candidate && !resolved) {
          const candidate = event.candidate.candidate;
          const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
          if (ipMatch && ipMatch[1] && !ipMatch[1].startsWith('169.254')) {
            // Found a valid local IP (not link-local)
            resolved = true;
            pc.close();
            resolve(ipMatch[1]);
          }
        }
      };
      pc.createOffer().then((offer) => pc.setLocalDescription(offer));
      // Timeout after 2 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          pc.close();
          resolve(null);
        }
      }, 2000);
    });
  } catch (error) {
    console.error('WebRTC method failed:', error);
    return null;
  }
}
// Alternative method: Use dummy UDP connection to detect local IP
async function getIPViaDummyConnection() {
  try {
    // This method works even without internet by creating a dummy connection
    // The browser will use the local IP when creating the connection
    const pc = new RTCPeerConnection();
    // Create a dummy data channel
    pc.createDataChannel('');
    return new Promise((resolve) => {
      let resolved = false;
      pc.onicecandidate = (event) => {
        if (event.candidate && !resolved) {
          const candidate = event.candidate.candidate;
          // Look for host candidates (local IPs)
          if (candidate.includes('host')) {
            const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
            if (ipMatch && ipMatch[1] && !ipMatch[1].startsWith('169.254')) {
              resolved = true;
              pc.close();
              resolve(ipMatch[1]);
            }
          }
        }
      };
      // Create offer to trigger ICE gathering
      pc.createOffer().then((offer) => pc.setLocalDescription(offer));
      // Short timeout for local-only detection
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          pc.close();
          resolve(null);
        }
      }, 1000);
    });
  } catch (error) {
    console.error('Dummy connection method failed:', error);
    return null;
  }
}
// Extract network base from IP (e.g., "192.168.1.100" -> "192.168.1")
function getNetworkBase(ip) {
  const parts = ip.split('.');
  if (parts.length >= 3) {
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }
  return ip;
}
// Generate list of IPs to scan in a network range
function generateNetworkIPs(networkBase) {
  const ips = [];
  // Scan the full /24 range (1-254)
  for (let i = 1; i <= 254; i++) {
    ips.push(`${networkBase}.${i}`);
  }
  return ips;
}
// Check if NINA is running at a specific IP
async function checkNINAAtIP(ip) {
  try {
    console.log(`Checking for NINA at ${ip}:5000`);
    // Use fetch with a short timeout to check if NINA is running
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout for faster scanning
    const response = await fetch(`http://${ip}:5000/api/version`, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      console.log(`Found NINA at ${ip}:5000`);
      // Try to get more info about the NINA instance
      let ninaName = 'NINA Instance';
      try {
        const versionData = await response.json();
        if (versionData && versionData.ApplicationName) {
          ninaName = versionData.ApplicationName;
        }
      } catch (e) {
        // If we can't parse JSON, that's ok
      }
      // Update the form with discovered instance
      instanceName.value = ninaName;
      instanceIP.value = ip;
      instancePort.value = 5000;
      detectionMessage.value = `Found NINA instance: ${ip}:5000`;
      detectionSuccess.value = true;
      return true;
    }
  } catch (error) {
    // Expected for non-NINA IPs or network timeouts
    if (error.name !== 'AbortError') {
      console.log(`No NINA found at ${ip}:5000 - ${error.message}`);
    }
  }
  return false;
}
</script>
<style scoped>
.loader {
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>