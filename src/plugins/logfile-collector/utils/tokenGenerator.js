/**
 * Generate a random token for log submissions
 * @param {number} length - Length of the token (default: 32)
 * @returns {string} - Generated token
 */
export function generateLogToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Generate a timestamp-based log token
 * @returns {string} - Generated token with timestamp prefix
 */
export function generateTimestampLogToken() {
  const timestamp = Date.now().toString(36); // Base36 timestamp
  const randomPart = generateLogToken(16);
  return `log_${timestamp}_${randomPart}`;
}
