import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { saveAs } from 'file-saver';

// Create a global notification manager
class NotificationManager {
  constructor() {
    this.container = null;
    this.createContainer();
  }

  createContainer() {
    if (document.getElementById('log-download-notifications')) return;

    this.container = document.createElement('div');
    this.container.id = 'log-download-notifications';
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
    notification.id = 'download-progress';
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
            <div style="font-weight: 600; font-size: 14px;">Preparing Download</div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 2px;">Processing log files...</div>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(notification);
    return notification;
  }

  showSuccess(message, details) {
    const existingProgress = document.getElementById('download-progress');
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
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">Download Complete!</div>
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
    const existingProgress = document.getElementById('download-progress');
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
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">Download Failed</div>
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

// Add CSS animations to the document
const addStyles = () => {
  if (document.getElementById('log-download-styles')) return;

  const style = document.createElement('style');
  style.id = 'log-download-styles';
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.02);
      }
    }
    
    @keyframes checkmark {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    @keyframes shake {
      0%, 100% {
        transform: translateX(0);
      }
      25% {
        transform: translateX(-5px);
      }
      75% {
        transform: translateX(5px);
      }
    }
  `;
  document.head.appendChild(style);
};

// Initialize styles and notification manager
addStyles();
const notificationManager = new NotificationManager();

/**
 * Downloads logs to file system or browser
 * @param {Array} logs - Array of log entries with timestamp, level, and message
 * @param {Function} formatTimestamp - Function to format timestamp
 * @param {Object} options - Additional options
 * @param {string} options.filePrefix - Prefix for the filename (default: 'logs')
 * @param {string} options.folderName - Folder name for mobile platforms (default: 'TNS-Logs')
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
export async function downloadLogs(logs, formatTimestamp, options = {}) {
  const { filePrefix = 'logs', folderName = 'TNS-Logs' } = options;

  // Show progress notification
  notificationManager.showProgress();

  try {
    const logContent = logs
      .map((entry) => `[${formatTimestamp(entry.timestamp)}] ${entry.level}: ${entry.message}`)
      .join('\n');

    const fileName = `${filePrefix}-${new Date().toISOString().slice(0, 10)}.log`;
    const platform = Capacitor.getPlatform();

    if (platform === 'android' || platform === 'ios') {
      // Use Documents directory for both platforms for better compatibility
      const directory = Directory.Documents;

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

      // Write the log file
      await Filesystem.writeFile({
        path: `${folderName}/${fileName}`,
        data: logContent,
        directory: directory,
        encoding: 'utf8',
      });

      console.log(`Log file saved successfully to ${folderName}/${fileName}`);

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
          `Saved to ${folderName} folder in device storage`,
          `File: ${fileName} • ${logs.length} log entries`
        );
      } else if (platform === 'ios') {
        notificationManager.showSuccess(
          `Saved to ${folderName} folder`,
          `Access via Files app • ${fileName} • ${logs.length} entries`
        );
      }

      return true;
    } else {
      // Web browser fallback using file-saver
      const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, fileName);

      notificationManager.showSuccess(
        `Download started: ${fileName}`,
        `${logs.length} log entries • Check your Downloads folder`
      );

      return true;
    }
  } catch (error) {
    console.error('Error saving log file:', error);

    // Show error notification
    notificationManager.showError(`Failed to save log file: ${error.message || 'Unknown error'}`);

    return false;
  }
}
