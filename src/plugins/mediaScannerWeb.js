export class MediaScannerWeb {
  async scanFile(options) {
    // Web implementation does nothing as media scanning is Android-specific
    console.log('[MediaScanner] Web platform - no action needed');
    return {
      success: true,
      path: options.path,
    };
  }
}
