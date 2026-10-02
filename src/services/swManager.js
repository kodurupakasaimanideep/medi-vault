/* ═══════════════════════════════════════════════════════════════════
   MediVault — Service Worker Manager v4
   
   Responsibilities:
   1. Register SW and keep it alive with periodic pings
   2. Sync alarm data to SW (persisted in IndexedDB)
   3. Listen for SW messages → play sounds / update localStorage
   4. On app load → check pending alarms → trigger sound + modal
   5. Register Periodic Background Sync for Chrome
═══════════════════════════════════════════════════════════════════ */

let swRegistration  = null;
let keepAlivePinger = null;

// Callbacks registered by AlarmManager / DrinkingWater to handle sounds
const _soundCallbacks = {
  playTabletAlarm:  null,   // (alarm) => void
  playWaterSound:   null,   // (reminder) => void
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
 * Called by AlarmManager and DrinkingWater on mount.
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

    // Listen for ALL messages from the SW
    navigator.serviceWorker.addEventListener('message', handleSwMessage);

    // Try to register Periodic Background Sync (Chrome only, requires HTTPS or localhost)
    await tryRegisterPeriodicSync(reg);

    // Start pinging the SW every 20 seconds to keep it alive while tab is open
    startKeepAlivePing();

    // On app load: check for pending alarms that fired while tab was closed
    // Wait a moment for the page to fully mount before triggering sounds
    setTimeout(() => checkPendingAlarms(), 1500);

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
    // Not supported — that's OK, SW keepalive handles it
  }
}

/* ─────────────────────────────────────────────────────────────
   Keep-Alive Ping — sends a PING to SW every 20 seconds
   This extends the SW lifetime while the tab is open.
   When the tab closes, the SW uses its own internal timer.
───────────────────────────────────────────────────────────── */
function startKeepAlivePing() {
  if (keepAlivePinger) return;
  keepAlivePinger = setInterval(async () => {
    const controller = navigator.serviceWorker?.controller;
    if (!controller) return;

    // Send a PING with a MessageChannel so SW can respond with pending alarms
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
   Check pending alarms on app load (tab was closed when alarm fired)
───────────────────────────────────────────────────────────── */
async function checkPendingAlarms() {
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
 * Handle pending alarms that fired while the tab was closed.
 * Plays sound + shows the in-app alarm modal.
 */
function handlePendingAlarms(pending) {
  const now = Date.now();
  pending.forEach((item) => {
    // Only handle alarms that fired in the last 2 hours (not super stale ones)
    const age = now - (item.firedAt || 0);
    if (age > 2 * 60 * 60 * 1000) {
      // Too old — clear it silently
      sendToSW({ type: 'CLEAR_PENDING', payload: { key: item.key } });
      return;
    }

    if (item.type === 'tablet' && item.alarm) {
      // Trigger the tablet alarm sound + modal
      if (_soundCallbacks.playTabletAlarm) {
        _soundCallbacks.playTabletAlarm(item.alarm);
      }
      // Dispatch event so AlarmManager can pick it up even if callback not registered yet
      window.dispatchEvent(new CustomEvent('medivault_sw_alarm', { detail: item.alarm }));
    }

    if (item.type === 'water' && item.reminder) {
      if (_soundCallbacks.playWaterSound) {
        _soundCallbacks.playWaterSound(item.reminder);
      }
      window.dispatchEvent(new CustomEvent('medivault_sw_water', { detail: item.reminder }));
    }

    // Clear the pending item from SW IndexedDB
    sendToSW({ type: 'CLEAR_PENDING', payload: { key: item.key } });
  });
}

/* ─────────────────────────────────────────────────────────────
   Handle messages sent from SW to the page
───────────────────────────────────────────────────────────── */
function handleSwMessage(event) {
  const { type, alarm, reminder, amount } = event.data || {};

  // SW is telling the open tab to play tablet alarm sound RIGHT NOW
  if (type === 'PLAY_ALARM_SOUND' && alarm) {
    if (_soundCallbacks.playTabletAlarm) {
      _soundCallbacks.playTabletAlarm(alarm);
    }
    window.dispatchEvent(new CustomEvent('medivault_sw_alarm', { detail: alarm }));

    // Update localStorage so in-app checker doesn't re-fire
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const alarms   = JSON.parse(localStorage.getItem('medivault_alarms') || '[]');
      const updated  = alarms.map((a) =>
        a.id === alarm.id ? { ...a, lastTriggered: todayStr } : a
      );
      localStorage.setItem('medivault_alarms', JSON.stringify(updated));
    } catch (_) {}
  }

  // SW is telling the open tab to play water sound RIGHT NOW
  if (type === 'PLAY_WATER_SOUND' && reminder) {
    if (_soundCallbacks.playWaterSound) {
      _soundCallbacks.playWaterSound(reminder);
    }
    window.dispatchEvent(new CustomEvent('medivault_sw_water', { detail: reminder }));

    // Update localStorage
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

  // User navigated from notification click
  if (type === 'NAVIGATE' && event.data.url) {
    // Let the router handle navigation via custom event
    window.dispatchEvent(new CustomEvent('medivault_navigate', { detail: event.data.url }));
  }

  // SW says: quick-log 250ml water from notification action button
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
    } catch (_) {}
  }
}

/* ─────────────────────────────────────────────────────────────
   Helpers: send messages to SW
───────────────────────────────────────────────────────────── */
async function getController() {
  if (!('serviceWorker' in navigator)) return null;
  if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;

  // Wait up to 4 seconds for controller to be set
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
 * Sync tablet alarms to SW (and its IndexedDB) for background checking.
 * Call whenever alarms are added, edited, toggled, or deleted.
 */
export async function syncTabletAlarmsToSW(alarms) {
  await sendToSW({ type: 'SYNC_TABLET_ALARMS', payload: alarms });
}

/**
 * Sync water reminders to SW for background checking.
 */
export async function syncWaterRemindersToSW(reminders, enabled) {
  await sendToSW({
    type: 'SYNC_WATER_REMINDERS',
    payload: { reminders, enabled },
  });
}

/**
 * Request notification permission.
 * Returns 'granted' | 'denied' | 'default'
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return await Notification.requestPermission();
}

/**
 * Check if this browser supports background notifications.
 */
export function isBackgroundNotificationSupported() {
  return 'serviceWorker' in navigator && 'Notification' in window;
}
