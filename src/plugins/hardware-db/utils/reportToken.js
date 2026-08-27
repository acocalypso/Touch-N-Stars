/**
 * Report tokens are generated on the client so the user gets a receipt without
 * needing the server to answer with one. They are the only handle to look up
 * one's own submission later, so they must be unguessable — otherwise anyone
 * could enumerate review states.
 */
export function generateReportToken() {
  const random = new Uint8Array(12);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(random);
  } else {
    for (let i = 0; i < random.length; i++) random[i] = Math.floor(Math.random() * 256);
  }

  const suffix = Array.from(random, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `hw_${Date.now().toString(36)}_${suffix}`;
}

/**
 * Pseudonymous, stable per installation. Lets the review side spot repeat
 * submissions from the same rig without any personal identifier.
 */
export function generateInstallId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  const random = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(random);
  } else {
    for (let i = 0; i < random.length; i++) random[i] = Math.floor(Math.random() * 256);
  }
  random[6] = (random[6] & 0x0f) | 0x40;
  random[8] = (random[8] & 0x3f) | 0x80;

  const hex = Array.from(random, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
