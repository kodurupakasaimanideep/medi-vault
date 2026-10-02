import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BellRing, X, Pill, Volume2, Music2 } from 'lucide-react';
import { syncTabletAlarmsToSW, requestNotificationPermission, registerSoundCallback } from '../services/swManager';
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
  }

  _ctx() {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      try { this.ctx.resume(); } catch(e) {}
    }
    return this.ctx;
  }

  // Helper: create a soft sine tone with smooth attack + long decay
  _softTone(freq, startTime, duration, vol = 0.3, type = 'sine') {
    if (!this.running) return;
    try {
      const ctx = this._ctx();
      if (!ctx || ctx.state === 'closed') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + duration * 0.15);
      gain.gain.setValueAtTime(vol, startTime + duration * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
      this.nodes.push(osc, gain);
    } catch (e) {}
  }

  // 🎵 1. GENTLE CHIME — soft bell trio, peaceful and clear
  playGentleChime(vol = 1.0) {
    const ctx = this._ctx();
    this.running = true;
    const notes = [523.25, 659.25, 783.99];

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
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];

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
    const notes = [329.63, 415.30, 523.25, 659.25, 830.61];

    const play = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
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
      try {
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
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 4.3);
        this.nodes.push(osc, gain);
      } catch (e) {}

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

    // Instantly zero out and disconnect all scheduled audio nodes
    this.nodes.forEach(n => {
      try {
        if (n.gain) {
          n.gain.cancelScheduledValues(0);
          n.gain.setValueAtTime(0, 0);
        }
        if (n.stop && typeof n.stop === 'function') {
          n.stop(0);
        }
        if (n.disconnect && typeof n.disconnect === 'function') {
          n.disconnect();
        }
      } catch (e) {}
    });
    this.nodes = [];

    if (this.ctx) {
      try {
        if (this.ctx.suspend) this.ctx.suspend();
        if (this.ctx.close && this.ctx.state !== 'closed') this.ctx.close();
      } catch (e) {}
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
  const soundEngineRef = useRef(null);
  const audioRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const notificationRef = useRef(null);
  const dismissedAlarmsRef = useRef(new Set()); // Prevents re-triggering dismissed alarms today

  const stopSound = useCallback(() => {
    if (soundEngineRef.current) {
      try { soundEngineRef.current.stop(); } catch (e) {}
      soundEngineRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      } catch (e) {}
    }
    if (notificationRef.current) {
      try { notificationRef.current.close(); } catch (e) {}
      notificationRef.current = null;
    }
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setAudioPlaying(false);
  }, []);

  const startSound = useCallback((alarm) => {
    stopSound(); // Ensure clean slate

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
    const engine = new PeacefulSoundEngine();
    soundEngineRef.current = engine;
    try {
      engine.play(soundType, volume);
      setAudioPlaying(true);
    } catch (e) {
      console.error('Sound engine error:', e);
      setAudioPlaying(false);
    }
  }, [stopSound]);

  const showNativeNotification = useCallback((alarm) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const soundInfo = ALARM_SOUNDS.find(s => s.value === alarm.music);
        const notif = new Notification('💊 Medicine Reminder!', {
          body: `${alarm.time} — Time to take: ${alarm.tablet}\n♪ ${soundInfo?.label || alarm.music}`,
          icon: '/favicon.ico',
          requireInteraction: true,
        });
        notificationRef.current = notif;
        notif.onclick = () => {
          window.focus();
          stopSound();
          setActiveAlarm(null);
          notif.close();
        };
      } catch (e) {}
    }
  }, [stopSound]);

  // ── triggerAlarm (stable ref so SW callback can call it) ──
  const triggerAlarm = useCallback((alarm) => {
    if (!alarm) return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const dismissKey = `${alarm.id}_${todayStr}`;

    // If alarm was already dismissed today, do not trigger again
    if (dismissedAlarmsRef.current.has(dismissKey)) {
      return;
    }

    setActiveAlarm((current) => {
      if (current && current.id === alarm.id) return current;
      return alarm;
    });

    startSound(alarm);
    showNativeNotification(alarm);

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      stopSound();
      setActiveAlarm(null);
    }, 60000);
  }, [startSound, showNativeNotification, stopSound]);

  const handleDismiss = useCallback(() => {
    const current = activeAlarm;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (current) {
      const dismissKey = `${current.id}_${todayStr}`;
      dismissedAlarmsRef.current.add(dismissKey);

      // Persist lastTriggered so checkAlarms and SW never re-fire it today
      try {
        const activeAlarmKey = uid ? `medivault_alarms_${uid}` : 'medivault_alarms';
        const savedAlarms = JSON.parse(localStorage.getItem(activeAlarmKey) || localStorage.getItem('medivault_alarms') || '[]');
        const updated = savedAlarms.map(a => a.id === current.id ? { ...a, lastTriggered: todayStr } : a);
        localStorage.setItem(activeAlarmKey, JSON.stringify(updated));
        localStorage.setItem('medivault_alarms', JSON.stringify(updated));
        syncTabletAlarmsToSW(updated, uid);
      } catch (e) {}
    }

    stopSound();
    setActiveAlarm(null);
    window.dispatchEvent(new CustomEvent('medivault_stop_all_audio'));
  }, [activeAlarm, stopSound, uid]);

  useEffect(() => {
    // Request notification permission so background SW notifications work
    if ('Notification' in window && Notification.permission !== 'granted') {
      requestNotificationPermission();
    }

    const alarmKey = uid ? `medivault_alarms_${uid}` : 'medivault_alarms';
    const alarms = JSON.parse(localStorage.getItem(alarmKey) || localStorage.getItem('medivault_alarms') || '[]');
    syncTabletAlarmsToSW(alarms, uid);

    registerSoundCallback('playTabletAlarm', triggerAlarm);

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
        if (!alarm.active) return;
        const dismissKey = `${alarm.id}_${todayStr}`;
        if (dismissedAlarmsRef.current.has(dismissKey)) return;

        const [h, m] = alarm.time.split(':').map(Number);
        const diff   = currentMin - (h * 60 + m);
        if (diff >= 0 && diff <= 5 && alarm.lastTriggered !== todayStr) {
          triggerAlarm(alarm);
          needsSave = true;
          updatedList = updatedList.map((a) =>
            a.id === alarm.id ? { ...a, lastTriggered: todayStr } : a
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

    const handleSwAlarm = (e) => triggerAlarm(e.detail);
    const handleTestAlarm = (e) => triggerAlarm(e.detail);
    const handleGlobalStop = () => stopSound();

    window.addEventListener('medivault_sw_alarm', handleSwAlarm);
    window.addEventListener('medivault_test_alarm', handleTestAlarm);
    window.addEventListener('medivault_stop_all_audio', handleGlobalStop);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('medivault_sw_alarm', handleSwAlarm);
      window.removeEventListener('medivault_test_alarm', handleTestAlarm);
      window.removeEventListener('medivault_stop_all_audio', handleGlobalStop);
    };
  }, [triggerAlarm, stopSound, uid]);

  if (!activeAlarm) return null;

  const alarmColor = activeAlarm.color || '#8b5cf6';
  const soundInfo = ALARM_SOUNDS.find(s => s.value === activeAlarm.music);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.72)',
      backdropFilter: 'blur(10px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 99999
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 60%, #1a1040 100%)',
        padding: '2.5rem 2rem',
        borderRadius: '2rem',
        boxShadow: `0 0 0 1px ${alarmColor}55, 0 40px 80px -12px rgba(0,0,0,0.8), 0 0 60px ${alarmColor}22`,
        textAlign: 'center',
        color: '#fff',
        maxWidth: '420px',
        width: '92%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top-Right Quick Close Button */}
        <button
          onClick={handleDismiss}
          onTouchEnd={(e) => { e.preventDefault(); handleDismiss(); }}
          style={{
            position: 'absolute', top: '18px', right: '18px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#cbd5e1',
            width: '36px', height: '36px',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.2s'
          }}
          title="Close Alarm"
        >
          <X size={18} />
        </button>

        {/* Ambient glow orbs */}
        <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '280px', height: '280px', background: `radial-gradient(circle, ${alarmColor}22, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', right: '-40px', width: '200px', height: '200px', background: `radial-gradient(circle, #38bdf822, transparent 70%)`, pointerEvents: 'none' }} />

        {/* Bell icon */}
        <div style={{
          background: `linear-gradient(135deg, ${alarmColor}cc, ${alarmColor}88)`,
          width: '88px', height: '88px',
          borderRadius: '50%',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: `0 0 0 8px ${alarmColor}18, 0 0 40px ${alarmColor}44`,
          animation: 'heartbeat 2s ease-in-out infinite'
        }}>
          <BellRing size={42} color="white" />
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '0.3rem', letterSpacing: '-0.5px' }}>
          Medicine Reminder
        </h2>
        <p style={{ fontSize: '1.05rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          It's <strong style={{ color: alarmColor }}>{activeAlarm.time}</strong> — Time to take your tablet
        </p>

        {/* Tablet name */}
        <div style={{
          background: `${alarmColor}15`,
          border: `1px solid ${alarmColor}40`,
          padding: '1rem 1.5rem',
          borderRadius: '1rem',
          marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
        }}>
          <Pill size={22} color={alarmColor} />
          <span style={{ fontSize: '1.55rem', fontWeight: '800', color: alarmColor }}>{activeAlarm.tablet}</span>
        </div>

        {/* Sound name badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '0.4rem 1rem', borderRadius: '50px',
          marginBottom: '1.5rem',
          fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '500'
        }}>
          <Music2 size={14} style={{ color: alarmColor }} />
          {soundInfo?.label || activeAlarm.music}
        </div>

        {/* Sound wave visual */}
        {audioPlaying && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            marginBottom: '1.25rem'
          }}>
            {[6,10,14,18,14,10,6,10,14,10,6].map((h, i) => (
              <div key={i} style={{
                width: '3px',
                height: `${h}px`,
                background: `linear-gradient(180deg, ${alarmColor}, ${alarmColor}66)`,
                borderRadius: '3px',
                animation: `dw-bar-grow ${0.4 + i * 0.07}s ease-in-out infinite alternate`,
                opacity: 0.85
              }} />
            ))}
            <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
              ♪ Playing
            </span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Play / Replay button */}
          <button
            onClick={handleManualPlay}
            style={{
              background: audioPlaying
                ? `linear-gradient(135deg, ${alarmColor}dd, ${alarmColor}99)`
                : `linear-gradient(135deg, #10b981, #059669)`,
              color: 'white',
              padding: '1rem 2rem',
              fontSize: '1.05rem', fontWeight: '800',
              border: 'none', borderRadius: '2rem',
              cursor: 'pointer', width: '100%',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.6rem',
              boxShadow: audioPlaying ? `0 6px 20px ${alarmColor}44` : '0 6px 20px rgba(16,185,129,0.4)',
              transition: 'all 0.3s',
            }}
          >
            <BellRing size={20} />
            {audioPlaying ? '♪ Playing — Tap to Replay' : '▶ Play Alarm Sound'}
          </button>

          {/* Dismiss button with both click and touch support */}
          <button
            onClick={handleDismiss}
            onTouchEnd={(e) => { e.preventDefault(); handleDismiss(); }}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white', padding: '0.9rem 2rem',
              fontSize: '1.05rem', fontWeight: '800',
              border: 'none', borderRadius: '2rem',
              cursor: 'pointer', width: '100%',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.6rem',
              boxShadow: '0 6px 20px rgba(239,68,68,0.35)', transition: 'all 0.3s'
            }}
          >
            <X size={20} /> ✓ Dismiss Alarm
          </button>
        </div>

        <p style={{ marginTop: '1rem', fontSize: '0.78rem', color: '#475569' }}>
          Auto-dismisses after 60 seconds
        </p>
      </div>
    </div>
  );
}
