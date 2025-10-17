import { registerPlugin } from '@capacitor/core';

// Register both Android MediaScanner and iOS PhotoLibrarySaver
const MediaScanner = registerPlugin('MediaScanner', {
  web: () => import('./mediaScannerWeb').then((m) => new m.MediaScannerWeb()),
});

const PhotoLibrarySaver = registerPlugin('PhotoLibrarySaver', {
  web: () => import('./mediaScannerWeb').then((m) => new m.MediaScannerWeb()),
});

export { MediaScanner, PhotoLibrarySaver };
