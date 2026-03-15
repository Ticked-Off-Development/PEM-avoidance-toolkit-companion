const DB_NAME = 'pem_toolkit_db';
const DB_VERSION = 1;
const STORE = 'data';

// App-level data schema version (separate from IndexedDB version).
// Increment when adding new fields to stored data that need backfilling.
export const DATA_SCHEMA_VERSION = 2;

// Migrate stored app data to the current schema version.
// Non-destructive and additive — only adds missing fields, never removes data.
export function migrateData(stored) {
  if (!stored) return stored;
  const version = stored.schemaVersion || 1;
  if (version >= DATA_SCHEMA_VERSION) return stored;

  const migrated = { ...stored };

  // v1 → v2: backfill entryMode and override flags on existing day records
  if (version < 2 && Array.isArray(migrated.days)) {
    migrated.days = migrated.days.map(day => {
      const updated = day.entryMode ? day : { ...day, entryMode: 'full' };
      if (updated.overrideActivity === undefined) {
        updated.overrideActivity = updated.overall_activity !== '' && updated.overall_activity != null;
      }
      if (updated.overrideSymptom === undefined) {
        const os = updated.overall_symptom || { am: '', mid: '', pm: '' };
        updated.overrideSymptom = os.am !== '' || os.mid !== '' || os.pm !== '';
      }
      return updated;
    });
  }

  migrated.schemaVersion = DATA_SCHEMA_VERSION;
  return migrated;
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e);
  });
}

export async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => { db.close(); resolve(req.result !== undefined ? req.result : null); };
    req.onerror = () => { db.close(); resolve(null); };
  });
}

export async function dbSet(key, val) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(val, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = (e) => { db.close(); reject(e.target.error); };
  });
}

export async function dbExportAll() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    const reqKeys = store.getAllKeys();
    const result = {};
    req.onsuccess = () => {
      reqKeys.onsuccess = () => {
        const keys = reqKeys.result;
        const vals = req.result;
        keys.forEach((k, i) => { result[k] = vals[i]; });
        db.close();
        resolve(result);
      };
      reqKeys.onerror = () => { db.close(); resolve({}); };
    };
    req.onerror = () => { db.close(); resolve({}); };
  });
}

export async function dbImportAll(data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    Object.entries(data).forEach(([key, val]) => {
      store.put(val, key);
    });
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = (e) => { db.close(); reject(e.target.error); };
  });
}
