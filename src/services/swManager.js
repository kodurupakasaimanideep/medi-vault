/* ═══════════════════════════════════════════════════════════════════
   MediVault — Service Worker Manager v6
   
   Responsibilities:
   1. Register SW and maintain keep-alive background pings
   2. Sync alarm & water data to SW IndexedDB with user isolation
   3. Listen for SW messages → play synthesized audio / update state
   4. On mobile/desktop app open → check pending alarms → trigger sound & modal
   5. Support Periodic Background Sync for mobile Android/Chrome
═══════════════════════════════════════════════════════════════════ */

let swRegistration  = null;
let keepAlivePinger = null;

// Callbacks registered by AlarmManager / DrinkingWater to handle sounds
const _soundCallbacks = {
  playTabletAlarm: null,   // (alarm) => void
  playWaterSound:  null,   // (reminder) => void
};

const getActiveUserId = () => {
  try {
    const session = JSON.parse(localStorage.getItem('mv_auth_session'));
    return session?.uid || '';
  } catch {
    return '';
  }
};

/**
 * Register sound callbacks so SW messages can trigger in-page sound.
 */
export function registerSoundCallback(type, fn) {
  _soundCallbacks[type] = fn;
}

/* ─────────────────────────────────────────────────────────────
   Registration
───────────────────────────────────────────────────────────── */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Workers not supported.');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    console.log('[SW] Registered:', reg.scope);

    // Prompt immediate update check
    try {
      await reg.update();
    } catch (_) {}

    // Listen for ALL messages from the SW
    navigator.serviceWorker.addEventListener('message', handleSwMessage);

    // Try to register Periodic Background Sync (Android / Chrome)
    await tryRegisterPeriodicSync(reg);

    // Start pinging SW periodically to extend lifetime while tab is open
    startKeepAlivePing();

    // On app load: check for pending alarms that fired while closed
    setTimeout(() => checkPendingAlarms(), 1200);

    return reg;
  } catch (err) {
    console.error('[SW] Registration failed:', err);
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   Periodic Background Sync — wakes SW even when browser is idle
───────────────────────────────────────────────────────────── */
async function tryRegisterPeriodicSync(reg) {
  try {
    if ('periodicSync' in reg) {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (status.state === 'granted') {
        await reg.periodicSync.register('medivault-alarm-check', {
          minInterval: 60 * 1000, // minimum 1 minute
        });
        console.log('[SW] Periodic Background Sync registered');
      }
    }
  } catch (_) {
    // Not supported in some browsers — SW timer handles it
  }
}

/* ─────────────────────────────────────────────────────────────
   Keep-Alive Ping — sends a PING to SW periodically
───────────────────────────────────────────────────────────── */
function startKeepAlivePing() {
  if (keepAlivePinger) return;
  keepAlivePinger = setInterval(async () => {
    const controller = navigator.serviceWorker?.controller;
    if (!controller) return;

    const channel = new MessageChannel();
    channel.port1.onmessage = (e) => {
      const { pending } = e.data || {};
      if (pending?.length) {
        handlePendingAlarms(pending);
      }
    };
    controller.postMessage({ type: 'PING' }, [channel.port2]);
  }, 20000);
}

/* ─────────────────────────────────────────────────────────────
   Check pending alarms on app load
───────────────────────────────────────────────────────────── */
export async function checkPendingAlarms() {
  const controller = navigator.serviceWorker?.controller;
  if (!controller) return;

  const channel = new MessageChannel();
  channel.port1.onmessage = (e) => {
    const { pending } = e.data || {};
    if (pending?.length) {
      handlePendingAlarms(pending);
    }
  };
  controller.postMessage({ type: 'PING' }, [channel.port2]);
}

/**
 * Handle pending alarms that fired while app was closed
 */
function handlePendingAlarms(pending) {
  const now = Date.now();
  pending.forEach((item) => {
    // Only handle alarms that fired within the last 2 hours
    const age = now - (item.firedAt || 0);
    if (age > 2 * 60 * 60 * 1000) {
      sendToSW({ type: 'CLEAR_PENDING', payload: { key: item.key } });
      return;
    }

    if (item.type === 'tablet' && item.alarm) {
      if (_soundCallbacks.playTabletAlarm) {
        _soundCallbacks.playTabletAlarm(item.alarm);
      }
      window.dispatchEvent(new CustomEvent('medivault_sw_alarm', { detail: item.alarm }));
    }

    if (item.type === 'water' && item.reminder) {
      if (_soundCallbacks.playWaterSound) {
        _soundCallbacks.playWaterSound(item.reminder);
      }
      window.dispatchEvent(new CustomEvent('medivault_sw_water', { detail: item.reminder }));
    }

    sendToSW({ type: 'CLEAR_PENDING', payload: { key: item.key } });
  });
}

/* ─────────────────────────────────────────────────────────────
   Handle messages sent from SW to the page
───────────────────────────────────────────────────────────── */
function handleSwMessage(event) {
  const { type, alarm, reminder, amount } = event.data || {};

  // SW is telling the open tab to play tablet alarm sound
  if (type === 'PLAY_ALARM_SOUND' && alarm) {
    if (_soundCallbacks.playTabletAlarm) {
      _soundCallbacks.playTabletAlarm(alarm);
    }
    window.dispatchEvent(new CustomEvent('medivault_sw_alarm', { detail: alarm }));

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const userId   = getActiveUserId();
      const alarmKey = userId ? `medivault_alarms_${userId}` : 'medivault_alarms';
      const alarms   = JSON.parse(localStorage.getItem(alarmKey) || '[]');
      const updated  = alarms.map((a) =>
        a.id === alarm.id ? { ...a, lastTriggered: todayStr } : a
      );
      localStorage.setItem(alarmKey, JSON.stringify(updated));
    } catch (_) {}
  }

  // SW is telling the open tab to play water sound
  if (type === 'PLAY_WATER_SOUND' && reminder) {
    if (_soundCallbacks.playWaterSound) {
      _soundCallbacks.playWaterSound(reminder);
    }
    window.dispatchEvent(new CustomEvent('medivault_sw_water', { detail: reminder }));

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const userId   = getActiveUserId();
      const storeKey = userId ? `medivault_water_${userId}` : 'medivault_water';
      const store    = JSON.parse(localStorage.getItem(storeKey) || '{}');
      if (store.reminders) {
        store.reminders = store.reminders.map((r) =>
          r.id === reminder.id ? { ...r, lastTriggered: todayStr } : r
        );
        localStorage.setItem(storeKey, JSON.stringify(store));
      }
    } catch (_) {}
  }

  // Navigation from notification click
  if (type === 'NAVIGATE' && event.data.url) {
    window.dispatchEvent(new CustomEvent('medivault_navigate', { detail: event.data.url }));
  }

  // Quick-log water from notification action
  if (type === 'QUICK_LOG_WATER') {
    try {
      const userId   = getActiveUserId();
      const storeKey = userId ? `medivault_water_${userId}` : 'medivault_water';
      const store    = JSON.parse(localStorage.getItem(storeKey) || '{}');
      const todayKey = new Date().toLocaleDateString('en-CA');
      const now      = new Date();
      const timeStr  = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const entry    = {
        id: Date.now(), amount: amount || 250,
        drinkName: 'Water', color: null,
        time: timeStr, ts: Date.now(),
      };
      if (!store[todayKey]) store[todayKey] = { logs: [], total: 0 };
      store[todayKey].logs.push(entry);
      store[todayKey].total = (store[todayKey].total || 0) + (amount || 250);
      localStorage.setItem(storeKey, JSON.stringify(store));
      window.dispatchEvent(new CustomEvent('medivault_water_logged', { detail: entry }));
      window.dispatchEvent(new CustomEvent('medivault_water_updated'));
    } catch (_) {}
  }
}

/* ─────────────────────────────────────────────────────────────
   Helpers: send messages to SW
───────────────────────────────────────────────────────────── */
async function getController() {
  if (!('serviceWorker' in navigator)) return null;
  if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;

  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 4000);
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      clearTimeout(timer);
      resolve(navigator.serviceWorker.controller);
    });
  });
}

async function sendToSW(message) {
  const controller = await getController();
  if (controller) {
    controller.postMessage(message);
    return true;
  }
  return false;
}

/* ─────────────────────────────────────────────────────────────
   Public API
───────────────────────────────────────────────────────────── */

/**
 * Sync tablet alarms to SW with user UID isolation
 */
export async function syncTabletAlarmsToSW(alarms, userId = '') {
  const uid = userId || getActiveUserId();
  await sendToSW({ type: 'SYNC_TABLET_ALARMS', payload: alarms, userId: uid });
}

/**
 * Sync water reminders to SW with user UID isolation
 */
export async function syncWaterRemindersToSW(reminders, enabled, userId = '') {
  const uid = userId || getActiveUserId();
  await sendToSW({
    type: 'SYNC_WATER_REMINDERS',
    payload: { reminders, enabled },
    userId: uid,
  });
}

/**
 * Clear alarms from SW on user logout
 */
export async function clearUserAlarmsFromSW() {
  await sendToSW({ type: 'CLEAR_USER_ALARMS' });
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function isBackgroundNotificationSupported() {
  return 'serviceWorker' in navigator && 'Notification' in window;
}
