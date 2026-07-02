import { messaging, db } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';

// Public VAPID Key (FCM Web Push Certificate Key)
// Replace with your actual FCM VAPID Key from: Firebase Console > Project Settings > Cloud Messaging > Web configuration
const VAPID_KEY = "BDbZwt7s_mG0T4lP-0-q5S0n05s-fI8v9O8P9-v0gU";

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('[FCM] This browser does not support desktop notifications.');
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  console.log('[FCM] Notification permission status:', permission);
  return permission;
}

/**
 * Fetch FCM Registration Token for the device and save it in Firestore
 */
export async function getAndRegisterFCMToken(uid) {
  if (!uid || !messaging) return null;

  try {
    const permission = Notification.permission;
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission not granted. Cannot retrieve token.');
      return null;
    }

    // Get the FCM registration token using VAPID key
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready
    });

    if (token) {
      console.log('[FCM] Retrieved registration token:', token);
      
      // Store token in Firestore under userData/{uid}
      const userRef = doc(db, 'userData', uid);
      await setDoc(userRef, {
        fcmToken: token,
        fcmTokenLastUpdated: Date.now(),
        updatedAt: Date.now()
      }, { merge: true });

      console.log('[FCM] Registered FCM token in Firestore successfully.');
      
      // Store locally too
      localStorage.setItem('medivault_fcm_token', token);
      return token;
    } else {
      console.warn('[FCM] No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.error('[FCM] An error occurred while retrieving token:', err);
    return null;
  }
}

/**
 * Listen for foreground push notifications (when website tab is open)
 */
export function listenToForegroundMessages(onAlertCallback) {
  if (!messaging) return null;

  return onMessage(messaging, (payload) => {
    console.log('[FCM] Received foreground message:', payload);
    
    const notificationTitle = payload.notification?.title || payload.data?.title || 'MediVault Notification';
    const notificationBody = payload.notification?.body || payload.data?.body || 'New alert!';
    
    // Execute callback to show in-app notification banner
    if (onAlertCallback) {
      onAlertCallback({
        title: notificationTitle,
        body: notificationBody,
        type: payload.data?.type || 'general',
        url: payload.data?.url || '/'
      });
    }

    // Trigger local notification sound (optional standard audio chime)
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880.00, ctx.currentTime); // High pitch notification chime
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (_) {}
  });
}

/**
 * Sync water reminders or tablet alarms to the root 'reminders' collection in Firestore
 * so that the background Cloud Function can send push notifications when the site is closed.
 */
export async function syncRemindersToFirestore(userId, type, items, masterEnabled = true) {
  if (!userId || !db) return;

  try {
    const localSyncKey = `medivault_synced_ids_${type}`;
    let previousSyncedIds = [];
    try {
      previousSyncedIds = JSON.parse(localStorage.getItem(localSyncKey) || '[]');
    } catch (_) {}

    const currentIds = items.map(item => `${userId}_${type}_${item.id}`);

    // Delete items that are no longer present
    const idsToDelete = previousSyncedIds.filter(id => !currentIds.includes(id));
    for (const id of idsToDelete) {
      const docRef = doc(db, 'reminders', id);
      await deleteDoc(docRef);
    }

    // Set/Update current items
    for (const item of items) {
      const id = `${userId}_${type}_${item.id}`;
      const docRef = doc(db, 'reminders', id);

      let title = '';
      let body = '';
      let time24 = '';
      let active = false;
      let url = '';

      if (type === 'water') {
        title = '💧 Hydration Reminder — MediVault';
        body = `It's ${item.time}! Time to drink water 🌊\nTap to open app & hear reminder`;
        time24 = item.time24;
        active = masterEnabled && item.enabled;
        url = '/drinking-water';
      } else if (type === 'tablet') {
        title = '💊 Medicine Reminder!';
        body = `${item.time} — Time to take: ${item.tablet}\n🔔 Tap to open app & hear alarm sound`;
        time24 = item.time;
        active = item.active;
        url = '/tablet-alarm';
      }

      await setDoc(docRef, {
        userId,
        title,
        body,
        time24,
        type,
        active,
        url,
        updatedAt: Date.now()
      }, { merge: true });
    }

    // Save the new list of synced IDs
    localStorage.setItem(localSyncKey, JSON.stringify(currentIds));
    console.log(`[FCM] Successfully synced ${items.length} ${type} reminders/alarms to Firestore.`);
  } catch (err) {
    console.error(`[FCM] Failed to sync ${type} reminders/alarms to Firestore:`, err);
  }
}
