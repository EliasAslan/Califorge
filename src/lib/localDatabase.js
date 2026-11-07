// Independent local data store for APEX.
// Workout history and saved routines live in IndexedDB; localStorage is a
// compatibility fallback for browsers where IndexedDB is unavailable.

const DB_NAME = 'apex-personal-training';
const DB_VERSION = 2;
const STORES = Object.freeze({ sessions: 'sessions', customWorkouts: 'customWorkouts', bodyweightEntries: 'bodyweightEntries' });
const FALLBACK_PREFIX = 'apex.local.v1.';

let databasePromise;

function makeId(prefix) {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? `${prefix}_${uuid}` : `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function fallbackRead(storeName) {
  try {
    const raw = globalThis.localStorage?.getItem(FALLBACK_PREFIX + storeName);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function fallbackWrite(storeName, rows) {
  try {
    const storage = globalThis.localStorage;
    if (!storage) throw new Error('Browser storage is unavailable.');
    storage.setItem(FALLBACK_PREFIX + storeName, JSON.stringify(rows));
  } catch (error) {
    throw new Error(`Could not save ${storeName}. Browser storage may be full or unavailable.`, { cause: error });
  }
}

function openDatabase() {
  // Use localStorage only when IndexedDB is genuinely unavailable. If IndexedDB
  // exists but cannot be opened, silently switching stores could make existing
  // workout history appear to have vanished or split data across two stores.
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      let blocked = false;
      request.onupgradeneeded = () => {
        const db = request.result;
        Object.values(STORES).forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };
      request.onsuccess = () => {
        const db = request.result;
        if (blocked) {
          db.close();
          return;
        }
        // Allow a future schema upgrade to proceed after this tab closes the DB.
        db.onversionchange = () => {
          db.close();
          databasePromise = null;
        };
        resolve(db);
      };
      request.onerror = () => reject(request.error || new Error('Could not open local database.'));
      request.onblocked = () => {
        blocked = true;
        reject(new Error('APEX storage is busy in another tab. Close other APEX tabs and reload.'));
      };
    }).catch((error) => {
      databasePromise = null;
      throw new Error(`Could not open APEX local storage: ${error.message || 'unknown IndexedDB error'}`, { cause: error });
    });
  }
  return databasePromise;
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Local database request failed.'));
  });
}

async function readAll(storeName) {
  const db = await openDatabase();
  if (!db) return fallbackRead(storeName);
  const tx = db.transaction(storeName, 'readonly');
  return requestResult(tx.objectStore(storeName).getAll());
}

async function putRecord(storeName, record) {
  const db = await openDatabase();
  if (!db) {
    const rows = fallbackRead(storeName);
    const index = rows.findIndex((item) => item.id === record.id);
    if (index >= 0) rows[index] = record;
    else rows.push(record);
    fallbackWrite(storeName, rows);
    return record;
  }
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).put(record);
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Could not save record.'));
    tx.onabort = () => reject(tx.error || new Error('Save was cancelled.'));
  });
  return record;
}

async function clearStore(storeName) {
  const db = await openDatabase();
  if (!db) {
    fallbackWrite(storeName, []);
    return;
  }
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).clear();
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Could not clear local data.'));
    tx.onabort = () => reject(tx.error || new Error('Clear operation was cancelled.'));
  });
}

async function deleteRecord(storeName, id) {
  const db = await openDatabase();
  if (!db) {
    fallbackWrite(storeName, fallbackRead(storeName).filter((item) => item.id !== id));
    return;
  }
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).delete(id);
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Could not delete record.'));
    tx.onabort = () => reject(tx.error || new Error('Delete operation was cancelled.'));
  });
}

async function replaceAllStores({ sessions = [], customWorkouts = [], bodyweightEntries = [] }) {
  const prepared = {
    [STORES.sessions]: sessions.map((row) => ({
      ...row,
      id: row.id || makeId('session'),
      created_date: row.created_date || row.date || new Date().toISOString(),
    })),
    [STORES.customWorkouts]: customWorkouts.map((row) => ({
      ...row,
      id: row.id || makeId('routine'),
      created_date: row.created_date || new Date().toISOString(),
    })),
    [STORES.bodyweightEntries]: bodyweightEntries.map((row) => ({
      ...row,
      id: row.id || makeId('weight'),
      created_date: row.created_date || row.date || new Date().toISOString(),
    })),
  };
  const db = await openDatabase();
  if (!db) {
    // localStorage fallback cannot provide a multi-key transaction, but each
    // collection is prepared and validated before either key is overwritten.
    fallbackWrite(STORES.sessions, prepared[STORES.sessions]);
    fallbackWrite(STORES.customWorkouts, prepared[STORES.customWorkouts]);
    return;
  }
  const tx = db.transaction([STORES.sessions, STORES.customWorkouts], 'readwrite');
  Object.values(STORES).forEach((storeName) => {
    const store = tx.objectStore(storeName);
    store.clear();
    prepared[storeName].forEach((row) => store.put(row));
  });
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Could not restore local data.'));
    tx.onabort = () => reject(tx.error || new Error('Restore operation was cancelled.'));
  });
}

function sortOldestFirst(rows, dateField = 'created_date') {
  return rows.sort((a, b) => {
    const aDate = new Date(a[dateField] || a.date || 0).getTime();
    const bDate = new Date(b[dateField] || b.date || 0).getTime();
    return aDate - bDate;
  });
}

export async function listSessions() {
  return sortOldestFirst(await readAll(STORES.sessions), 'date');
}

export async function createSession(data) {
  const now = new Date().toISOString();
  return putRecord(STORES.sessions, {
    ...data,
    id: data.id || makeId('session'),
    created_date: data.created_date || now,
  });
}

export async function deleteAllSessions() {
  return clearStore(STORES.sessions);
}


export async function listBodyweightEntries() {
  return sortOldestFirst(await readAll(STORES.bodyweightEntries), 'date');
}

export async function createBodyweightEntry(data) {
  const weightKg = Number(data?.weightKg);
  if (!Number.isFinite(weightKg) || weightKg <= 0) throw new Error('Enter a valid bodyweight.');
  const date = data.date || new Date().toISOString();
  const dayKey = new Date(date).toISOString().slice(0, 10);
  return putRecord(STORES.bodyweightEntries, {
    ...data,
    id: data.id || `weight_${dayKey}`,
    date,
    weightKg: Number(weightKg.toFixed(2)),
    source: data.source || 'manual',
    created_date: data.created_date || new Date().toISOString(),
  });
}

export async function deleteAllBodyweightEntries() {
  return clearStore(STORES.bodyweightEntries);
}

export async function listCustomWorkouts() {
  return sortOldestFirst(await readAll(STORES.customWorkouts));
}

export async function createCustomWorkout(data) {
  const now = new Date().toISOString();
  return putRecord(STORES.customWorkouts, {
    ...data,
    id: data.id || makeId('routine'),
    created_date: data.created_date || now,
  });
}

export async function deleteCustomWorkout(id) {
  return deleteRecord(STORES.customWorkouts, id);
}

export async function deleteAllCustomWorkouts() {
  return clearStore(STORES.customWorkouts);
}

export async function replaceAllTrainingData({ sessions = [], customWorkouts = [], bodyweightEntries = [] } = {}) {
  if (!Array.isArray(sessions) || !Array.isArray(customWorkouts)) {
    throw new Error('Backup file has an invalid data structure.');
  }
  // Validate before changing either store so malformed files cannot partially replace data.
  if (sessions.some((row) => !row || typeof row !== 'object' || !Array.isArray(row.exercises))) {
    throw new Error('Backup contains an invalid workout session.');
  }
  if (customWorkouts.some((row) => !row || typeof row !== 'object' || !Array.isArray(row.exercises))) {
    throw new Error('Backup contains an invalid custom workout.');
  }
  if (!Array.isArray(bodyweightEntries) || bodyweightEntries.some((row) => !row || typeof row !== 'object' || !Number.isFinite(Number(row.weightKg)) || Number(row.weightKg) <= 0)) {
    throw new Error('Backup contains an invalid bodyweight entry.');
  }
  await replaceAllStores({ sessions, customWorkouts, bodyweightEntries });
}

export async function clearAllTrainingData() {
  await Promise.all([deleteAllSessions(), deleteAllCustomWorkouts(), deleteAllBodyweightEntries()]);
}

export const LOCAL_DATA_INFO = Object.freeze({
  databaseName: DB_NAME,
  storage: 'IndexedDB',
  sync: false,
});
