import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { saveAs } from 'file-saver';

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

      if (platform === 'android') {
        // For Android, make the file accessible in the media store
        try {
          // Get the URI of the saved file
          const uriResult = await Filesystem.getUri({
            path: `${folderName}/${fileName}`,
            directory: directory,
          });

          console.log(`File URI: ${uriResult.uri}`);
        } catch (uriError) {
          console.warn('Error getting file URI:', uriError);
        }

        alert(`Log file saved to ${folderName} folder in device storage.`);
      } else if (platform === 'ios') {
        alert(`Log file saved to ${folderName} folder. You can access it from the Files app.`);
      }

      return true;
    } else {
      // Web browser fallback using file-saver
      const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, fileName);
      return true;
    }
  } catch (error) {
    console.error('Error saving log file:', error);
    return false;
  }
}
