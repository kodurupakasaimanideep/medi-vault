import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BellRing, Pill, Music2 } from 'lucide-react';
import { syncTabletAlarmsToSW, registerSoundCallback, dismissAlarmInSW } from '../services/swManager';
import { dismissNativeTabletAlarm, isNativeApp } from '../services/nativeNotificationService';
import { useAuth } from '../contexts/AuthContext';

// ══════════════════════════════════════════════════════════════
//  SHARED AUDIO CONTEXT & USER GESTURE UNLOCKER
//  Guarantees audio can play automatically on modern browsers
// ══════════════════════════════════════════════════════════════
let _sharedAudioCtx = null;

function getSharedAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!_sharedAudioCtx || _sharedAudioCtx.state === 'closed') {
    _sharedAudioCtx = new AudioCtx();
  }
  if (_sharedAudioCtx && _sharedAudioCtx.state === 'suspended') {
    _sharedAudioCtx.resume().catch(() => {});
  }
  return _sharedAudioCtx;
}

// Global user gesture unlocker: unlocks AudioContext on first tap/click anywhere
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getSharedAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        // Play 1ms silent buffer to satisfy mobile / Safari / Chrome autoplay policy
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch (_) {}
    window.removeEventListener('click', unlockAudio, true);
    window.removeEventListener('touchstart', unlockAudio, true);
    window.removeEventListener('keydown', unlockAudio, true);
  };
  window.addEventListener('click', unlockAudio, true);
  window.addEventListener('touchstart', unlockAudio, true);
  window.addEventListener('keydown', unlockAudio, true);
}

// Synthesize a fallback WAV chime blob for HTML5 <audio> tag
function createFallbackChimeUrl() {
  try {
    const sampleRate = 22050;
    const durationSec = 2.8;
    const numSamples = Math.floor(sampleRate * durationSec);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      frequencies.forEach((freq, idx) => {
        const noteStart = idx * 0.22;
        if (t >= noteStart) {
          const noteT = t - noteStart;
          const env = Math.max(0, Math.exp(-noteT * 2.0));
          sample += Math.sin(2 * Math.PI * freq * noteT) * env * 0.4;
        }
      });
      const s = Math.max(-1, Math.min(1, sample));
      view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (_) {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════
//  PEACEFUL SOUND ENGINE — 7 Gentle, Soothing Alarm Sounds
//  All synthesized in-browser via Web Audio API (no network).
// ══════════════════════════════════════════════════════════════
class PeacefulSoundEngine {
  constructor() {
    this.ctx = null;
    this.nodes = [];
    this.running = false;
    this.intervals = [];
    this.masterGain = null;
  }

  _ctx() {
    this.ctx = getSharedAudioContext();
    if (this.ctx) {
      if (!this.masterGain || this.masterGain.context !== this.ctx) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }
    return this.ctx;
  }

  _softTone(freq, startTime, duration, vol = 0.7, type = 'sine') {
    if (!this.running) return;
    const ctx = this._ctx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + duration * 0.12);
    gain.gain.setValueAtTime(vol, startTime + duration * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    this.nodes.push(osc, gain);
  }

  // 🎵 1. GENTLE CHIME — soft bell trio, peaceful and clear
  playGentleChime(vol = 1.0) {
    const ctx = this._ctx();
    if (!ctx) return;
    this.running = true;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)

    const play = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      notes.forEach((freq, i) => {
        this._softTone(freq, now + i * 0.22, 2.2, vol * 0.75);
      });
    };
    play();
    const id = setInterval(play, 3200);
    this.intervals.push(id);
  }

  // 🌅 2. MORNING BELLS — ascending gentle bell sequence, like sunrise
  playMorningBells(vol = 1.0) {
    const ctx = this._ctx();
    if (!ctx) return;
    this.running = true;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4,E4,G4,C5,E5

    const play = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      notes.forEach((freq, i) => {
        this._softTone(freq, now + i * 0.32, 2.0, vol * 0.7);
      });
    };
    play();
    const id = setInterval(play, 3800);
    this.intervals.push(id);
  }

  // 🎶 3. SOFT HARP — cascading harp-like arpeggio, dreamy
  playSoftHarp(vol = 1.0) {
    const ctx = this._ctx();
    if (!ctx) return;
    this.running = true;
    const notes = [329.63, 415.30, 523.25, 659.25, 830.61]; // E4,Ab4,C5,E5,Ab5

    const play = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      const seq = [...notes, ...notes.slice().reverse()];
      seq.forEach((freq, i) => {
        this._softTone(freq, now + i * 0.18, 1.5, vol * 0.65);
      });
    };
    play();
    const id = setInterval(play, 3600);
    this.intervals.push(id);
  }

  // 🧘 4. MEDITATION BOWL — deep Tibetan singing bowl resonance
  playMeditationBowl(vol = 1.0) {
    const ctx = this._ctx();
    if (!ctx) return;
    this.running = true;

    const play = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      [[220, 0], [330, 0.05], [440, 0.08]].forEach(([freq, offset]) => {
        this._softTone(freq, now + offset, 4.0, vol * (offset === 0 ? 0.8 : 0.35));
      });
    };
    play();
    const id = setInterval(play, 4800);
    this.intervals.push(id);
  }

  // 🌊 5. OCEAN LULLABY — soothing low tones like distant waves
  playOceanLullaby(vol = 1.0) {
    const ctx = this._ctx();
    if (!ctx) return;
    this.running = true;

    const play = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.linearRampToValueAtTime(180, now + 2.0);
      osc.frequency.linearRampToValueAtTime(130, now + 4.0);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol * 0.6, now + 1.0);
      gain.gain.linearRampToValueAtTime(vol * 0.6, now + 3.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4.2);
      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);
      osc.start(now);
      osc.stop(now + 4.3);
      this.nodes.push(osc, gain);

      this._softTone(392.00, now + 0.5, 3.0, vol * 0.45);
      this._softTone(523.25, now + 1.5, 2.5, vol * 0.4);
    };
    play();
    const id = setInterval(play, 5000);
    this.intervals.push(id);
  }

  // 🌸 6. WIND CHIMES — random light chime notes, natural & airy
  playWindChimes(vol = 1.0) {
    const ctx = this._ctx();
    if (!ctx) return;
    this.running = true;
    const chimePitches = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77];

    const play = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      const count = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const freq = chimePitches[Math.floor(Math.random() * chimePitches.length)];
        const offset = Math.random() * 1.2;
        this._softTone(freq, now + offset, 1.8, vol * 0.65);
      }
    };
    play();
    const id = setInterval(play, 2800);
    this.intervals.push(id);
  }

  // 🌙 7. DREAMSCAPE — slow, dreamy chord layers, deeply relaxing
  playDreamscape(vol = 1.0) {
    const ctx = this._ctx();
    if (!ctx) return;
    this.running = true;
    const layers = [
      [130.81, 3.5],
      [196.00, 3.0],
      [261.63, 2.8],
      [329.63, 2.5],
      [392.00, 2.2],
      [523.25, 2.0],
    ];

    const play = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      layers.forEach(([freq, decay], i) => {
        this._softTone(freq, now + i * 0.3, decay + 1.5, vol * (i < 2 ? 0.6 : 0.5));
      });
    };
    play();
    const id = setInterval(play, 5200);
    this.intervals.push(id);
  }

  play(soundType, vol = 1.0) {
    switch (soundType) {
      case 'Morning Bells':   this.playMorningBells(vol);   break;
      case 'Soft Harp':       this.playSoftHarp(vol);       break;
      case 'Meditation Bowl': this.playMeditationBowl(vol); break;
      case 'Ocean Lullaby':   this.playOceanLullaby(vol);   break;
      case 'Wind Chimes':     this.playWindChimes(vol);     break;
      case 'Dreamscape':      this.playDreamscape(vol);     break;
      case 'Gentle Chime':
      default:                this.playGentleChime(vol);    break;
    }
  }

  stop() {
    this.running = false;
    this.intervals.forEach(id => clearInterval(id));
    this.intervals = [];

    const ctx = this._ctx();
    if (ctx) {
      try {
        const now = ctx.currentTime;
        if (this.masterGain) {
          this.masterGain.gain.cancelScheduledValues(now);
          this.masterGain.gain.setValueAtTime(0, now);
          try { this.masterGain.disconnect(); } catch (_) {}
          this.masterGain = null;
        }
      } catch (_) {}
    }

    this.nodes.forEach(n => {
      try { if (n.stop) n.stop(0); } catch (_) {}
      try {
        if (n.gain && ctx) {
          n.gain.cancelScheduledValues(ctx.currentTime);
          n.gain.setValueAtTime(0, ctx.currentTime);
        }
      } catch (_) {}
      try { n.disconnect(); } catch (_) {}
    });
    this.nodes = [];

    // HARD CUT: Suspend the shared audio context so sound ceases immediately
    if (ctx && ctx.state === 'running') {
      try {
        ctx.suspend().catch(() => {});
      } catch (_) {}
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  SOUND METADATA (used by both AlarmManager + TabletAlarm)
// ══════════════════════════════════════════════════════════════
export const ALARM_SOUNDS = [
  { value: 'Gentle Chime',    label: '🎵 Gentle Chime',    desc: 'Soft C-E-G bell trio' },
  { value: 'Morning Bells',   label: '🌅 Morning Bells',   desc: 'Ascending pentatonic bells' },
  { value: 'Soft Harp',       label: '🎶 Soft Harp',       desc: 'Cascading harp arpeggio' },
  { value: 'Meditation Bowl', label: '🧘 Meditation Bowl', desc: 'Deep Tibetan bowl resonance' },
  { value: 'Ocean Lullaby',   label: '🌊 Ocean Lullaby',   desc: 'Gentle wave-like tones' },
  { value: 'Wind Chimes',     label: '🌸 Wind Chimes',     desc: 'Natural airy chime notes' },
  { value: 'Dreamscape',      label: '🌙 Dreamscape',      desc: 'Deep relaxing chord layers' },
];

// Helper: Get today's local date string YYYY-MM-DD
export function getLocalTodayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Helper: Load all stored alarms regardless of auth key
export function getStoredAlarms(uid = '') {
  const keys = [];
  if (uid && uid !== 'guest') keys.push(`medivault_alarms_${uid}`);
  keys.push('medivault_alarms');
  keys.push('medivault_alarms_guest');

  const alarmMap = new Map();
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((a) => {
            if (a && a.id && !alarmMap.has(a.id)) {
              alarmMap.set(a.id, a);
            }
          });
        }
      }
    } catch (_) {}
  }
  return Array.from(alarmMap.values());
}

// ══════════════════════════════════════════════════════════════
//  ALARM MANAGER COMPONENT
// ══════════════════════════════════════════════════════════════
export default function AlarmManager() {
  const auth = (() => {
    try { return useAuth(); } catch { return {}; }
  })();
  const user = auth?.currentUser;
  const uid = user?.uid || user?.id || '';

  const [activeAlarm, setActiveAlarm] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const activeAlarmRef = useRef(null);
  const soundEngineRef = useRef(null);
  const audioRef = useRef(null);
  const fallbackAudioRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const notificationRef = useRef(null);

  const stopSound = useCallback(() => {
    // 1. Immediately stop peaceful sound engine
    if (soundEngineRef.current) {
      try {
        soundEngineRef.current.stop();
      } catch (_) {}
      soundEngineRef.current = null;
    }

    // 2. Hard suspend shared audio context
    const sharedCtx = getSharedAudioContext();
    if (sharedCtx && sharedCtx.state === 'running') {
      try {
        sharedCtx.suspend().catch(() => {});
      } catch (_) {}
    }

    // 3. Immediately stop custom voice HTML5 Audio
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        audioRef.current.load();
      } catch (_) {}
      audioRef.current = null;
    }

    // 4. Immediately stop fallback chime HTML5 Audio
    if (fallbackAudioRef.current) {
      try {
        fallbackAudioRef.current.pause();
        fallbackAudioRef.current.currentTime = 0;
        fallbackAudioRef.current.src = '';
        fallbackAudioRef.current.load();
      } catch (_) {}
      fallbackAudioRef.current = null;
    }

    // 5. Close window desktop notification
    if (notificationRef.current) {
      try {
        notificationRef.current.close();
      } catch (_) {}
      notificationRef.current = null;
    }

    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    setAudioPlaying(false);
    setAudioBlocked(false);
  }, []);

  const handleDismiss = useCallback(async (e, alarmIdParam) => {
    if (e) {
      try {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
      } catch (_) {}
    }

    const alarmToDismiss = activeAlarmRef.current || activeAlarm || (alarmIdParam ? { id: alarmIdParam } : null);
    const alarmId = alarmToDismiss?.id || alarmIdParam;

    // 1. Immediately silence all audio and close in-app modal
    stopSound();
    activeAlarmRef.current = null;
    setActiveAlarm(null);

    const now = new Date();
    const todayStr = getLocalTodayStr(now);
    const curH = String(now.getHours()).padStart(2, '0');
    const curM = String(now.getMinutes()).padStart(2, '0');

    // 2. Persist state in localStorage so periodic check won't re-fire at this minute
    try {
      const savedAlarms = getStoredAlarms(uid);
      const updatedList = savedAlarms.map((a) => {
        if (!alarmId || a.id === alarmId) {
          const aTime = a.time ? a.time.split(':').map((x) => String(Number(x)).padStart(2, '0')).join(':') : `${curH}:${curM}`;
          const triggerKey = `${todayStr}_${aTime}`;
          return { ...a, lastTriggered: todayStr, lastTriggeredKey: triggerKey };
        }
        return a;
      });
      if (uid && uid !== 'guest') localStorage.setItem(`medivault_alarms_${uid}`, JSON.stringify(updatedList));
      localStorage.setItem('medivault_alarms', JSON.stringify(updatedList));
      localStorage.setItem('medivault_alarms_guest', JSON.stringify(updatedList));
      syncTabletAlarmsToSW(updatedList, uid);
      window.dispatchEvent(new CustomEvent('medivault_alarms_updated', { detail: updatedList }));
    } catch (err) {
      console.error('Error saving dismissed alarm state:', err);
    }

    // 3. Close Service Worker notifications directly
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg?.getNotifications) {
          const notifs = await reg.getNotifications();
          notifs.forEach((n) => {
            const d = n.data || {};
            if (
              !alarmId ||
              d.alarmId === alarmId ||
              n.tag?.includes(`tablet-alarm-${alarmId}`) ||
              n.tag?.startsWith('tablet-') ||
              n.title?.includes('Medicine')
            ) {
              n.close();
            }
          });
        }
      } catch (err) {
        console.warn('Error closing notifications from client:', err);
      }
    }

    // 4. Dismiss in Service Worker
    dismissAlarmInSW(alarmId, todayStr);

    // 5. Dismiss Android native notification (Capacitor)
    if (isNativeApp()) {
      dismissNativeTabletAlarm(alarmId);
    }

    // 6. Broadcast STOP_ALARM to other tabs
    try {
      if ('BroadcastChannel' in window) {
        const bus = new BroadcastChannel('medivault_alarm_bus');
        bus.postMessage({ type: 'STOP_ALARM', alarmId });
        bus.close();
      }
    } catch (_) {}

    // 7. Multi-tab synchronization fallback via localStorage
    try {
      localStorage.setItem('medivault_dismiss_alarm_event', JSON.stringify({
        alarmId,
        timestamp: Date.now()
      }));
    } catch (_) {}
  }, [activeAlarm, stopSound, uid]);

  const showNativeNotification = useCallback(async (alarm) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Check permission - request if not yet granted
    let perm = Notification.permission;
    if (perm !== 'granted') {
      try {
        perm = await Notification.requestPermission();
      } catch (_) {}
    }
    if (perm !== 'granted') {
      console.warn('[AlarmManager] Desktop notification permission not granted:', perm);
      return;
    }

    const soundInfo = ALARM_SOUNDS.find((s) => s.value === alarm.music);
    const soundLabel = soundInfo?.label ? soundInfo.label.replace(/^[^a-zA-Z0-9]+/, '').trim() : (alarm.music || 'Gentle Chime');
    const title = '💊 Medicine Reminder!';
    const body = `${alarm.time} — Time to take: ${alarm.tablet}\n♪ 🎵 ${soundLabel}`;
    const tag = `tablet-alarm-${alarm.id}-${Date.now()}`;

    // Options for Service Worker notification (supports actions buttons on desktop & mobile)
    const swOptions = {
      body,
      icon: '/alarm-icon.png',
      badge: '/badge.png',
      tag,
      requireInteraction: true,
      silent: false,
      renotify: true,
      vibrate: [500, 250, 500, 250, 500, 250, 800, 400, 800],
      data: {
        type: 'tablet',
        alarmId: alarm.id,
        alarm,
      },
      actions: [
        { action: 'dismiss', title: '✕ Dismiss Alarm' },
        { action: 'taken',   title: '✓ Taken!' },
      ],
    };

    let swFired = false;
    // 1. Try SW showNotification first
    if ('serviceWorker' in navigator) {
      try {
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((resolve) => setTimeout(() => resolve(null), 1000))
        ]);
        if (reg?.showNotification) {
          await reg.showNotification(title, swOptions);
          swFired = true;
          // Auto-close notification after 60 seconds
          setTimeout(async () => {
            try {
              const notifs = await reg.getNotifications();
              notifs.forEach((n) => {
                const d = n.data || {};
                if (d.alarmId === alarm.id || n.tag === tag || n.tag?.includes(`tablet-alarm-${alarm.id}`)) {
                  n.close();
                }
              });
            } catch (_) {}
          }, 60000);
        }
      } catch (err) {
        console.warn('SW showNotification error, falling back:', err);
      }
    }

    // 2. Fallback to desktop window Notification if SW did not fire (WITHOUT actions to avoid TypeError in Chrome/Firefox)
    if (!swFired) {
      try {
        const windowOptions = {
          body,
          icon: '/alarm-icon.png',
          badge: '/badge.png',
          tag,
          requireInteraction: true,
          silent: false,
          renotify: true,
          data: {
            type: 'tablet',
            alarmId: alarm.id,
            alarm,
          },
        };
        const notif = new Notification(title, windowOptions);
        notificationRef.current = notif;
        setTimeout(() => {
          try { notif.close(); } catch (_) {}
        }, 60000);
        notif.onclick = () => {
          window.focus();
          handleDismiss();
          try { notif.close(); } catch (_) {}
        };
        notif.onclose = () => {
          handleDismiss();
        };
      } catch (err) {
        console.warn('Window Notification error:', err);
      }
    }
  }, [handleDismiss]);

  const startSound = useCallback((alarm, userGesture = false) => {
    // Stop any current sound
    if (soundEngineRef.current) {
      try { soundEngineRef.current.stop(); } catch (_) {}
      soundEngineRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      } catch (_) {}
    }
    if (fallbackAudioRef.current) {
      try {
        fallbackAudioRef.current.pause();
        fallbackAudioRef.current.currentTime = 0;
      } catch (_) {}
    }

    const baseVol = parseFloat(localStorage.getItem('medivault_alarm_volume') || '1.0');
    const globalVol = parseFloat(localStorage.getItem('mv_global_volume') ?? 1.0);
    const volume = Math.max(0.2, baseVol * globalVol);
    const soundType = alarm.music || 'Gentle Chime';

    // Check shared audio context
    const ctx = getSharedAudioContext();
    if (ctx && (userGesture || ctx.state === 'suspended')) {
      ctx.resume().catch(() => {});
    }

    // Custom voice recording
    if (soundType.startsWith('voice_')) {
      const voices = JSON.parse(localStorage.getItem('medivault_human_voices') || '[]');
      const voice = voices.find(v => v.id === soundType);
      if (voice?.url) {
        if (!audioRef.current) audioRef.current = new Audio();
        audioRef.current.src = voice.url;
        audioRef.current.volume = volume;
        audioRef.current.loop = true;
        audioRef.current.play()
          .then(() => {
            setAudioPlaying(true);
            setAudioBlocked(false);
          })
          .catch((err) => {
            console.warn('Custom voice playback blocked by autoplay policy:', err);
            setAudioPlaying(false);
            setAudioBlocked(true);
          });
        return;
      }
    }

    // Synthesized peaceful sound
    soundEngineRef.current = new PeacefulSoundEngine();
    try {
      soundEngineRef.current.play(soundType, volume);
      const isSuspended = ctx && ctx.state === 'suspended';
      setAudioPlaying(!isSuspended);
      setAudioBlocked(isSuspended);

      // Play synthesized fallback chime via HTML5 Audio element as backup
      if (!fallbackAudioRef.current) {
        const chimeUrl = createFallbackChimeUrl();
        if (chimeUrl) {
          const a = new Audio(chimeUrl);
          a.volume = volume;
          a.loop = true;
          fallbackAudioRef.current = a;
        }
      }
      if (fallbackAudioRef.current) {
        fallbackAudioRef.current.play()
          .then(() => {
            setAudioPlaying(true);
            setAudioBlocked(false);
          })
          .catch(() => {});
      }
    } catch (e) {
      console.error('Sound engine error:', e);
      setAudioPlaying(false);
      setAudioBlocked(true);
    }
  }, []);

  // ── triggerAlarm (stable ref so SW callback can call it) ──
  const triggerAlarm = useCallback((alarm, isTest = false) => {
    if (!alarm) return;
    if (!isTest && activeAlarmRef.current && activeAlarmRef.current.id === alarm.id) {
      return;
    }

    try {
      window.focus();
    } catch (_) {}

    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    activeAlarmRef.current = alarm;
    setActiveAlarm(alarm);
    startSound(alarm, isTest);
    showNativeNotification(alarm);

    // Auto-dismiss after 60 seconds
    dismissTimerRef.current = setTimeout(() => {
      handleDismiss();
    }, 60000);
  }, [handleDismiss, showNativeNotification, startSound]);

  useEffect(() => {
    // Initial sync of stored alarms to SW
    const initialAlarms = getStoredAlarms(uid);
    syncTabletAlarmsToSW(initialAlarms, uid);

    // Register with SW manager for playing and stopping sounds
    registerSoundCallback('playTabletAlarm', (a) => triggerAlarm(a, false));
    registerSoundCallback('stopTabletAlarm', (alarmId) => {
      handleDismiss(null, alarmId);
    });

    const handleStopAlarm = (e) => {
      handleDismiss(null, e?.detail?.alarmId);
    };
    window.addEventListener('medivault_stop_alarm', handleStopAlarm);

    let bus = null;
    try {
      if ('BroadcastChannel' in window) {
        bus = new BroadcastChannel('medivault_alarm_bus');
        bus.onmessage = (event) => {
          if (event.data?.type === 'STOP_ALARM') {
            handleDismiss(null, event.data?.alarmId);
          }
        };
      }
    } catch (_) {}

    // ── In-page alarm checker: runs every 1000ms at exact time ──
    const checkAlarms = () => {
      const savedAlarms = getStoredAlarms(uid);
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentMin = currentHours * 60 + currentMinutes;
      const todayStr = getLocalTodayStr(now);

      let updatedList = [...savedAlarms];
      let needsSave = false;

      savedAlarms.forEach((alarm) => {
        if (!alarm.active || !alarm.time) return;
        const [h, m] = alarm.time.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return;
        const alarmMin = h * 60 + m;
        const diff = currentMin - alarmMin;
        const normTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const triggerKey = `${todayStr}_${normTime}`;

        // Trigger when at exact scheduled time (within current minute diff === 0, or up to 2 min late)
        if (diff >= 0 && diff <= 2 && alarm.lastTriggeredKey !== triggerKey) {
          triggerAlarm(alarm, false);
          needsSave = true;
          updatedList = updatedList.map((a) =>
            a.id === alarm.id ? { ...a, lastTriggered: todayStr, lastTriggeredKey: triggerKey } : a
          );
        }
      });

      if (needsSave) {
        if (uid && uid !== 'guest') localStorage.setItem(`medivault_alarms_${uid}`, JSON.stringify(updatedList));
        localStorage.setItem('medivault_alarms', JSON.stringify(updatedList));
        localStorage.setItem('medivault_alarms_guest', JSON.stringify(updatedList));
        syncTabletAlarmsToSW(updatedList, uid);
      }
    };

    // ── Dedicated Background Web Worker Timer ──
    // Runs in an isolated background thread and is NOT throttled when window is minimised
    let bgWorker = null;
    try {
      const workerBlob = new Blob([`
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'START') {
            if (timer) clearInterval(timer);
            timer = setInterval(function() {
              self.postMessage('TICK');
            }, 1000);
          } else if (e.data === 'STOP') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(workerBlob);
      bgWorker = new Worker(workerUrl);
      bgWorker.onmessage = (e) => {
        if (e.data === 'TICK') {
          checkAlarms();
        }
      };
      bgWorker.postMessage('START');
    } catch (err) {
      console.warn('Background worker timer not available, using interval fallback:', err);
    }

    const intervalId = setInterval(checkAlarms, 1000);

    // ── Listen for events: updated alarms, test popup, and SW triggers ──
    const handleAlarmsUpdated = () => checkAlarms();
    const handleStorageEvent = (e) => {
      if (e.key === 'medivault_dismiss_alarm_event' && e.newValue) {
        try {
          stopSound();
          activeAlarmRef.current = null;
          setActiveAlarm(null);
        } catch (_) {}
      }
      checkAlarms();
    };
    const handleSwAlarm = (e) => triggerAlarm(e.detail, false);
    const handleTestAlarm = (e) => triggerAlarm(e.detail, true);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeAlarmRef.current) {
        handleDismiss();
      }
    };

    window.addEventListener('medivault_alarms_updated', handleAlarmsUpdated);
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('medivault_sw_alarm', handleSwAlarm);
    window.addEventListener('medivault_test_alarm', handleTestAlarm);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(intervalId);
      if (bgWorker) {
        try {
          bgWorker.postMessage('STOP');
          bgWorker.terminate();
        } catch (_) {}
      }
      window.removeEventListener('medivault_alarms_updated', handleAlarmsUpdated);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('medivault_sw_alarm', handleSwAlarm);
      window.removeEventListener('medivault_stop_alarm', handleStopAlarm);
      window.removeEventListener('medivault_test_alarm', handleTestAlarm);
      window.removeEventListener('keydown', handleKeyDown);
      if (bus) bus.close();
    };
  }, [triggerAlarm, stopSound, uid]);

  const handleManualPlay = (e) => {
    if (e) e.stopPropagation();
    if (activeAlarm) {
      startSound(activeAlarm, true);
    }
  };

  if (!activeAlarm) return null;

  const alarmColor = activeAlarm.color || '#8b5cf6';
  const soundInfo = ALARM_SOUNDS.find(s => s.value === activeAlarm.music);
  const soundName = soundInfo?.label ? soundInfo.label.replace(/^[^a-zA-Z0-9]+/, '').trim() : (activeAlarm.music || 'Gentle Chime');

  return (
    <div
      onClick={handleManualPlay}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(5, 7, 15, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 999999,
        padding: '1.25rem'
      }}
    >
      <style>{`
        @keyframes mv-bar-grow {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1.4); }
        }
        @keyframes mv-heartbeat {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 10px rgba(124, 58, 237, 0.25), 0 0 45px rgba(124, 58, 237, 0.6); }
          50% { transform: scale(1.08); box-shadow: 0 0 0 18px rgba(124, 58, 237, 0.35), 0 0 65px rgba(124, 58, 237, 0.8); }
        }
      `}</style>

      {/* Main Glassmorphic Card Matching Screenshot */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(170deg, #161b2e 0%, #0d1222 55%, #181232 100%)',
          padding: '2.5rem 2rem',
          borderRadius: '2.2rem',
          boxShadow: `0 0 0 1px rgba(139, 92, 246, 0.4), 0 35px 80px -10px rgba(0,0,0,0.95), 0 0 55px rgba(139, 92, 246, 0.3)`,
          textAlign: 'center',
          color: '#ffffff',
          maxWidth: '430px',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Ambient glow orbs */}
        <div style={{ position: 'absolute', top: '-70px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: `radial-gradient(circle, rgba(139, 92, 246, 0.32), transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-90px', right: '-50px', width: '220px', height: '220px', background: `radial-gradient(circle, rgba(56, 189, 248, 0.18), transparent 70%)`, pointerEvents: 'none' }} />

        {/* Pulsing Bell Icon */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
          width: '92px', height: '92px',
          borderRadius: '50%',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 0 0 10px rgba(124, 58, 237, 0.25), 0 0 40px rgba(124, 58, 237, 0.6)',
          animation: 'mv-heartbeat 2s ease-in-out infinite'
        }}>
          <BellRing size={46} color="white" />
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '0.4rem', letterSpacing: '-0.5px', color: '#ffffff' }}>
          Medicine Reminder
        </h2>

        {/* Subtitle with highlighted exact time */}
        <p style={{ fontSize: '1.05rem', color: '#94a3b8', marginBottom: '1.4rem', lineHeight: '1.5' }}>
          It's <strong style={{ color: '#c084fc', fontWeight: '800' }}>{activeAlarm.time}</strong> — Time to take your tablet
        </p>

        {/* Tablet Name Pill Container */}
        <div style={{
          background: 'rgba(168, 85, 247, 0.12)',
          border: '1.5px solid rgba(168, 85, 247, 0.38)',
          padding: '1rem 1.5rem',
          borderRadius: '1.25rem',
          marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
        }}>
          <Pill size={24} color="#c084fc" />
          <span style={{ fontSize: '1.65rem', fontWeight: '900', color: '#c084fc', letterSpacing: '0.3px' }}>
            {activeAlarm.tablet}
          </span>
        </div>

        {/* Sound Name Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          padding: '0.45rem 1.25rem', borderRadius: '50px',
          marginBottom: '1.25rem',
          fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '600'
        }}>
          <span style={{ color: '#c084fc', fontWeight: '800' }}>♪</span>
          <span>🌙</span>
          <span>{soundName}</span>
        </div>

        {/* Animated Waveform Visualizer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          marginBottom: '1.4rem'
        }}>
          {[6, 10, 14, 18, 14, 10, 6, 10, 14, 10, 6].map((h, i) => (
            <div key={i} style={{
              width: '3.5px',
              height: `${h}px`,
              background: `linear-gradient(180deg, #c084fc, rgba(192, 132, 252, 0.35))`,
              borderRadius: '3px',
              animation: (audioPlaying || !audioBlocked) ? `mv-bar-grow ${0.4 + i * 0.07}s ease-in-out infinite alternate` : 'none',
              opacity: 0.95
            }} />
          ))}
          <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: audioBlocked ? '#f59e0b' : '#94a3b8', fontWeight: '600' }}>
            {audioBlocked ? '🔔 Tap to Unmute' : '♪ Playing'}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {/* Replay Button */}
          <button
            type="button"
            onClick={handleManualPlay}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              color: 'white',
              padding: '1.05rem 2rem',
              fontSize: '1.05rem', fontWeight: '800',
              border: 'none', borderRadius: '2rem',
              cursor: 'pointer', width: '100%',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.6rem',
              boxShadow: '0 8px 25px rgba(124, 58, 237, 0.45)',
              transition: 'all 0.25s ease',
            }}
          >
            <BellRing size={20} />
            <span>{audioBlocked ? '🔔 Tap to Play Alarm Sound' : '♪ Playing — Tap to Replay'}</span>
          </button>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={(e) => handleDismiss(e)}
            onTouchEnd={(e) => handleDismiss(e)}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white', padding: '1.05rem 2rem',
              fontSize: '1.05rem', fontWeight: '800',
              border: 'none', borderRadius: '2rem',
              cursor: 'pointer', width: '100%',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.55rem',
              boxShadow: '0 8px 25px rgba(239, 68, 68, 0.45)', transition: 'all 0.25s ease',
              touchAction: 'manipulation',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <span style={{ fontSize: '1.15rem', fontWeight: '900' }}>✕</span>
            <span style={{ fontSize: '1.15rem', fontWeight: '900' }}>✓</span>
            <span>Dismiss Alarm</span>
          </button>
        </div>

        {/* Auto dismiss timer footnote */}
        <p style={{ marginTop: '1.15rem', fontSize: '0.82rem', color: '#64748b', fontWeight: '500' }}>
          Auto-dismisses after 60 seconds
        </p>
      </div>
    </div>
  );
}
