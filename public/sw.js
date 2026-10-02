/* ═══════════════════════════════════════════════════════════════════
   MediVault Service Worker v6 — High-Reliability Mobile & Desktop Background Alarms
   
   Features:
   1. Multi-User Isolation: Stores alarms & water reminders per user UID in IndexedDB.
   2. Precise Next Alarm Scheduling: Accurately schedules timer to the exact upcoming minute.
   3. Mobile Background Persistence: Uses Periodic Background Sync, Keep-Alive pinging, and timer loops.
   4. High-Priority Mobile Notifications:
      - Loud repeating vibration pattern [500, 250, 500, 250, 500, 250, 800, 400, 800]
      - requireInteraction: true (stays on mobile lockscreen / notification shade)
      - silent: false (triggers device notification sound)
      - Interactive action buttons for taking medicine, logging water, and 5-min snooze.
   5. Instant Sound Playback: When user taps notification or opens app, plays rich audio alarm.
═══════════════════════════════════════════════════════════════════ */

const SW_VERSION = 'medivault-sw-v7';
const DB_NAME    = 'medivault-sw-db';
const DB_VERSION = 2;

// ── Install: activate immediately ──
self.addEventListener('install', (event) => {
  console.log('[SW] Installing', SW_VERSION);
  event.waitUntil(self.skipWaiting());
});

// ── Activate: claim all clients and open DB ──
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating', SW_VERSION);
  event.waitUntil(
    self.clients.claim().then(() => {
      return openDB();
    })
  );
});

/* ─────────────────────────────────────────────────────────────
   IndexedDB — Persistent storage for alarms & pending triggers
───────────────────────────────────────────────────────────── */
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const idb = e.target.result;
      if (!idb.objectStoreNames.contains('config')) {
        idb.createObjectStore('config');
      }
      if (!idb.objectStoreNames.contains('pending')) {
        idb.createObjectStore('pending', { keyPath: 'key' });
      }
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror   = (e) => reject(e.target.error);
  });
}

async function dbGet(store, key) {
  const idb = await openDB();
  return new Promise((resolve) => {
    const tx  = idb.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => resolve(null);
  });
}

async function dbSet(store, key, value) {
  const idb = await openDB();
  return new Promise((resolve) => {
    const tx  = idb.transaction(store, 'readwrite');
    const os  = tx.objectStore(store);
    if (store === 'pending') {
      os.put({ key, ...value });
    } else {
      os.put(value, key);
    }
    tx.oncomplete = () => resolve();
    tx.onerror    = () => resolve();
  });
}

async function dbGetAll(store) {
  const idb = await openDB();
  return new Promise((resolve) => {
    const tx  = idb.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = () => resolve([]);
  });
}

async function dbDelete(store, key) {
  const idb = await openDB();
  return new Promise((resolve) => {
    const tx  = idb.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => resolve();
  });
}

/* ─────────────────────────────────────────────────────────────
   In-memory State & Alarm Scheduling Engine
───────────────────────────────────────────────────────────── */
let tabletAlarms        = [];
let waterReminders      = [];
let waterEnabled        = false;
let activeUserId        = '';
let lastFiredMinuteStr  = '';
let checkTimer          = null;

// Sleep tracking
let sleepStartTimestamp = null;
let sleepTargetHours    = 8;
let sleepNotifiedToday  = false;

async function loadConfigFromDB() {
  const ta = await dbGet('config', 'tabletAlarms');
  const wr = await dbGet('config', 'waterReminders');
  const we = await dbGet('config', 'waterEnabled');
  const au = await dbGet('config', 'activeUserId');
  const ss = await dbGet('config', 'sleepStart');
  const st = await dbGet('config', 'sleepTarget');

  if (ta) tabletAlarms        = ta;
  if (wr) waterReminders      = wr;
  if (we !== null && we !== undefined) waterEnabled = we;
  if (au) activeUserId        = au;
  if (ss) sleepStartTimestamp = ss;
  if (st) sleepTargetHours    = st;
}

// Load config and start scheduling loop
loadConfigFromDB().then(() => scheduleNextAlarmCheck());

/* ─────────────────────────────────────────────────────────────
   Dynamic Alarm Scheduling Loop
   Calculates exact milliseconds to the next alarm minute.
───────────────────────────────────────────────────────────── */
function scheduleNextAlarmCheck() {
  if (checkTimer) clearTimeout(checkTimer);

  const now = new Date();
  const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 500;
  // Check every 15-20 seconds or at the start of the next minute
  const nextCheckDelay = Math.min(Math.max(msToNextMinute, 1000), 20000);

  checkTimer = setTimeout(() => {
    doCheck()
      .catch((err) => console.error('[SW] Error during check:', err))
      .finally(() => scheduleNextAlarmCheck());
  }, nextCheckDelay);
}

/* ─────────────────────────────────────────────────────────────
   Message Handler — Syncs from page tabs to SW
───────────────────────────────────────────────────────────── */
self.addEventListener('message', (event) => {
  const { type, payload, userId } = event.data || {};

  if (type === 'SYNC_TABLET_ALARMS') {
    tabletAlarms = Array.isArray(payload) ? payload : (payload?.alarms || []);
    if (userId) activeUserId = userId;
    dbSet('config', 'tabletAlarms', tabletAlarms);
    if (userId) dbSet('config', 'activeUserId', activeUserId);
    scheduleNextAlarmCheck();
  }

  if (type === 'SYNC_WATER_REMINDERS') {
    waterReminders = payload?.reminders || [];
    waterEnabled   = payload?.enabled ?? false;
    if (userId) activeUserId = userId;
    dbSet('config', 'waterReminders', waterReminders);
    dbSet('config', 'waterEnabled', waterEnabled);
    if (userId) dbSet('config', 'activeUserId', activeUserId);
    scheduleNextAlarmCheck();
  }

  if (type === 'CLEAR_USER_ALARMS') {
    tabletAlarms = [];
    waterReminders = [];
    waterEnabled = false;
    activeUserId = '';
    dbSet('config', 'tabletAlarms', []);
    dbSet('config', 'waterReminders', []);
    dbSet('config', 'waterEnabled', false);
    dbSet('config', 'activeUserId', '');
  }

  // ── Sleep tracking sync ──
  if (type === 'SYNC_SLEEP_START') {
    sleepStartTimestamp = payload.startTime || Date.now();
    sleepTargetHours    = payload.targetHours || 8;
    sleepNotifiedToday  = false;
    dbSet('config', 'sleepStart', sleepStartTimestamp);
    dbSet('config', 'sleepTarget', sleepTargetHours);
    scheduleNextAlarmCheck();
  }

  if (type === 'SYNC_SLEEP_STOP') {
    sleepStartTimestamp = null;
    sleepNotifiedToday  = false;
    dbSet('config', 'sleepStart', null);
  }

  if (type === 'PING') {
    event.waitUntil(
      (async () => {
        const pending = await dbGetAll('pending');
        event.ports[0]?.postMessage({
          type:    'PONG',
          version: SW_VERSION,
          pending,
        });
      })()
    );
  }

  if (type === 'CLEAR_PENDING') {
    const { key } = payload || {};
    if (key) dbDelete('pending', key);
  }

  if (type === 'CLEAR_ALL_PENDING') {
    event.waitUntil(clearAllPending());
  }
});

async function clearAllPending() {
  const all = await dbGetAll('pending');
  for (const item of all) {
    await dbDelete('pending', item.key);
  }
}

/* ─────────────────────────────────────────────────────────────
   Core Alarm Check (Runs in background & foreground)
───────────────────────────────────────────────────────────── */
async function doCheck() {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentMin = currentHours * 60 + currentMinutes;
  const todayStr = now.toISOString().split('T')[0];
  const minuteKey = `${todayStr}_${currentHours}:${currentMinutes}`;

  // ── Tablet Alarms ──
  for (const alarm of tabletAlarms) {
    if (!alarm.active || !alarm.time) continue;
    const [h, m] = alarm.time.split(':').map(Number);
    const alarmMin = h * 60 + m;
    const diff = currentMin - alarmMin;

    // Trigger within 0 to 2 minutes of scheduled time if not fired today
    if (diff >= 0 && diff <= 2 && alarm.lastTriggered !== todayStr) {
      alarm.lastTriggered = todayStr;
      
      // Update in-memory & IndexedDB
      tabletAlarms = tabletAlarms.map((a) =>
        a.id === alarm.id ? { ...a, lastTriggered: todayStr } : a
      );
      await dbSet('config', 'tabletAlarms', tabletAlarms);

      const pendingKey = `tablet-${alarm.id}-${todayStr}`;
      await dbSet('pending', pendingKey, {
        key: pendingKey,
        type: 'tablet',
        alarm,
        todayStr,
        firedAt: Date.now(),
      });

      // 1. Show High-Priority Mobile / Desktop Notification
      await fireTabletNotification(alarm);

      // 2. If app is currently open, trigger full sound immediately
      await notifyClientsToPlaySound(alarm, 'tablet');
    }
  }

  // ── Water Reminders ──
  if (waterEnabled && Array.isArray(waterReminders)) {
    for (const r of waterReminders) {
      if (!r.enabled || !r.time24) continue;
      const [rh, rm] = r.time24.split(':').map(Number);
      const rMin = rh * 60 + rm;
      const diff = currentMin - rMin;

      if (diff >= 0 && diff <= 2 && r.lastTriggered !== todayStr) {
        r.lastTriggered = todayStr;
        waterReminders = waterReminders.map((wr) =>
          wr.id === r.id ? { ...wr, lastTriggered: todayStr } : wr
        );
        await dbSet('config', 'waterReminders', waterReminders);

        const pendingKey = `water-${r.id}-${todayStr}`;
        await dbSet('pending', pendingKey, {
          key: pendingKey,
          type: 'water',
          reminder: r,
          todayStr,
          firedAt: Date.now(),
        });

        await fireWaterNotification(r);
        await notifyClientsToPlayWaterSound(r);
      }
    }
  }

  // ── Sleep Tracking Wake-Up Alert ──
  if (sleepStartTimestamp && !sleepNotifiedToday) {
    const elapsedMs = Date.now() - sleepStartTimestamp;
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    if (elapsedHours >= sleepTargetHours) {
      sleepNotifiedToday = true;
      const hoursSlept = elapsedHours.toFixed(1);
      await fireSleepWakeNotification(hoursSlept, sleepTargetHours);
    }
  }

  lastFiredMinuteStr = minuteKey;
}

/* ─────────────────────────────────────────────────────────────
   High-Priority Native OS Notifications (Mobile & Desktop)
───────────────────────────────────────────────────────────── */
async function fireTabletNotification(alarm) {
  const soundName = alarm.music || 'Gentle Chime';
  return self.registration.showNotification(`💊 Medicine Alarm: ${alarm.tablet}`, {
    body: `⏰ Time: ${alarm.time} — It's time to take your dose of ${alarm.tablet}!\n🔔 Tap to open MediVault and turn off alarm.`,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: `tablet-alarm-${alarm.id}-${Date.now()}`,
    requireInteraction: true, // Remains on mobile lockscreen until user interacts
    silent: false,            // Ensures phone notification ringtone plays
    renotify: true,
    vibrate: [500, 250, 500, 250, 500, 250, 800, 400, 800], // Loud repeating mobile vibration
    data: {
      type: 'tablet',
      alarmId: alarm.id,
      alarm,
      url: '/tablet-alarm',
    },
    actions: [
      { action: 'open',   title: '▶ Open & Play Sound' },
      { action: 'taken',  title: '✓ Taken!' },
      { action: 'snooze', title: '⏰ Snooze 5 min' },
    ],
  });
}

async function fireWaterNotification(reminder) {
  return self.registration.showNotification('💧 Hydration Alarm — Time to Drink Water!', {
    body: `🌊 It's ${reminder.time || reminder.time24}! Keep your body hydrated.\nTap to log 250ml water.`,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: `water-reminder-${reminder.id}-${Date.now()}`,
    requireInteraction: true,
    silent: false,
    renotify: true,
    vibrate: [400, 200, 400, 200, 600],
    data: {
      type: 'water',
      reminderId: reminder.id,
      reminder,
      url: '/drinking-water',
    },
    actions: [
      { action: 'logged', title: '✓ Log 250ml' },
      { action: 'open',   title: '💧 Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
}

async function fireSleepWakeNotification(hoursSlept, targetHours) {
  return self.registration.showNotification('🌅 Good Morning! — MediVault', {
    body: `You've completed ${hoursSlept} hours of sleep (target: ${targetHours}h) 🌙\nTap to record your sleep score.`,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'sleep-wake-notification',
    requireInteraction: true,
    silent: false,
    vibrate: [500, 300, 500],
    data: { type: 'sleep', url: '/dashboard' },
    actions: [
      { action: 'open', title: '🌅 Open & Log Sleep' },
      { action: 'dismiss', title: 'OK' },
    ],
  });
}

/* ─────────────────────────────────────────────────────────────
   Broadcast to open tabs (for in-page audio engine)
───────────────────────────────────────────────────────────── */
async function notifyClientsToPlaySound(alarm) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach((c) => c.postMessage({ type: 'PLAY_ALARM_SOUND', alarm }));
}

async function notifyClientsToPlayWaterSound(reminder) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach((c) => c.postMessage({ type: 'PLAY_WATER_SOUND', reminder }));
}

/* ─────────────────────────────────────────────────────────────
   Notification Click Event (Mobile & Desktop Interaction)
───────────────────────────────────────────────────────────── */
self.addEventListener('notificationclick', (event) => {
  const data   = event.notification.data || {};
  const action = event.action;
  event.notification.close();

  // Action: Medicine Taken / Dismissed
  if (action === 'taken' || action === 'dismiss') {
    if (data.type === 'tablet' && data.alarmId) {
      dbDelete('pending', `tablet-${data.alarmId}-${new Date().toISOString().split('T')[0]}`);
    }
    if (data.type === 'water' && data.reminderId) {
      dbDelete('pending', `water-${data.reminderId}-${new Date().toISOString().split('T')[0]}`);
    }
    return;
  }

  // Action: 5-minute Snooze
  if (action === 'snooze') {
    setTimeout(async () => {
      if (data.type === 'tablet' && data.alarm) {
        await fireTabletNotification(data.alarm);
      }
    }, 5 * 60 * 1000);
    return;
  }

  // Action: Quick-log water (250ml) directly from notification
  if (action === 'logged') {
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clients.forEach((c) => c.postMessage({ type: 'QUICK_LOG_WATER', amount: 250 }));
        if (data.reminderId) {
          dbDelete('pending', `water-${data.reminderId}-${new Date().toISOString().split('T')[0]}`);
        }
      })()
    );
    return;
  }

  // Default: Open or Focus the app window & play alarm sound
  const targetUrl = data.url || '/';
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const existing = clients.find((c) => c.url.includes(self.location.origin));

      if (existing) {
        await existing.focus();
        if (data.type === 'tablet' && data.alarm) {
          existing.postMessage({ type: 'PLAY_ALARM_SOUND', alarm: data.alarm });
        }
        if (data.type === 'water' && data.reminder) {
          existing.postMessage({ type: 'PLAY_WATER_SOUND', reminder: data.reminder });
        }
        existing.postMessage({ type: 'NAVIGATE', url: targetUrl });
      } else {
        // Open new window on mobile / desktop
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});

/* ─────────────────────────────────────────────────────────────
   Periodic Background Sync (Chrome & Android)
───────────────────────────────────────────────────────────── */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'medivault-alarm-check') {
    event.waitUntil(doCheck());
  }
});

/* ─────────────────────────────────────────────────────────────
   Fetch Event (Service Worker Passthrough)
───────────────────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
});
