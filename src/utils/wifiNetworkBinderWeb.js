export class WifiNetworkBinderWeb {
  async setTargetIp() {
    // Web implementation does nothing as network binding is Android-specific
    return { bound: false, targetIp: null };
  }

  async disable() {
    return { bound: false, targetIp: null };
  }

  async getStatus() {
    return { bound: false, targetIp: null };
  }
}
