import { registerPlugin } from '@capacitor/core';

const WifiNetworkBinder = registerPlugin('WifiNetworkBinder', {
  web: () => import('./wifiNetworkBinderWeb').then((m) => new m.WifiNetworkBinderWeb()),
});

export { WifiNetworkBinder };
