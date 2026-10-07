import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BellRing, X, Pill, Volume2, Music2 } from 'lucide-react';
import { syncTabletAlarmsToSW, requestNotificationPermission, registerSoundCallback, dismissAlarmInSW } from '../services/swManager';
import { dismissNativeTabletAlarm, isNativeApp } from '../services/nativeNotificationService';
import { useAuth } from '../contexts/AuthContext';

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
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Helper: create a soft sine tone with smooth attack + long decay
  _softTone(freq, startTime, duration, vol = 0.3, type = 'sine') {
    if (!this.running) return;
    const ctx = this._ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + duration * 0.15); // smooth attack
    gain.gain.setValueAtTime(vol, startTime + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // long decay
    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    this.nodes.push(osc, gain);
  }

  // 🎵 1. GENTLE CHIME — soft bell trio, peaceful and clear
  playGentleChime(vol = 1.0) {
    const ctx = this._ctx();
    this.running = true;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)

    const play = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      notes.forEach((freq, i) => {
        this._softTone(freq, now + i * 0.22, 2.2, vol * 0.28);
      });
    };
    play();
    const id = setInterval(play, 3500);
    this.intervals.push(id);
  }

  // 🌅 2. MORNING BELLS — ascending gentle bell sequence, like sunrise
  playMorningBells(vol = 1.0) {
    const ctx = this._ctx();
    this.running = true;
    // Pentatonic scale — always sounds beautiful
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4,E4,G4,C5,E5

    const play = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      notes.forEach((freq, i) => {
        this._softTone(freq, now + i * 0.35, 2.0, vol * 0.25);
      });
    };
    play();
    const id = setInterval(play, 4000);
    this.intervals.push(id);
  }

  // 🎶 3. SOFT HARP — cascading harp-like arpeggio, dreamy
  playSoftHarp(vol = 1.0) {
    const ctx = this._ctx();
    this.running = true;
    const notes = [329.63, 415.30, 523.25, 659.25, 830.61]; // E4,Ab4,C5,E5,Ab5

    const play = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      // Forward then reverse arpeggio
      const seq = [...notes, ...notes.slice().reverse()];
      seq.forEach((freq, i) => {
        this._softTone(freq, now + i * 0.18, 1.5, vol * 0.22);
      });
    };
    play();
    const id = setInterval(play, 3800);
    this.intervals.push(id);
  }

  // 🧘 4. MEDITATION BOWL — deep Tibetan singing bowl resonance
  playMeditationBowl(vol = 1.0) {
    const ctx = this._ctx();
    this.running = true;

    const play = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      // Fundamental + subtle overtones for bowl character
      [[220, 0], [330, 0.05], [440, 0.08]].forEach(([freq, offset]) => {
        this._softTone(freq, now + offset, 4.0, vol * (offset === 0 ? 0.35 : 0.12));
      });
    };
    play();
    const id = setInterval(play, 5000);
    this.intervals.push(id);
  }

  // 🌊 5. OCEAN LULLABY — soothing low tones like distant waves
  playOceanLullaby(vol = 1.0) {
    const ctx = this._ctx();
    this.running = true;

    const play = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      // Low gentle wave-like sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.linearRampToValueAtTime(180, now + 2.0);
      osc.frequency.linearRampToValueAtTime(130, now + 4.0);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol * 0.3, now + 1.0);
      gain.gain.linearRampToValueAtTime(vol * 0.3, now + 3.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4.2);
      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);
      osc.start(now);
      osc.stop(now + 4.3);
      this.nodes.push(osc, gain);

      // Soft harmonic shimmer on top
      this._softTone(392.00, now + 0.5, 3.0, vol * 0.15);
      this._softTone(523.25, now + 1.5, 2.5, vol * 0.12);
    };
    play();
    const id = setInterval(play, 5200);
    this.intervals.push(id);
  }

  // 🌸 6. WIND CHIMES — random light chime notes, natural & airy
  playWindChimes(vol = 1.0) {
    const ctx = this._ctx();
    this.running = true;
    const chimePitches = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77];

    const play = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      // Pick 3-4 random chime notes at random offsets
      const count = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const freq = chimePitches[Math.floor(Math.random() * chimePitches.length)];
        const offset = Math.random() * 1.2;
        this._softTone(freq, now + offset, 1.8, vol * 0.22);
      }
    };
    play();
    const id = setInterval(play, 2800);
    this.intervals.push(id);
  }

  // 🌙 7. DREAMSCAPE — slow, dreamy chord layers, deeply relaxing
  playDreamscape(vol = 1.0) {
    const ctx = this._ctx();
    this.running = true;
    // Lush Cmaj9 voicing spread over 3 octaves
    const layers = [
      [130.81, 3.5],   // C3 — deep bass foundation
      [196.00, 3.0],   // G3
      [261.63, 2.8],   // C4
      [329.63, 2.5],   // E4
      [392.00, 2.2],   // G4
      [523.25, 2.0],   // C5 — bright top layer
    ];

    const play = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      layers.forEach(([freq, decay], i) => {
        this._softTone(freq, now + i * 0.3, decay + 1.5, vol * (i < 2 ? 0.2 : 0.15));
      });
    };
    play();
    const id = setInterval(play, 5500);
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

    // Mute master gain immediately
    if (this.masterGain) {
      try {
        this.masterGain.gain.cancelScheduledValues(0);
        this.masterGain.gain.setValueAtTime(0, 0);
        this.masterGain.disconnect();
      } catch (_) {}
      this.masterGain = null;
    }

    // Stop and zero all oscillator & gain nodes
    this.nodes.forEach(n => {
      try { if (n.stop) n.stop(0); } catch (_) {}
      try {
        if (n.gain) {
          n.gain.cancelScheduledValues(0);
          n.gain.setValueAtTime(0, 0);
        }
      } catch (_) {}
      try { n.disconnect(); } catch (_) {}
    });
    this.nodes = [];

    if (this.ctx) {
      try { this.ctx.suspend(); } catch (_) {}
      try { this.ctx.close(); } catch (_) {}
      this.ctx = null;
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
  const activeAlarmRef = useRef(null);
  const soundEngineRef = useRef(null);
  const audioRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const notificationRef = useRef(null);

  const stopSound = useCallback(() => {
    if (soundEngineRef.current) {
      try {
        soundEngineRef.current.stop();
      } catch (_) {}
      soundEngineRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      } catch (_) {}
    }
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
  }, []);

  const handleDismiss = useCallback(async () => {
    const alarmToDismiss = activeAlarmRef.current || activeAlarm;
    const alarmId = alarmToDismiss?.id;

    // 1. Immediately silence all audio and close the in-app modal
    stopSound();
    activeAlarmRef.current = null;
    setActiveAlarm(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const triggerKey = alarmToDismiss?.time ? `${todayStr}_${alarmToDismiss.time}` : todayStr;

    // 2. Persist lastTriggeredKey in localStorage so periodic check won't re-fire at this minute, but can fire if time changed
    if (alarmToDismiss) {
      try {
        const activeAlarmKey = uid ? `medivault_alarms_${uid}` : 'medivault_alarms';
        const savedAlarms = JSON.parse(localStorage.getItem(activeAlarmKey) || localStorage.getItem('medivault_alarms') || '[]');
        const updatedList = savedAlarms.map((a) =>
          a.id === alarmToDismiss.id ? { ...a, lastTriggered: todayStr, lastTriggeredKey: triggerKey } : a
        );
        localStorage.setItem(activeAlarmKey, JSON.stringify(updatedList));
        localStorage.setItem('medivault_alarms', JSON.stringify(updatedList));
        syncTabletAlarmsToSW(updatedList, uid);
      } catch (e) {
        console.error('Error saving dismissed alarm state:', e);
      }
    }

    // 3. Close Service Worker notifications directly on mobile / desktop
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg?.getNotifications) {
          const notifs = await reg.getNotifications();
          notifs.forEach((n) => {
            const d = n.data || {};
            if (
              !alarmId ||
              d.alarmId === alarmId ||
              n.tag?.includes('tablet-alarm') ||
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

    // 4. Tell Service Worker to remove pending from DB, close OS notifications, and notify other tabs
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
  }, [activeAlarm, stopSound, uid]);

  const showNativeNotification = useCallback(async (alarm) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const soundInfo = ALARM_SOUNDS.find((s) => s.value === alarm.music);
    const title = '💊 Medicine Reminder!';
    const body = `${alarm.time} — Time to take: ${alarm.tablet}\n♪ ${soundInfo?.label || alarm.music}`;
    const tag = `tablet-alarm-${alarm.id}`;
    const options = {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag,
      requireInteraction: false,
      renotify: true,
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

    // 1. Try SW showNotification first (native support on Android mobile + PC)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg?.showNotification) {
          await reg.showNotification(title, options);
          // Auto-close notification after 1 minute (60 seconds)
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
          return;
        }
      } catch (err) {
        console.warn('SW showNotification error, falling back:', err);
      }
    }

    // 2. Fallback to desktop window Notification
    try {
      const notif = new Notification(title, options);
      notificationRef.current = notif;
      // Auto-close notification after 1 minute (60 seconds)
      setTimeout(() => {
        try {
          notif.close();
        } catch (_) {}
      }, 60000);
      notif.onclick = () => {
        window.focus();
        handleDismiss();
        notif.close();
      };
    } catch (err) {
      console.warn('Window Notification not supported on this platform:', err);
    }
  }, [handleDismiss]);

  const startSound = useCallback((alarm) => {
    // Stop any existing sound first
    if (soundEngineRef.current) {
      try {
        soundEngineRef.current.stop();
      } catch (_) {}
      soundEngineRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      } catch (_) {}
    }

    const baseVol = parseFloat(localStorage.getItem('medivault_alarm_volume') || '1.0');
    const globalVol = parseFloat(localStorage.getItem('mv_global_volume') ?? 1.0);
    const volume = baseVol * globalVol;
    const soundType = alarm.music || 'Gentle Chime';

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
          .then(() => setAudioPlaying(true))
          .catch(() => setAudioPlaying(false));
        return;
      }
    }

    // Synthesized peaceful sounds
    soundEngineRef.current = new PeacefulSoundEngine();
    try {
      soundEngineRef.current.play(soundType, volume);
      setAudioPlaying(true);
    } catch (e) {
      console.error('Sound engine error:', e);
      setAudioPlaying(false);
    }
  }, []);

  // ── triggerAlarm (stable ref so SW callback can call it) ──
  const triggerAlarm = useCallback((alarm, isTest = false) => {
    if (!alarm) return;
    // Prevent duplicate re-triggering if the same alarm is already active unless user clicked test
    if (!isTest && activeAlarmRef.current && activeAlarmRef.current.id === alarm.id) {
      return;
    }

    try {
      window.focus();
    } catch (_) {}

    // Reset previous auto-dismiss timer if running
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    activeAlarmRef.current = alarm;
    setActiveAlarm(alarm);
    startSound(alarm);
    showNativeNotification(alarm);

    // Auto-dismiss after 60 seconds (1 minute)
    dismissTimerRef.current = setTimeout(() => {
      handleDismiss();
    }, 60000);
  }, [handleDismiss, showNativeNotification, startSound]);

  useEffect(() => {
    // Request notification permission so background SW notifications work
    if ('Notification' in window && Notification.permission !== 'granted') {
      requestNotificationPermission();
    }

    const alarmKey = uid ? `medivault_alarms_${uid}` : 'medivault_alarms';
    // Sync alarms to service worker (persisted in SW IndexedDB)
    const alarms = JSON.parse(localStorage.getItem(alarmKey) || localStorage.getItem('medivault_alarms') || '[]');
    syncTabletAlarmsToSW(alarms, uid);

    // Register with SW manager for playing and stopping sounds
    registerSoundCallback('playTabletAlarm', (a) => triggerAlarm(a, false));
    registerSoundCallback('stopTabletAlarm', () => {
      stopSound();
      activeAlarmRef.current = null;
      setActiveAlarm(null);
    });

    // Listen to stop events from SW / notifications
    const handleStopAlarm = () => {
      stopSound();
      activeAlarmRef.current = null;
      setActiveAlarm(null);
    };
    window.addEventListener('medivault_stop_alarm', handleStopAlarm);

    // BroadcastChannel for cross-tab synchronization
    let bus = null;
    try {
      if ('BroadcastChannel' in window) {
        bus = new BroadcastChannel('medivault_alarm_bus');
        bus.onmessage = (event) => {
          if (event.data?.type === 'STOP_ALARM') {
            stopSound();
            activeAlarmRef.current = null;
            setActiveAlarm(null);
          }
        };
      }
    } catch (_) {}

    // ── In-page alarm checker (fires when tab IS open) ──
    const checkAlarms = () => {
      const activeAlarmKey = uid ? `medivault_alarms_${uid}` : 'medivault_alarms';
      const savedAlarms = JSON.parse(localStorage.getItem(activeAlarmKey) || localStorage.getItem('medivault_alarms') || '[]');
      const now         = new Date();
      const currentMin  = now.getHours() * 60 + now.getMinutes();
      const todayStr    = now.toISOString().split('T')[0];

      let updatedList = [...savedAlarms];
      let needsSave   = false;

      savedAlarms.forEach((alarm) => {
        if (!alarm.active || !alarm.time) return;
        const [h, m] = alarm.time.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return;
        const diff   = currentMin - (h * 60 + m);
        const triggerKey = `${todayStr}_${alarm.time}`;
        if (diff >= 0 && diff <= 5 && alarm.lastTriggeredKey !== triggerKey) {
          triggerAlarm(alarm);
          needsSave = true;
          updatedList = updatedList.map((a) =>
            a.id === alarm.id ? { ...a, lastTriggered: todayStr, lastTriggeredKey: triggerKey } : a
          );
        }
      });

      if (needsSave) {
        localStorage.setItem(activeAlarmKey, JSON.stringify(updatedList));
        localStorage.setItem('medivault_alarms', JSON.stringify(updatedList));
        syncTabletAlarmsToSW(updatedList, uid);
      }
    };

    const intervalId = setInterval(checkAlarms, 1000);

    // ── Listen for SW-fired alarms (fallback) & test alarms ──
    const handleSwAlarm = (e) => triggerAlarm(e.detail, false);
    const handleTestAlarm = (e) => triggerAlarm(e.detail, true);
    window.addEventListener('medivault_sw_alarm', handleSwAlarm);
    window.addEventListener('medivault_test_alarm', handleTestAlarm);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('medivault_sw_alarm', handleSwAlarm);
      window.removeEventListener('medivault_stop_alarm', handleStopAlarm);
      window.removeEventListener('medivault_test_alarm', handleTestAlarm);
      if (bus) bus.close();
    };
  }, [triggerAlarm, stopSound, uid]);

  const handleManualPlay = () => { if (activeAlarm) startSound(activeAlarm); };

  if (!activeAlarm) return null;

  const alarmColor = activeAlarm.color || '#a855f7';
  const soundInfo = ALARM_SOUNDS.find(s => s.value === activeAlarm.music);
  const soundName = soundInfo?.label ? soundInfo.label.replace(/^[^a-zA-Z0-9]+/, '').trim() : (activeAlarm.music || 'Dreamscape');

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 999999,
      padding: '1rem'
    }}>
      <style>{`
        @keyframes mv-bar-grow {
          0% { transform: scaleY(0.35); }
          100% { transform: scaleY(1.35); }
        }
        @keyframes mv-heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
      <div style={{
        background: 'linear-gradient(165deg, #141b2d 0%, #0d121f 55%, #15102a 100%)',
        padding: '2.5rem 2rem',
        borderRadius: '2rem',
        boxShadow: `0 0 0 1px rgba(139, 92, 246, 0.35), 0 35px 80px -10px rgba(0,0,0,0.9), 0 0 50px rgba(139, 92, 246, 0.25)`,
        textAlign: 'center',
        color: '#fff',
        maxWidth: '420px',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Ambient glow orbs */}
        <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '280px', height: '280px', background: `radial-gradient(circle, rgba(139, 92, 246, 0.28), transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', right: '-40px', width: '200px', height: '200px', background: `radial-gradient(circle, rgba(56, 189, 248, 0.15), transparent 70%)`, pointerEvents: 'none' }} />

        {/* Bell icon */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
          width: '88px', height: '88px',
          borderRadius: '50%',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 0 0 10px rgba(124, 58, 237, 0.2), 0 0 35px rgba(124, 58, 237, 0.5)',
          animation: 'mv-heartbeat 2.2s ease-in-out infinite'
        }}>
          <BellRing size={44} color="white" />
        </div>

        <h2 style={{ fontSize: '2.1rem', fontWeight: '900', marginBottom: '0.35rem', letterSpacing: '-0.5px', color: '#ffffff' }}>
          Medicine Reminder
        </h2>
        <p style={{ fontSize: '1.05rem', color: '#94a3b8', marginBottom: '1.4rem', lineHeight: '1.5' }}>
          It's <strong style={{ color: alarmColor, fontWeight: '800' }}>{activeAlarm.time}</strong> — Time to take your tablet
        </p>

        {/* Tablet name */}
        <div style={{
          background: 'rgba(168, 85, 247, 0.12)',
          border: '1.5px solid rgba(168, 85, 247, 0.38)',
          padding: '1rem 1.5rem',
          borderRadius: '1.2rem',
          marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
        }}>
          <Pill size={24} color={alarmColor} />
          <span style={{ fontSize: '1.65rem', fontWeight: '900', color: alarmColor, letterSpacing: '0.3px' }}>
            {activeAlarm.tablet}
          </span>
        </div>

        {/* Sound name badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          padding: '0.45rem 1.15rem', borderRadius: '50px',
          marginBottom: '1.25rem',
          fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '600'
        }}>
          <span style={{ color: alarmColor, fontWeight: '800' }}>♪</span>
          <span>🌙</span>
          <span>{soundName}</span>
        </div>

        {/* Sound wave visual */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          marginBottom: '1.35rem'
        }}>
          {[6, 10, 14, 18, 14, 10, 6, 10, 14, 10, 6].map((h, i) => (
            <div key={i} style={{
              width: '3.5px',
              height: `${h}px`,
              background: `linear-gradient(180deg, ${alarmColor}, ${alarmColor}66)`,
              borderRadius: '3px',
              animation: audioPlaying ? `mv-bar-grow ${0.4 + i * 0.07}s ease-in-out infinite alternate` : 'none',
              opacity: 0.9
            }} />
          ))}
          <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>
            ♪ Playing
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Play / Replay button */}
          <button
            type="button"
            onClick={handleManualPlay}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              color: 'white',
              padding: '1rem 2rem',
              fontSize: '1.05rem', fontWeight: '800',
              border: 'none', borderRadius: '2rem',
              cursor: 'pointer', width: '100%',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.6rem',
              boxShadow: '0 8px 25px rgba(124, 58, 237, 0.45)',
              transition: 'all 0.25s ease',
            }}
          >
            <BellRing size={20} />
            <span>♪ Playing — Tap to Replay</span>
          </button>

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white', padding: '1rem 2rem',
              fontSize: '1.05rem', fontWeight: '800',
              border: 'none', borderRadius: '2rem',
              cursor: 'pointer', width: '100%',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)', transition: 'all 0.25s ease'
            }}
          >
            <span style={{ fontSize: '1.15rem', fontWeight: '900' }}>✕</span>
            <span style={{ fontSize: '1.15rem', fontWeight: '900' }}>✓</span>
            <span>Dismiss Alarm</span>
          </button>
        </div>

        <p style={{ marginTop: '1.1rem', fontSize: '0.82rem', color: '#64748b', fontWeight: '500' }}>
          Auto-dismisses after 60 seconds
        </p>
      </div>
    </div>
  );
}
