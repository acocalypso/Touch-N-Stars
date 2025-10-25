export class MediaScannerWeb {
  async scanFile(options) {
    // Web implementation does nothing as media scanning is Android-specific
    console.log('[MediaScanner] Web platform - no action needed');
    return {
      success: true,
      path: options.path,
    };
  }

  async saveImage(options) {
    // Web implementation does nothing as photo library is iOS/Android-specific
    console.log('[PhotoLibrarySaver] Web platform - no action needed');
    return {
      success: true,
      message: 'Web platform - image already saved',
      path: options.path,
    };
  }
}
