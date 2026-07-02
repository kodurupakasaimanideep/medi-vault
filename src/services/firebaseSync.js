/**
 * firebaseSync.js — Per-user data sync between localStorage and Firestore
 *
 * Security model:
 *  - Data is scoped under `userData/{uid}/appState` in Firestore
 *  - Uses the Firebase UID (not username) as the isolation key
 *  - Users can ONLY read/write their own UID path (enforced by Firestore Security Rules)
 *  - The intercepted localStorage keys are prefixed — unrelated browser data is never synced
 *
 * Firestore Security Rules (set these in Firebase Console):
 *   match /userData/{uid}/appState/{document=**} {
 *     allow read, write: if request.auth != null && request.auth.uid == uid;
 *   }
 */

import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let syncActive = false;
let currentUid = null;
const originalSetItem = localStorage.setItem.bind(localStorage);
let syncTimeout = null;

// Keys we track — anything prefixed with these is user data
const isTrackedKey = (key) => {
  if (key === 'mv_auth_users' || key === 'mv_auth_session' || key.startsWith('userData_')) return false;
  return key.startsWith('medivault_') ||
         key.startsWith('yoga_') ||
         key.startsWith('mv_');
};

// ─────────────────────────────────────────────────────────────────────────────
// Init: load cloud data into localStorage, then begin intercepting writes
// ─────────────────────────────────────────────────────────────────────────────
export const initFirebaseSync = async (uid) => {
  if (!uid) return;
  if (syncActive && currentUid === uid) return; // Already active for this user

  // Force-save current data before switching users if somehow still active
  if (syncActive) {
    await syncAllDataToFirebase();
  }

  currentUid = uid;
  syncActive = true;

  // 1. Clear any existing tracked keys from other sessions to ensure a completely fresh start
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isTrackedKey(key)) keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));

  // 2. Load local per-user offline data
  const localDataStr = localStorage.getItem(`userData_${uid}`);
  if (localDataStr) {
    try {
      const localData = JSON.parse(localDataStr);
      Object.keys(localData).forEach((key) => {
        originalSetItem(key, localData[key]);
      });
      console.log(`[MediVault] Loaded offline data for UID ${uid}`);
    } catch (e) {
      console.error('[MediVault] Error parsing local offline data:', e);
    }
  } else {
    console.log(`[MediVault] New user or fresh login — starting with empty local data for UID ${uid}`);
  }

  // 3. Sync from Firebase (Path: userData/{uid}/appState)
  const docRef = doc(db, 'userData', uid, 'appState', 'snapshot');
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      Object.keys(data).forEach((key) => {
        originalSetItem(key, data[key]);
      });
      // Update local cache with Firebase data
      originalSetItem(`userData_${uid}`, JSON.stringify(data));
      console.log(`[MediVault] Loaded ${Object.keys(data).length} keys from Firebase for UID ${uid}`);
    }
  } catch (err) {
    console.error('[MediVault] Error loading data from Firebase (using offline local data instead):', err);
  }

  // Intercept localStorage writes to debounce-sync to Firestore
  localStorage.setItem = function (key, value) {
    originalSetItem(key, value);

    if (syncActive && currentUid && isTrackedKey(key)) {
      clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        syncAllDataToFirebase();
      }, 1500); // 1.5s debounce — batches rapid successive writes
    }
  };

  // Initial sync in case local data is newer
  syncAllDataToFirebase();
};

// ─────────────────────────────────────────────────────────────────────────────
// Sync all tracked localStorage keys to the user's Firestore document & local cache
// ─────────────────────────────────────────────────────────────────────────────
const syncAllDataToFirebase = async () => {
  if (!syncActive || !currentUid) return;

  const dataToSync = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isTrackedKey(key)) {
      dataToSync[key] = localStorage.getItem(key);
    }
  }

  // Save to isolated local per-user storage (offline support)
  originalSetItem(`userData_${currentUid}`, JSON.stringify(dataToSync));

  try {
    const docRef = doc(db, 'userData', currentUid, 'appState', 'snapshot');
    await setDoc(docRef, dataToSync, { merge: true });
    console.log('[MediVault] Synced app state to Firebase');
  } catch (err) {
    console.error('[MediVault] Error syncing to Firebase (data saved locally):', err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Stop sync and restore original localStorage behavior on logout
// ─────────────────────────────────────────────────────────────────────────────
export const stopFirebaseSync = async () => {
  if (syncActive) {
    // Flush any pending changes immediately before stopping
    clearTimeout(syncTimeout);
    await syncAllDataToFirebase();
  }
  syncActive = false;
  currentUid = null;
  localStorage.setItem = originalSetItem; // Restore native behavior
  console.log('[MediVault] Firebase sync stopped');
};

// ─────────────────────────────────────────────────────────────────────────────
// Clear all app-tracked localStorage keys (called on logout for privacy)
// ─────────────────────────────────────────────────────────────────────────────
export const clearLocalAppData = () => {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isTrackedKey(key)) keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
  console.log(`[MediVault] Cleared ${keysToRemove.length} local app keys after logout`);
};
