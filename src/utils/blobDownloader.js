import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { saveAs } from 'file-saver';

function sanitizeFileName(filename, fallback = 'download.bin') {
  const candidate = String(filename || '').trim() || fallback;
  return candidate
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 180);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read file data.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Save a downloaded blob in a way that works in browser and Capacitor WebViews.
 *
 * Browser anchor downloads are unreliable inside Android/iOS WebViews. Native
 * builds use Capacitor Filesystem so users can retrieve the file from Files /
 * app documents instead of relying on the WebView download prompt.
 */
export async function downloadBlob(blob, filename, options = {}) {
  const { folderName = 'TouchNStars', fallbackFilename = 'download.bin' } = options;
  const safeFilename = sanitizeFileName(filename, fallbackFilename);
  const platform = Capacitor.getPlatform();

  if (platform === 'android' || platform === 'ios') {
    const base64 = await blobToBase64(blob);
    const path = `${folderName}/${safeFilename}`;

    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    });

    let uri = '';
    try {
      const result = await Filesystem.getUri({
        path,
        directory: Directory.Documents,
      });
      uri = result.uri || '';
    } catch (error) {
      console.warn('Could not resolve saved file URI:', error);
    }

    return {
      mode: 'native',
      filename: safeFilename,
      path,
      uri,
    };
  }

  saveAs(blob, safeFilename);
  return {
    mode: 'browser',
    filename: safeFilename,
    path: safeFilename,
    uri: '',
  };
}
