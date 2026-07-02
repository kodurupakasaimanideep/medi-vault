/**
 * db.js — User-scoped IndexedDB utility for Medical Slips
 *
 * Security model:
 *  - Each user gets their OWN IndexedDB database: `MedicalSlipsDB_{uid}`
 *  - This guarantees data created by one user is NEVER visible to another,
 *    even if they share the same device/browser.
 *  - New users start with a completely empty database.
 *
 * Usage:
 *   import { initDB, addSlip, getAllSlips } from '../utils/db';
 *   const db = await initDB(currentUser.uid);
 *   const slips = await getAllSlips(db);
 */

// Open (or create) the user-scoped database
export const initDB = (uid) => {
  if (!uid) return Promise.reject(new Error('User UID is required to open the database.'));

  return new Promise((resolve, reject) => {
    const dbName = `MedicalSlipsDB_${uid}`; // Unique per user — strict isolation
    const request = indexedDB.open(dbName, 1);

    request.onerror = (event) => {
      console.error('[DB] IndexedDB error:', event);
      reject(new Error('Error opening user database'));
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('slips')) {
        db.createObjectStore('slips', { keyPath: 'id' });
      }
    };
  });
};

// ─── CRUD helpers (all require the db instance from initDB) ─────────────────

export const addSlip = (db, slip) =>
  new Promise((resolve, reject) => {
    const tx = db.transaction(['slips'], 'readwrite');
    const store = tx.objectStore('slips');
    const req = store.add(slip);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export const updateSlip = (db, slip) =>
  new Promise((resolve, reject) => {
    const tx = db.transaction(['slips'], 'readwrite');
    const store = tx.objectStore('slips');
    const req = store.put(slip);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export const deleteSlip = (db, id) =>
  new Promise((resolve, reject) => {
    const tx = db.transaction(['slips'], 'readwrite');
    const store = tx.objectStore('slips');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

export const getAllSlips = (db) =>
  new Promise((resolve, reject) => {
    const tx = db.transaction(['slips'], 'readonly');
    const store = tx.objectStore('slips');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
