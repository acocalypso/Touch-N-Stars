import { registerPlugin } from '@capacitor/core';

// Register Android MediaScanner plugin for gallery integration
// Note: iOS now uses @capacitor-community/media instead of custom PhotoLibrarySaver
const MediaScanner = registerPlugin('MediaScanner', {
  web: () => import('./mediaScannerWeb').then((m) => new m.MediaScannerWeb()),
});

export { MediaScanner };
