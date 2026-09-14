const DB_NAME = 'tns-logfile-collector';
const STORE_NAME = 'archives';
const DB_VERSION = 1;

export const MAX_SAVED_ARCHIVES = 5;

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function runTransaction(mode, operation) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const req = operation(tx.objectStore(STORE_NAME));
        tx.oncomplete = () => resolve(req?.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

export function putArchive(record) {
  return runTransaction('readwrite', (store) => store.put(record));
}

export async function listArchives() {
  const records = (await runTransaction('readonly', (store) => store.getAll())) ?? [];
  return records
    .map(({ id, filename, createdAt, size, description, token }) => ({
      id,
      filename,
      createdAt,
      size,
      description,
      token,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

export async function getArchive(id) {
  return (await runTransaction('readonly', (store) => store.get(id))) ?? null;
}

export function deleteArchive(id) {
  return runTransaction('readwrite', (store) => store.delete(id));
}

export function archivesToEvict(sortedNewestFirst, max = MAX_SAVED_ARCHIVES) {
  return sortedNewestFirst.slice(max).map((archive) => archive.id);
}
