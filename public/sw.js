/* ═══════════════════════════════════════════════════════════════════
   MediVault Service Worker v4 — Background Notifications + Sound
   
   HOW SOUND WORKS:
   - When tab is OPEN: AlarmManager plays the full custom sound directly.
   - When tab is CLOSED (browser open):
       1. SW fires OS notification (browser plays system notification sound)
       2. SW stores the alarm in IndexedDB as "pending"
       3. When user clicks notification → app tab opens → plays full sound
       4. When app tab opens for ANY reason → it checks pending alarms → plays sound
   
   NOTE: Browsers cannot play audio in a Service Worker context.
         Sound always plays in the page (tab), which is the best possible.
═══════════════════════════════════════════════════════════════════ */

const SW_VERSION = 'medivault-sw-v5';
const DB_NAME    = 'medivault-sw-db';
const DB_VERSION = 1;

// ── Install: activate immediately ──
self.addEventListener('install', (event) => {
  console.log('[SW] Installing', SW_VERSION);
  event.waitUntil(self.skipWaiting());
});

// ── Activate: take control immediately ──
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating', SW_VERSION);
  event.waitUntil(
    self.clients.claim().then(() => {
      openDB(); // ensure DB is ready
    })
  );
});

/* ─────────────────────────────────────────────────────────────
   IndexedDB — stores pending alarms & alarm config
   (survives SW restarts; unlike in-memory variables)
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
   In-memory alarm state (loaded from IndexedDB on SW start)
───────────────────────────────────────────────────────────── */
let tabletAlarms       = [];
let waterReminders     = [];
let waterEnabled       = false;
let lastFiredMinute    = -1;
let keepAliveTimer     = null;

// Sleep tracking
let sleepStartTimestamp = null;   // ms epoch when sleep started
let sleepTargetHours   = 8;       // default; overridden by app
let sleepNotifiedToday = false;   // only fire wake-up notification once per session

// Load alarm config from IndexedDB when SW starts
async function loadConfigFromDB() {
  const ta = await dbGet('config', 'tabletAlarms');
  const wr = await dbGet('config', 'waterReminders');
  const we = await dbGet('config', 'waterEnabled');
  const ss = await dbGet('config', 'sleepStart');
  const st = await dbGet('config', 'sleepTarget');
  if (ta) tabletAlarms        = ta;
  if (wr) waterReminders      = wr;
  if (we !== null && we !== undefined) waterEnabled = we;
  if (ss) sleepStartTimestamp = ss;
  if (st) sleepTargetHours    = st;
}

// ── Load config at SW start ──
loadConfigFromDB().then(() => startKeepAlive());

/* ─────────────────────────────────────────────────────────────
   Keep-Alive Loop — uses recursive setTimeout + waitUntil
   This keeps the SW alive by constantly extending its lifetime.
───────────────────────────────────────────────────────────── */
function startKeepAlive() {
  if (keepAliveTimer) return;
  scheduleCheck();
}

function scheduleCheck() {
  keepAliveTimer = setTimeout(() => {
    // Use a fake event to extend SW lifetime during check
    const checkPromise = doCheck();
    // Schedule next check regardless
    keepAliveTimer = null;
    scheduleCheck();
    return checkPromise;
  }, 25000); // every 25 seconds
}

/* ─────────────────────────────────────────────────────────────
   Message handler — syncs data from open app tab to SW
───────────────────────────────────────────────────────────── */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  if (type === 'SYNC_TABLET_ALARMS') {
    tabletAlarms = payload || [];
    dbSet('config', 'tabletAlarms', tabletAlarms);
    startKeepAlive();
  }

  if (type === 'SYNC_WATER_REMINDERS') {
    waterReminders = payload.reminders || [];
    waterEnabled   = payload.enabled   || false;
    dbSet('config', 'waterReminders', waterReminders);
    dbSet('config', 'waterEnabled', waterEnabled);
    startKeepAlive();
  }

  // ── Sleep tracking sync ──
  if (type === 'SYNC_SLEEP_START') {
    // App started sleep mode — store start time + target in IndexedDB
    sleepStartTimestamp = payload.startTime || Date.now();
    sleepTargetHours    = payload.targetHours || 8;
    sleepNotifiedToday  = false;
    dbSet('config', 'sleepStart', sleepStartTimestamp);
    dbSet('config', 'sleepTarget', sleepTargetHours);
    startKeepAlive();
  }

  if (type === 'SYNC_SLEEP_STOP') {
    // App stopped sleep mode (user woke up) — clear stored sleep data
    sleepStartTimestamp = null;
    sleepNotifiedToday  = false;
    dbSet('config', 'sleepStart', null);
  }

  if (type === 'PING') {
    // App tab is open and pinging us — reply with PONG and any pending alarms
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
    // App has handled a pending alarm — clear it
    const { key } = payload || {};
    if (key) dbDelete('pending', key);
  }

  if (type === 'CLEAR_ALL_PENDING') {
    // App handled all pending alarms
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
   Core alarm checking
───────────────────────────────────────────────────────────── */
async function doCheck() {
  const now        = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const todayStr   = now.toISOString().split('T')[0];

  // Avoid double-firing in same minute
  if (currentMin === lastFiredMinute) return;
  lastFiredMinute = currentMin;

  // ── Tablet alarms ──
  for (const alarm of tabletAlarms) {
    if (!alarm.active) continue;
    const [h, m]    = alarm.time.split(':').map(Number);
    const alarmMin  = h * 60 + m;
    const diff      = currentMin - alarmMin;

    if (diff >= 0 && diff <= 2 && alarm.lastTriggered !== todayStr) {
      // Mark as fired today in memory + DB
      tabletAlarms = tabletAlarms.map((a) =>
        a.id === alarm.id ? { ...a, lastTriggered: todayStr } : a
      );
      await dbSet('config', 'tabletAlarms', tabletAlarms);

      // Store as pending so app can play sound when it opens
      const pendingKey = `tablet-${alarm.id}-${todayStr}`;
      await dbSet('pending', pendingKey, {
        key:      pendingKey,
        type:     'tablet',
        alarm,
        todayStr,
        firedAt:  Date.now(),
      });

      // Show OS notification
      await fireTabletNotification(alarm);

      // If app is already open, tell it to play sound immediately
      await notifyClientsToPlaySound(alarm, 'tablet');
    }
  }

  // ── Water reminders ──
  if (waterEnabled) {
    for (const r of waterReminders) {
      if (!r.enabled) continue;
      const [rh, rm] = r.time24.split(':').map(Number);
      const rMin     = rh * 60 + rm;
      const diff     = currentMin - rMin;

      if (diff >= 0 && diff <= 2 && r.lastTriggered !== todayStr) {
        waterReminders = waterReminders.map((wr) =>
          wr.id === r.id ? { ...wr, lastTriggered: todayStr } : wr
        );
        await dbSet('config', 'waterReminders', waterReminders);

        const pendingKey = `water-${r.id}-${todayStr}`;
        await dbSet('pending', pendingKey, {
          key:     pendingKey,
          type:    'water',
          reminder: r,
          todayStr,
          firedAt: Date.now(),
        });

        await fireWaterNotification(r);
        await notifyClientsToPlayWaterSound(r);
      }
    }
  }

  // ── Sleep tracking — fire wake-up notification when target hours reached ──
  if (sleepStartTimestamp && !sleepNotifiedToday) {
    const elapsedMs    = Date.now() - sleepStartTimestamp;
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    if (elapsedHours >= sleepTargetHours) {
      sleepNotifiedToday = true; // fire only once
      const hoursSlept = elapsedHours.toFixed(1);
      await fireSleepWakeNotification(hoursSlept, sleepTargetHours);
    }
  }
}

/* ─────────────────────────────────────────────────────────────
   OS Notifications
───────────────────────────────────────────────────────────── */
async function fireTabletNotification(alarm) {
  return self.registration.showNotification('💊 Medicine Reminder!', {
    body:             `${alarm.time} — Time to take: ${alarm.tablet}\n🔔 Tap to open app & hear alarm sound`,
    icon:             '/favicon.svg',
    badge:            '/favicon.svg',
    tag:              `tablet-alarm-${alarm.id}`,
    requireInteraction: true,
    silent:           false,        // Let OS play its notification sound
    vibrate:          [300, 100, 300, 100, 300, 100, 600],
    data:             { type: 'tablet', alarmId: alarm.id, alarm, url: '/tablet-alarm' },
    actions: [
      { action: 'open',   title: '▶ Open & Play Sound' },
      { action: 'snooze', title: '⏰ Snooze 5 min' },
      { action: 'taken',  title: '✓ Taken!' },
    ],
  });
}

async function fireWaterNotification(reminder) {
  return self.registration.showNotification('💧 Hydration Reminder — MediVault', {
    body:             `It's ${reminder.time}! Time to drink water 🌊\nTap to open app & hear reminder`,
    icon:             '/favicon.svg',
    badge:            '/favicon.svg',
    tag:              `water-reminder-${reminder.id}`,
    requireInteraction: false,
    silent:           false,
    vibrate:          [200, 100, 200],
    data:             { type: 'water', reminderId: reminder.id, reminder, url: '/drinking-water' },
    actions: [
      { action: 'open',   title: '💧 Open & Play Sound' },
      { action: 'logged', title: '✓ Log 250ml' },
      { action: 'dismiss', title: 'OK' },
    ],
  });
}

async function fireSleepWakeNotification(hoursSlept, targetHours) {
  return self.registration.showNotification('🌅 Good Morning! — MediVault', {
    body:             `You've slept for ${hoursSlept} hours (target: ${targetHours}h) 🌙\nTap to open MediVault & log your sleep.`,
    icon:             '/favicon.svg',
    badge:            '/favicon.svg',
    tag:              'sleep-wake-notification',
    requireInteraction: true,
    silent:           false,
    vibrate:          [500, 200, 500],
    data:             { type: 'sleep', url: '/dashboard' },
    actions: [
      { action: 'open',   title: '🌅 Open & Log Sleep' },
      { action: 'dismiss', title: '✓ OK, continue sleeping' },
    ],
  });
}

/* ─────────────────────────────────────────────────────────────
   Tell open app windows to play alarm sound immediately
   (if tab is open, this triggers the full sound+modal)
───────────────────────────────────────────────────────────── */
async function notifyClientsToPlaySound(alarm, type) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((c) => c.postMessage({ type: 'PLAY_ALARM_SOUND', alarm }));
}

async function notifyClientsToPlayWaterSound(reminder) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((c) => c.postMessage({ type: 'PLAY_WATER_SOUND', reminder }));
}

/* ─────────────────────────────────────────────────────────────
   Notification click — open app & trigger sound
───────────────────────────────────────────────────────────── */
self.addEventListener('notificationclick', (event) => {
  const data    = event.notification.data || {};
  const action  = event.action;
  event.notification.close();

  // "Taken" or "dismiss" — just close (for tablet & water)
  // For sleep, "dismiss" means "continue sleeping" — also just close
  if (action === 'taken' || action === 'dismiss') {
    if (data.type === 'tablet' && data.alarmId) {
      dbDelete('pending', `tablet-${data.alarmId}-${new Date().toISOString().split('T')[0]}`);
    }
    if (data.type === 'water' && data.reminderId) {
      dbDelete('pending', `water-${data.reminderId}-${new Date().toISOString().split('T')[0]}`);
    }
    // For sleep dismiss: reset so a new notification can fire after more sleeping
    if (data.type === 'sleep') {
      sleepNotifiedToday = false;
      // Add 1.5 hours to target so next notification fires after more rest
      sleepTargetHours += 1.5;
    }
    return;
  }

  // "Snooze" — re-fire in 5 minutes
  if (action === 'snooze') {
    setTimeout(async () => {
      if (data.type === 'tablet' && data.alarm) {
        await fireTabletNotification(data.alarm);
      }
    }, 5 * 60 * 1000);
    return;
  }

  // "Log water" action from notification
  if (action === 'logged') {
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach((c) => c.postMessage({ type: 'QUICK_LOG_WATER', amount: 250 }));
        if (data.reminderId) {
          dbDelete('pending', `water-${data.reminderId}-${new Date().toISOString().split('T')[0]}`);
        }
      })()
    );
    return;
  }

  // Default: "open" action OR click anywhere → open/focus app + play sound
  const targetUrl = data.url || '/';
  event.waitUntil(
    (async () => {
      const clients   = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const existing  = clients.find((c) => c.url.includes(self.location.origin));

      if (existing) {
        await existing.focus();
        // Tell the open tab to play the alarm sound and navigate
        if (data.type === 'tablet' && data.alarm) {
          existing.postMessage({ type: 'PLAY_ALARM_SOUND', alarm: data.alarm });
        }
        if (data.type === 'water' && data.reminder) {
          existing.postMessage({ type: 'PLAY_WATER_SOUND', reminder: data.reminder });
        }
        existing.postMessage({ type: 'NAVIGATE', url: targetUrl });
      } else {
        // Open a new tab — the pending alarms in IndexedDB will trigger sound on load
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});

/* ─────────────────────────────────────────────────────────────
   Periodic Background Sync (Chrome) — wakes SW periodically
───────────────────────────────────────────────────────────── */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'medivault-alarm-check') {
    event.waitUntil(doCheck());
  }
});

/* ─────────────────────────────────────────────────────────────
   Fetch event — minimal handler to activate SW control faster
───────────────────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  // Pass through all requests — we just need this for SW to control pages
  event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
});
