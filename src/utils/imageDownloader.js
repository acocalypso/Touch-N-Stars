import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

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

  try {
    const now = new Date();
    const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const folderName = `${folderPrefix}-${currentDate}`;

    let fileName = `${filePrefix}-${imageDate}.jpg`;

    if (imageDate === '0000-00-00') {
      fileName = `${filePrefix}-${currentDate}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.jpg`;
    }

    const platform = Capacitor.getPlatform();

    if (platform === 'android' || platform === 'ios') {
      // Use Documents directory for both platforms for better compatibility
      const directory = Directory.Documents;

      // Convert the image to base64
      const response = await fetch(imageData);
      const blob = await response.blob();

      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });

      // Create folder directory if it doesn't exist
      try {
        await Filesystem.mkdir({
          path: folderName,
          directory: directory,
          recursive: true,
        });
      } catch (mkdirError) {
        // Directory might already exist, ignore error
        if (
          !mkdirError.message.includes('Directory exists') &&
          !mkdirError.message.includes('already exists')
        ) {
          console.warn('Error creating directory:', mkdirError);
        }
      }

      // Write the image file to the date-specific folder
      await Filesystem.writeFile({
        path: `${folderName}/${fileName}`,
        data: base64Data,
        directory: directory,
        encoding: undefined, // Use default encoding for binary data
      });

      console.log(`Image saved successfully to ${folderName}/${fileName}`);

      // Show success notification with platform-specific message
      if (platform === 'android') {
        // For Android, try to get the file URI for better user feedback
        try {
          const uriResult = await Filesystem.getUri({
            path: `${folderName}/${fileName}`,
            directory: directory,
          });
          console.log(`File URI: ${uriResult.uri}`);
        } catch (uriError) {
          console.warn('Error getting file URI:', uriError);
        }

        notificationManager.showSuccess(
          `Image saved to ${folderName} folder`,
          `File: ${fileName} • Saved to device storage`
        );
      } else if (platform === 'ios') {
        notificationManager.showSuccess(
          `Image saved to ${folderName} folder`,
          `Access via Files app • ${fileName}`
        );
      }

      return true;
    } else {
      // Standard web browser download
      const response = await fetch(imageData);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
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

    // Show error notification
    notificationManager.showError(`Failed to save image: ${error.message || 'Unknown error'}`);

    // Try fallback method for mobile platforms
    if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
      try {
        const response = await fetch(imageData);
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName || 'image.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => {
          URL.revokeObjectURL(downloadUrl);
        }, 100);

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
