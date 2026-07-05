export class WifiSignalWeb {
  async getCurrent() {
    return {
      available: false,
      platform: 'web',
      reason: 'native-unavailable',
      source: 'mobile-device',
    };
  }
}
