import { registerPlugin } from '@capacitor/core';

const MediaScanner = registerPlugin('MediaScanner', {
  web: () => import('./mediaScannerWeb').then((m) => new m.MediaScannerWeb()),
});

export default MediaScanner;
