/**
 * ═══════════════════════════════════════════════════════════════════
 * MediVault — Native Android Notification & Alarm Bridge
 * 
 * Uses @capacitor/local-notifications for hardware-level scheduled
 * exact alarms, notification channels, action buttons, and background
 * wakeups on Android devices.
 * ═══════════════════════════════════════════════════════════════════
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

let isInitialized = false;

/**
 * Check if running inside native Android / iOS Capacitor container
 */
export const isNativeApp = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Get active user ID from localStorage session
 */
const getActiveUserId = () => {
  try {
    const session = JSON.parse(localStorage.getItem('mv_auth_session'));
    return session?.uid || 'guest';
  } catch {
    return 'guest';
  }
};

/**
 * Request notification and exact alarm permissions on Android
 */
export async function requestNativePermissions() {
  if (!isNativeApp()) return 'web_default';

  try {
    console.log('[NativeNotif] Checking Android notification permissions...');
    const status = await LocalNotifications.checkPermissions();
    console.log('[NativeNotif] Current permission status:', status);

    if (status.display !== 'granted') {
      const requested = await LocalNotifications.requestPermissions();
      console.log('[NativeNotif] Requested permission status:', requested);
      return requested.display;
    }

    return status.display;
  } catch (err) {
    console.error('[NativeNotif] Error checking/requesting permissions:', err);
    return 'denied';
  }
}

/**
 * Initialize native Android notification channels, action types, and event listeners
 */
export async function initNativeNotifications() {
  if (!isNativeApp()) return false;
  if (isInitialized) return true;

  try {
    console.log('[NativeNotif] Initializing Native Android Notification Subsystem...');

    // 1. Request POST_NOTIFICATIONS permission for Android 13+ (API 33+)
    await requestNativePermissions();

    // 2. Register Interactive Action Types (Buttons on Android notification)
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'MEDIVAULT_TABLET_ACTIONS',
          actions: [
            {
              id: 'take',
              title: '💊 Take Medicine',
              foreground: false
            },
            {
              id: 'snooze_5',
              title: '⏰ Snooze 5 Min',
              foreground: false
            }
          ]
        },
        {
          id: 'MEDIVAULT_WATER_ACTIONS',
          actions: [
            {
              id: 'drink_250',
              title: '💧 Drink 250ml',
              foreground: false
            },
            {
              id: 'snooze_5',
              title: '⏰ Snooze 5 Min',
              foreground: false
            }
          ]
        }
      ]
    });

    // 3. Create high-importance Android 8.0+ notification channels
    await LocalNotifications.createChannel({
      id: 'medivault_tablet_alarms',
      name: 'Tablet & Medicine Reminders',
      description: 'High-priority alarms for scheduled medicine doses',
      importance: 5, // MAX importance — makes sound and pops up on screen (heads-up)
      visibility: 1, // Visible on secure lockscreens
      vibration: true,
      lights: true,
      lightColor: '#8B5CF6'
    });

    await LocalNotifications.createChannel({
      id: 'medivault_water_reminders',
      name: 'Hydration & Water Reminders',
      description: 'Regular notifications to drink water and maintain daily hydration',
      importance: 4, // HIGH importance — makes sound and shows in shade
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#0EA5E9'
    });

    // 4. Listen for notification button clicks and user taps
    LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
      console.log('[NativeNotif] Notification action clicked:', notificationAction);
      handleNotificationAction(notificationAction);
    });

    // 5. Listen for delivered notifications
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('[NativeNotif] Notification received / delivered on Android:', notification);
    });

    isInitialized = true;
    console.log('[NativeNotif] Android Notification System initialized successfully.');
    return true;
  } catch (err) {
    console.error('[NativeNotif] Failed to initialize native notification system:', err);
    return false;
  }
}

/**
 * Handle notification clicks, action buttons (Take, Drink, Snooze) and navigation
 */
function handleNotificationAction(event) {
  const { actionId, notification } = event;
  const extra = notification?.extra || {};
  const notifType = extra.type; // 'tablet' | 'water' | 'snooze'

  console.log(`[NativeNotif] Processing action "${actionId}" for type "${notifType}"`);

  // ── SNOOZE 5 MINUTES ──
  if (actionId === 'snooze_5') {
    const snoozeDate = new Date(Date.now() + 5 * 60 * 1000);
    const snoozeId = Math.floor(Math.random() * 8000) + 9000;
    const title = notifType === 'water' ? '💧 Water Reminder (Snoozed)' : `💊 Medicine Reminder (Snoozed)`;
    const body = notifType === 'water' 
      ? '5 minutes up! Time to drink water. 🌊' 
      : `5 minutes up! Time to take: ${extra.tablet || 'Medicine'}`;

    LocalNotifications.schedule({
      notifications: [
        {
          id: snoozeId,
          title,
          body,
          channelId: notifType === 'water' ? 'medivault_water_reminders' : 'medivault_tablet_alarms',
          schedule: { at: snoozeDate, allowWhileIdle: true },
          extra: { ...extra, type: 'snooze', originalType: notifType }
        }
      ]
    });
    console.log(`[NativeNotif] Snoozed notification scheduled for ${snoozeDate.toLocaleTimeString()}`);
    return;
  }

  // ── QUICK-LOG WATER INTAKE ──
  if (actionId === 'drink_250') {
    try {
      const uid = getActiveUserId();
      const storeKey = uid ? `medivault_water_${uid}` : 'medivault_water';
      const store = JSON.parse(localStorage.getItem(storeKey) || '{}');
      const todayKey = new Date().toLocaleDateString('en-CA');
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const amount = 250;

      const entry = {
        id: Date.now(),
        amount,
        drinkName: 'Water',
        color: null,
        time: timeStr,
        ts: Date.now(),
      };

      if (!store[todayKey]) store[todayKey] = { logs: [], total: 0 };
      store[todayKey].logs.push(entry);
      store[todayKey].total = (store[todayKey].total || 0) + amount;
      localStorage.setItem(storeKey, JSON.stringify(store));

      window.dispatchEvent(new CustomEvent('medivault_water_logged', { detail: entry }));
      window.dispatchEvent(new CustomEvent('medivault_water_updated'));
      console.log(`[NativeNotif] Quick-logged 250ml water for user ${uid}`);
    } catch (e) {
      console.error('[NativeNotif] Error logging quick water from notification:', e);
    }
    return;
  }

  // ── DEFAULT TAP / TAKE MEDICINE → NAVIGATE TO CORRECT PAGE ──
  const targetUrl = notifType === 'water' ? '/drinking-water' : '/tablet-alarm';
  window.dispatchEvent(new CustomEvent('medivault_navigate', { detail: targetUrl }));
}

/**
 * Schedule native Android notifications for Tablet Alarms
 * @param {Array} alarms - List of alarm objects
 * @param {string} userId - User UID for strict data isolation
 */
export async function scheduleNativeTabletAlarms(alarms = [], userId = '') {
  if (!isNativeApp()) return;

  const uid = userId || getActiveUserId();

  try {
    // 1. Cancel previous tablet notifications to avoid duplicates or orphaned alarms
    const pending = await LocalNotifications.getPending();
    const tabletNotifIds = pending.notifications
      .filter(n => n.extra?.type === 'tablet' || n.extra?.channel === 'tablet')
      .map(n => ({ id: n.id }));

    if (tabletNotifIds.length > 0) {
      await LocalNotifications.cancel({ notifications: tabletNotifIds });
      console.log(`[NativeNotif] Cancelled ${tabletNotifIds.length} previous tablet alarm notifications for user ${uid}`);
    }

    const notificationsToSchedule = [];

    alarms.forEach((alarm, index) => {
      if (!alarm.active || !alarm.time) return;

      const [hours, minutes] = alarm.time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return;

      // Unique positive integer ID for Capacitor Local Notifications (1001-4999 range)
      const notifId = 1000 + (index % 4000) + 1;

      notificationsToSchedule.push({
        id: notifId,
        title: '💊 Medicine Reminder — MediVault',
        body: `Time: ${alarm.time} — Take your scheduled dose: ${alarm.tablet || 'Medicine'}`,
        channelId: 'medivault_tablet_alarms',
        actionTypeId: 'MEDIVAULT_TABLET_ACTIONS',
        schedule: {
          on: {
            hour: hours,
            minute: minutes
          },
          repeats: true, // Daily repeating exact alarm
          allowWhileIdle: true // Fires in Android Doze mode / lockscreen
        },
        extra: {
          type: 'tablet',
          channel: 'tablet',
          alarmId: alarm.id,
          tablet: alarm.tablet,
          time: alarm.time,
          userId: uid
        }
      });
    });

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      console.log(`[NativeNotif] Successfully scheduled ${notificationsToSchedule.length} daily repeating native tablet alarms for user ${uid}`);
    } else {
      console.log(`[NativeNotif] No active tablet alarms to schedule for user ${uid}`);
    }
  } catch (err) {
    console.error('[NativeNotif] Error scheduling native tablet alarms:', err);
  }
}

/**
 * Schedule native Android notifications for Water Reminders
 * @param {Array} reminders - List of water reminder objects
 * @param {boolean} masterEnabled - Whether master water reminder switch is active
 * @param {string} userId - User UID
 */
export async function scheduleNativeWaterReminders(reminders = [], masterEnabled = true, userId = '') {
  if (!isNativeApp()) return;

  const uid = userId || getActiveUserId();

  try {
    // 1. Cancel previous water reminders
    const pending = await LocalNotifications.getPending();
    const waterNotifIds = pending.notifications
      .filter(n => n.extra?.type === 'water' || n.extra?.channel === 'water')
      .map(n => ({ id: n.id }));

    if (waterNotifIds.length > 0) {
      await LocalNotifications.cancel({ notifications: waterNotifIds });
      console.log(`[NativeNotif] Cancelled ${waterNotifIds.length} previous water reminder notifications for user ${uid}`);
    }

    if (!masterEnabled || !reminders || reminders.length === 0) {
      console.log(`[NativeNotif] Water reminders are disabled or empty for user ${uid}`);
      return;
    }

    const notificationsToSchedule = [];

    reminders.forEach((item, index) => {
      if (!item.enabled) return;

      const timeStr = item.time24 || item.time;
      if (!timeStr) return;

      const [hours, minutes] = timeStr.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return;

      // Unique positive integer ID for Capacitor Local Notifications (5001-8999 range)
      const notifId = 5000 + (index % 4000) + 1;
      const amountStr = item.amount ? ` (${item.amount}ml)` : '';

      notificationsToSchedule.push({
        id: notifId,
        title: '💧 Hydration Reminder — MediVault',
        body: `It's ${timeStr}! Time to drink water${amountStr}. Stay healthy and hydrated! 🌊`,
        channelId: 'medivault_water_reminders',
        actionTypeId: 'MEDIVAULT_WATER_ACTIONS',
        schedule: {
          on: {
            hour: hours,
            minute: minutes
          },
          repeats: true, // Daily repeating alarm
          allowWhileIdle: true // Fires in Android Doze mode
        },
        extra: {
          type: 'water',
          channel: 'water',
          reminderId: item.id,
          time: timeStr,
          amount: item.amount || 250,
          userId: uid
        }
      });
    });

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      console.log(`[NativeNotif] Successfully scheduled ${notificationsToSchedule.length} daily repeating water reminders for user ${uid}`);
    }
  } catch (err) {
    console.error('[NativeNotif] Error scheduling native water reminders:', err);
  }
}

/**
 * Cancel all pending native notifications (used on logout)
 */
export async function cancelAllNativeNotifications() {
  if (!isNativeApp()) return;

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
      console.log(`[NativeNotif] Cancelled all ${pending.notifications.length} native scheduled notifications`);
    }
  } catch (err) {
    console.error('[NativeNotif] Error cancelling all native notifications:', err);
  }
}

/**
 * Clear all delivered notifications from Android notification shade
 */
export async function dismissNativeDeliveredNotifications() {
  if (!isNativeApp()) return;
  try {
    await LocalNotifications.removeAllDeliveredNotifications();
    console.log('[NativeNotif] Cleared all delivered notifications from notification tray');
  } catch (err) {
    console.error('[NativeNotif] Error clearing delivered notifications:', err);
  }
}

/**
 * Sync all user reminders on app start or login
 */
export async function syncNativeUserReminders(userId) {
  if (!isNativeApp() || !userId) return;

  try {
    console.log(`[NativeNotif] Rescheduling all native alarms for logged-in user: ${userId}`);

    // Load tablet alarms for user
    const alarmKey = `medivault_alarms_${userId}`;
    const alarms = JSON.parse(localStorage.getItem(alarmKey) || localStorage.getItem('medivault_alarms') || '[]');
    await scheduleNativeTabletAlarms(alarms, userId);

    // Load water reminders for user
    const waterKey = `medivault_water_${userId}`;
    const waterStore = JSON.parse(localStorage.getItem(waterKey) || localStorage.getItem('medivault_water') || '{}');
    const reminders = waterStore.reminders || [];
    const remindersOn = waterStore.remindersOn ?? false;
    await scheduleNativeWaterReminders(reminders, remindersOn, userId);
  } catch (err) {
    console.error('[NativeNotif] Error syncing native user reminders:', err);
  }
}
