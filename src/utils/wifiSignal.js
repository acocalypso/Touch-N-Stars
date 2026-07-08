import { registerPlugin } from '@capacitor/core';

const WifiSignal = registerPlugin('WifiSignal', {
  web: () => import('./wifiSignalWeb').then((m) => new m.WifiSignalWeb()),
});

export { WifiSignal };
