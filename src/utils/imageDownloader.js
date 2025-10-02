import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

// Initialize MediaStore plugin for Android
const MediaStoreImageSaver = registerPlugin('MediaStoreImageSaver');

// We'll create our own notification manager instance for images
// by importing the styles and classes from logDownloader
let notificationManager;

// Initialize notification manager
const initNotificationManager = () => {
  if (!notificationManager) {
    // Import and initialize the notification manager class from logDownloader
    import('@/utils/logDownloader').then(() => {
      // The notification manager is available globally now
      // Create a simple version for images
      class ImageNotificationManager {
        constructor() {
          this.container = null;
          this.createContainer();
        }

        createContainer() {
          if (document.getElementById('image-download-notifications')) return;

          this.container = document.createElement('div');
          this.container.id = 'image-download-notifications';
          this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            pointer-events: none;
          `;
          document.body.appendChild(this.container);
        }

        showProgress() {
          const notification = document.createElement('div');
          notification.id = 'image-download-progress';
          notification.innerHTML = `
            <div style="
              background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
              border: 1px solid #06b6d4;
              border-radius: 12px;
              padding: 16px 20px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(6, 182, 212, 0.2);
              backdrop-filter: blur(10px);
              min-width: 280px;
              animation: slideInRight 0.3s ease-out;
              pointer-events: auto;
            ">
              <div style="display: flex; align-items: center; gap: 12px; color: white;">
                <div style="
                  width: 20px;
                  height: 20px;
                  border: 2px solid #06b6d4;
                  border-top: 2px solid transparent;
                  border-radius: 50%;
                  animation: spin 1s linear infinite;
                "></div>
                <div>
                  <div style="font-weight: 600; font-size: 14px;">Saving Image</div>
                  <div style="font-size: 12px; color: #9ca3af; margin-top: 2px;">Processing image file...</div>
                </div>
              </div>
            </div>
          `;

          this.container.appendChild(notification);
          return notification;
        }

        showSuccess(message, details) {
          const existingProgress = document.getElementById('image-download-progress');
          if (existingProgress) {
            existingProgress.remove();
          }

          const notification = document.createElement('div');
          notification.innerHTML = `
            <div style="
              background: linear-gradient(135deg, #065f46 0%, #059669 100%);
              border: 1px solid #10b981;
              border-radius: 12px;
              padding: 16px 20px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(16, 185, 129, 0.3);
              backdrop-filter: blur(10px);
              min-width: 280px;
              animation: slideInRight 0.3s ease-out, pulse 0.5s ease-in-out;
              pointer-events: auto;
              cursor: pointer;
            " onclick="this.parentElement.removeChild(this)">
              <div style="display: flex; align-items: flex-start; gap: 12px; color: white;">
                <div style="
                  width: 24px;
                  height: 24px;
                  background: #10b981;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  animation: checkmark 0.5s ease-in-out 0.2s both;
                ">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <div style="flex: 1;">
                  <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">Image Saved!</div>
                  <div style="font-size: 12px; color: #d1fae5; line-height: 1.4;">
                    ${message}
                  </div>
                  ${details ? `<div style="font-size: 11px; color: #a7f3d0; margin-top: 4px; opacity: 0.8;">${details}</div>` : ''}
                  <div style="font-size: 10px; color: #a7f3d0; margin-top: 6px; opacity: 0.6;">
                    Click to dismiss
                  </div>
                </div>
              </div>
            </div>
          `;

          this.container.appendChild(notification);

          // Auto remove after 5 seconds
          setTimeout(() => {
            if (notification.parentElement) {
              notification.style.animation = 'slideOutRight 0.3s ease-in';
              setTimeout(() => {
                if (notification.parentElement) {
                  notification.parentElement.removeChild(notification);
                }
              }, 300);
            }
          }, 5000);
        }

        showError(message) {
          const existingProgress = document.getElementById('image-download-progress');
          if (existingProgress) {
            existingProgress.remove();
          }

          const notification = document.createElement('div');
          notification.innerHTML = `
            <div style="
              background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%);
              border: 1px solid #ef4444;
              border-radius: 12px;
              padding: 16px 20px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(239, 68, 68, 0.3);
              backdrop-filter: blur(10px);
              min-width: 280px;
              animation: slideInRight 0.3s ease-out, shake 0.5s ease-in-out;
              pointer-events: auto;
              cursor: pointer;
            " onclick="this.parentElement.removeChild(this)">
              <div style="display: flex; align-items: flex-start; gap: 12px; color: white;">
                <div style="
                  width: 24px;
                  height: 24px;
                  background: #ef4444;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                ">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <div style="flex: 1;">
                  <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">Save Failed</div>
                  <div style="font-size: 12px; color: #fecaca; line-height: 1.4;">
                    ${message}
                  </div>
                  <div style="font-size: 10px; color: #fecaca; margin-top: 6px; opacity: 0.6;">
                    Click to dismiss
                  </div>
                </div>
              </div>
            </div>
          `;

          this.container.appendChild(notification);

          // Auto remove after 7 seconds for errors
          setTimeout(() => {
            if (notification.parentElement) {
              notification.style.animation = 'slideOutRight 0.3s ease-in';
              setTimeout(() => {
                if (notification.parentElement) {
                  notification.parentElement.removeChild(notification);
                }
              }, 300);
            }
          }, 7000);
        }
      }

      notificationManager = new ImageNotificationManager();
    });
  }
};

// Initialize immediately
initNotificationManager();

/**
 * Helper function to detect and handle different image data formats
 * @param {string} imageData - The image data (base64, blob URL, or regular URL)
 * @returns {Promise<{blob: Blob, base64: string}>} - Returns both blob and base64 data
 */
async function processImageData(imageData) {
  try {
    let blob;
    let base64;

    if (imageData.startsWith('data:image')) {
      // Already a base64 data URL
      base64 = imageData.split(',')[1];
      // Convert base64 to blob
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: 'image/jpeg' });
    } else {
      // It's a blob URL or regular URL, fetch it
      const response = await fetch(imageData);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      blob = await response.blob();

      // Convert blob to base64
      base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const result = reader.result;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read blob as base64'));
        reader.readAsDataURL(blob);
      });
    }

    return { blob, base64 };
  } catch (error) {
    console.error('Error processing image data:', error);
    throw error;
  }
}

/**
 * Downloads an image with visual feedback notifications
 * @param {string} imageData - Base64 or URL of the image
 * @param {string} imageDate - Date string for filename
 * @param {Object} options - Additional options
 * @param {string} options.folderPrefix - Prefix for folder name (default: 'TNS-Images')
 * @param {string} options.filePrefix - Prefix for filename (default: 'TNS')
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
export async function downloadImage(imageData, imageDate = '0000-00-00', options = {}) {
  const { folderPrefix = 'TNS-Images', filePrefix = 'TNS' } = options;

  // Ensure notification manager is available
  if (!notificationManager) {
    initNotificationManager();
    // Give it a moment to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Show progress notification
  if (notificationManager) {
    notificationManager.showProgress();
  }
  let fileName; // Declare fileName in outer scope for fallback access

  try {
    const now = new Date();
    const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const folderName = `${folderPrefix}-${currentDate}`;

    const timeString = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;

    if (imageDate === '0000-00-00') {
      fileName = `${filePrefix}-${currentDate}_${timeString}.jpg`;
    } else {
      // Clean imageDate by removing invalid characters for Android filesystem
      const cleanImageDate = imageDate.replace(/[T:+]/g, '-').replace(/\.\d+/g, '');
      fileName = `${filePrefix}-${cleanImageDate}_${timeString}.jpg`;
    }
    const platform = Capacitor.getPlatform();

    if (platform === 'android' || platform === 'ios') {
      console.log('[ImageDownloader] Handling mobile platform download');
      console.log('[ImageDownloader] Platform:', platform);
      console.log(
        '[ImageDownloader] Image source type:',
        imageData.startsWith('data:') ? 'base64' : imageData.startsWith('blob:') ? 'blob' : 'url'
      );

      // Check and request permissions for Android
      if (platform === 'android') {
        try {
          console.log('[ImageDownloader] Checking Android permissions...');
          const permissionStatus = await Filesystem.checkPermissions();
          console.log('[ImageDownloader] Current permission status:', permissionStatus);

          if (permissionStatus.publicStorage !== 'granted') {
            console.log('[ImageDownloader] Requesting permissions...');
            const requestResult = await Filesystem.requestPermissions();
            console.log('[ImageDownloader] Permission request result:', requestResult);
          }
        } catch (permissionError) {
          console.log('[ImageDownloader] Permission handling failed:', permissionError);
          // Continue anyway, we'll use app-specific directories
        }
      }

      // Use different directory strategy based on platform
      let primaryDirectory, primaryDirName;
      if (platform === 'android') {
        // For Android, try Documents first (more accessible to users)
        primaryDirectory = Directory.Documents;
        primaryDirName = 'Documents';
      } else {
        // For iOS, Documents directory works well
        primaryDirectory = Directory.Documents;
        primaryDirName = 'Documents';
      }

      // For Android, try MediaStore integration first (user-accessible storage)
      if (platform === 'android') {
        try {
          console.log('[ImageDownloader] Attempting MediaStore save via temp file...');

          // Get blob directly without base64 conversion to save memory
          let blob;
          if (imageData.startsWith('data:image')) {
            const base64 = imageData.split(',')[1];
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            blob = new Blob([byteArray], { type: 'image/jpeg' });
          } else {
            const response = await fetch(imageData);
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status}`);
            }
            blob = await response.blob();
          }

          // Convert blob to ArrayBuffer for Filesystem API
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          // Convert to base64 for Filesystem.writeFile (only way to write binary data)
          let binary = '';
          const len = uint8Array.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64Data = btoa(binary);

          // Write to temporary file
          const tempFileName = `temp_${Date.now()}.jpg`;
          await Filesystem.writeFile({
            path: tempFileName,
            data: base64Data,
            directory: Directory.Cache,
          });

          console.log('[ImageDownloader] Temporary file written, getting URI...');

          // Get the file URI
          const fileUri = await Filesystem.getUri({
            path: tempFileName,
            directory: Directory.Cache,
          });

          console.log('[ImageDownloader] File URI:', fileUri.uri);

          // Send only the file path to MediaStore plugin (not the base64 data!)
          const result = await MediaStoreImageSaver.saveImageToGallery({
            fileUri: fileUri.uri,
            filename: fileName,
            folderName: folderName,
          });

          console.log('[ImageDownloader] MediaStore save successful:', result);

          // Clean up temp file
          try {
            await Filesystem.deleteFile({
              path: tempFileName,
              directory: Directory.Cache,
            });
            console.log('[ImageDownloader] Temp file cleaned up');
          } catch (cleanupError) {
            console.log('[ImageDownloader] Cleanup of temp file failed (non-critical):', cleanupError);
          }

          notificationManager.showSuccess(
            `Image saved to gallery`,
            `File: ${fileName} • Access via Gallery app`
          );

          return true;
        } catch (mediaStoreError) {
          console.log(
            '[ImageDownloader] MediaStore save failed, falling back to Filesystem API:',
            mediaStoreError
          );
          // Continue with original filesystem approach
        }
      }

      // Process the image data for fallback methods
      console.log('[ImageDownloader] Processing image data for mobile download...');
      const { base64 } = await processImageData(imageData);

      // Create folder directory if it doesn't exist
      try {
        await Filesystem.mkdir({
          path: folderName,
          directory: primaryDirectory,
          recursive: true,
        });
        console.log(`[ImageDownloader] Created directory: ${folderName} in ${primaryDirName}`);
      } catch (mkdirError) {
        // Directory might already exist, this is fine
        if (
          mkdirError.message.includes('Directory exists') ||
          mkdirError.message.includes('already exists') ||
          mkdirError.message.includes('FILE_EXISTS') ||
          mkdirError.code === 'DIRECTORY_EXISTS'
        ) {
          console.log(`[ImageDownloader] Directory already exists: ${folderName}`);
        } else {
          console.warn('[ImageDownloader] Error creating directory:', mkdirError);
          // Don't throw here, try to continue with file write
        }
      }

      // Write the image file to the date-specific folder
      try {
        console.log(`[ImageDownloader] Attempting to write to ${primaryDirName}...`);
        await Filesystem.writeFile({
          path: `${folderName}/${fileName}`,
          data: base64,
          directory: primaryDirectory,
          // Omit encoding for binary data (base64)
        });
        console.log(
          `[ImageDownloader] Image saved successfully to ${folderName}/${fileName} in ${primaryDirName}`
        );

        // Show success notification
        if (platform === 'android') {
          notificationManager.showSuccess(
            `Image saved to ${folderName} folder`,
            `File: ${fileName} • Location: ${primaryDirName}`
          );
        } else if (platform === 'ios') {
          notificationManager.showSuccess(
            `Image saved to ${folderName} folder`,
            `Access via Files app • ${fileName}`
          );
        }

        return true;
      } catch (writeError) {
        console.error('File write error:', writeError);

        // Try alternative approach for Android - multiple fallback strategies
        if (platform === 'android') {
          console.log('Trying alternative write methods for Android...');

          const fallbackStrategies = [
            // Strategy 1: Try Documents root (user accessible)
            {
              name: 'Documents root',
              async write() {
                return await Filesystem.writeFile({
                  path: fileName,
                  data: base64,
                  directory: Directory.Documents,
                });
              },
            },
            // Strategy 2: Try Data directory (app-specific, should always work)
            {
              name: 'Data directory (app-specific)',
              async write() {
                return await Filesystem.writeFile({
                  path: fileName,
                  data: base64,
                  directory: Directory.Data,
                });
              },
            },
            // Strategy 3: Try Cache directory (app-specific, should always work)
            {
              name: 'Cache directory',
              async write() {
                return await Filesystem.writeFile({
                  path: fileName,
                  data: base64,
                  directory: Directory.Cache,
                });
              },
            },
            // Strategy 4: Try External directory (app-specific)
            {
              name: 'External directory',
              async write() {
                return await Filesystem.writeFile({
                  path: fileName,
                  data: base64,
                  directory: Directory.External,
                });
              },
            },
          ];

          let lastError = writeError;
          let success = false;

          for (const strategy of fallbackStrategies) {
            try {
              console.log(`Trying ${strategy.name}...`);
              await strategy.write();
              console.log(`Image saved successfully using ${strategy.name}: ${fileName}`);

              notificationManager.showSuccess(
                `Image saved successfully using ${strategy.name}`,
                `File: ${fileName}`
              );

              success = true;
              break;
            } catch (strategyError) {
              console.log(`${strategy.name} failed:`, strategyError);
              lastError = strategyError;
            }
          }

          if (!success) {
            console.error('All Android fallback strategies failed:', lastError);
            throw lastError;
          }

          return true;
        } else {
          throw writeError; // Re-throw if it's not Android
        }
      }

      return true;
    } else {
      // Standard web browser download
      console.log('Processing image data for web download...');
      const { blob } = await processImageData(imageData);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notificationManager.showSuccess(
        `Download started: ${fileName}`,
        `Check your Downloads folder`
      );

      return true;
    }
  } catch (error) {
    console.error('Error saving image:', error);
    console.error('Image data type:', typeof imageData);
    console.error('Image data preview:', imageData?.substring(0, 100));
    console.error('Platform:', Capacitor.getPlatform());

    // Show error notification
    notificationManager.showError(`Failed to save image: ${error.message || 'Unknown error'}`);

    // Try fallback method for mobile platforms
    if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
      try {
        console.log('Attempting fallback download method...');

        // Ensure fileName is defined for fallback
        const now = new Date();
        const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const timeString = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;

        let fallbackFileName;
        if (imageDate === '0000-00-00') {
          fallbackFileName = `${filePrefix}-${currentDate}_${timeString}.jpg`;
        } else {
          fallbackFileName = `${filePrefix}-${imageDate}_${timeString}.jpg`;
        }

        // For blob URLs, we need a different approach
        if (imageData.startsWith('blob:')) {
          // Convert blob URL to blob first
          const response = await fetch(imageData);
          const blob = await response.blob();

          // Create a new blob URL for download
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = fallbackFileName;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setTimeout(() => {
            URL.revokeObjectURL(downloadUrl);
          }, 1000);
        } else {
          // Regular URL fallback
          const response = await fetch(imageData);
          const blob = await response.blob();
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = fallbackFileName;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setTimeout(() => {
            URL.revokeObjectURL(downloadUrl);
          }, 1000);
        }

        notificationManager.showSuccess(
          'Image downloaded using fallback method',
          'Check your Downloads folder'
        );

        return true;
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError);
        notificationManager.showError('Download failed completely. Please try again.');
        return false;
      }
    }

    return false;
  }
}
