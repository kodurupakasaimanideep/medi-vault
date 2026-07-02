import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, User, Mail, Lock, Bell, MapPin, Globe, Clock,
  Moon, Sun, Shield, Info, ChevronRight, ChevronLeft, Eye, EyeOff,
  Phone, Check, X, BarChart2, Smartphone, Key, Volume2, Trash2, AlertTriangle
} from 'lucide-react';
import './Settings.css';
import SectionAbout from '../components/SectionAbout';
import { useLanguage } from '../contexts/LanguageContext';

export default function SettingsPage({ user, theme, toggleTheme, onLogout }) {
  const navigate = useNavigate();
  const { lang, changeLanguage, t } = useLanguage();
  const [activeSection, setActiveSection] = useState('general');
  const [language, setLanguage] = useState(() => localStorage.getItem('mv_language') || 'en');
  const [globalVolume, setGlobalVolume] = useState(() => {
    const v = localStorage.getItem('mv_global_volume');
    return v !== null ? parseFloat(v) : 1.0;
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('mv_notifications') !== 'false');
  const [locationEnabled, setLocationEnabled] = useState(() => localStorage.getItem('mv_location') === 'true');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [toast, setToast] = useState(null);
  const [usageData, setUsageData] = useState([]);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const timerRef = useRef(null);
  // Delete account state
  const [deleteStep, setDeleteStep] = useState(0); // 0=idle 1=confirm 2=typing
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Password change loading
  const [pwLoading, setPwLoading] = useState(false);

  // Load usage data for time management
  useEffect(() => {
    const data = [];
    const today = new Date();
    let total = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `mv_usage_${d.toLocaleDateString('en-CA')}`;
      const mins = parseInt(localStorage.getItem(key) || '0', 10);
      data.push({ date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), mins, day: d.toLocaleDateString('en-US', { weekday: 'short' }) });
      total += mins;
    }
    setUsageData(data);
    setWeeklyTotal(total);
  }, []);

  // Track session time
  useEffect(() => {
    const todayKey = `mv_usage_${new Date().toLocaleDateString('en-CA')}`;
    timerRef.current = setInterval(() => {
      const current = parseInt(localStorage.getItem(todayKey) || '0', 10);
      localStorage.setItem(todayKey, String(current + 1));
    }, 60000);
    return () => clearInterval(timerRef.current);
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendOtp = () => {
    if (!phone || phone.replace(/\D/g, '').length < 10) { showToast('Enter a valid 10-digit mobile number', 'error'); return; }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtpSent(true);
    showToast(`OTP sent! (Demo: ${code})`, 'success');
  };

  const handleVerifyOtp = () => {
    if (otp === generatedOtp) {
      setOtpVerified(true);
      showToast('OTP verified! Set your new password below.', 'success');
    } else {
      showToast('Incorrect OTP. Try again.', 'error');
    }
  };

  /* ── Actually update password in localStorage auth store ── */
  const handleChangePassword = async () => {
    if (!otpVerified) { showToast('Please verify OTP first', 'error'); return; }
    if (!newPassword || newPassword.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    if (newPassword !== confirmPassword) { showToast('Passwords do not match', 'error'); return; }

    setPwLoading(true);
    try {
      // Re-hash with existing salt using PBKDF2 (same as localAuth.js)
      const users = JSON.parse(localStorage.getItem('mv_auth_users') || '[]');
      const idx = users.findIndex(u => u.uid === user?.id);
      if (idx === -1) { showToast('User not found in auth store', 'error'); setPwLoading(false); return; }

      const salt = users[idx].salt;
      // PBKDF2 hash (mirrors localAuth.js)
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(newPassword), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
        keyMaterial, 256
      );
      const newHash = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');

      users[idx].passwordHash = newHash;
      localStorage.setItem('mv_auth_users', JSON.stringify(users));

      showToast('✅ Password changed! Use new password next time you log in.', 'success');
      setOtpSent(false); setOtpVerified(false); setOtp('');
      setNewPassword(''); setConfirmPassword(''); setPhone('');
    } catch (err) {
      showToast('Error updating password: ' + err.message, 'error');
    }
    setPwLoading(false);
  };

  /* ── Permanently delete account ── */
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') { showToast('Type DELETE to confirm', 'error'); return; }
    setDeleteLoading(true);
    try {
      const uid = user?.id;
      // 1. Remove user from auth store
      const users = JSON.parse(localStorage.getItem('mv_auth_users') || '[]');
      const filtered = users.filter(u => u.uid !== uid);
      localStorage.setItem('mv_auth_users', JSON.stringify(filtered));

      // 2. Remove all medivault data keys for this user
      const keysToDelete = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes(uid) || k === 'mv_auth_session')) keysToDelete.push(k);
      }
      keysToDelete.forEach(k => localStorage.removeItem(k));

      // 3. Logout and redirect
      if (onLogout) await onLogout();
      navigate('/login');
    } catch (err) {
      showToast('Error deleting account: ' + err.message, 'error');
      setDeleteLoading(false);
    }
  };

  const saveLanguage = (code) => {
    setLanguage(code);
    changeLanguage(code); // updates global context → whole app re-renders in new language
    showToast(t('success') + ' — ' + { en: '🇬🇧 English', te: '🇮🇳 Telugu', hi: '🇮🇳 Hindi', eu: '🇪🇺 Español' }[code]);
  };

  const maxUsage = Math.max(...usageData.map(d => d.mins), 60);

  const sections = [
    { id: 'credentials', icon: User,      label: t('loginCredentials') },
    { id: 'website',     icon: Mail,      label: t('websiteMail') },
    { id: 'general',     icon: Settings,  label: t('general') },
    { id: 'language',    icon: Globe,     label: t('languages') },
    { id: 'time',        icon: Clock,     label: t('timeManagement') },
    { id: 'password',    icon: Lock,      label: t('changePassword') },
    { id: 'delete',      icon: Trash2,    label: 'Delete Account' },
    { id: 'about',       icon: Info,      label: t('aboutMediVault') },
  ];

  return (
    <div className="settings-root">
      {toast && (
        <div className={`settings-toast settings-toast-${toast.type}`}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="settings-header">
        <button className="settings-back-btn" onClick={() => navigate('/dashboard')}>
          <ChevronLeft size={18} /> Dashboard
        </button>
        <div className="settings-title-wrap">
          <div className="settings-title-icon"><Settings size={22} /></div>
          <h1 className="settings-title">Settings</h1>
        </div>
      </div>

      <div className="settings-layout">
        {/* Sidebar */}
        <aside className="settings-sidebar">
          {sections.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`settings-nav-item ${activeSection === id ? 'active' : ''}`}
              onClick={() => setActiveSection(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={14} className="settings-nav-arrow" />
            </button>
          ))}
        </aside>

        {/* Content */}
        <main className="settings-content">

          {/* ── LOGIN CREDENTIALS ── */}
          {activeSection === 'credentials' && (
            <div className="settings-section">
              <h2 className="settings-section-title"><User size={20} /> Login Credentials</h2>
              <div className="settings-card">
                <div className="settings-field">
                  <label>Username</label>
                  <div className="settings-field-value">
                    <User size={16} /> {user?.username || 'N/A'}
                  </div>
                </div>
                <div className="settings-field">
                  <label>Email Address</label>
                  <div className="settings-field-value">
                    <Mail size={16} /> {user?.email || 'N/A'}
                  </div>
                </div>
                <div className="settings-field">
                  <label>User ID</label>
                  <div className="settings-field-value">
                    <Shield size={16} /> #MV-{String(user?.id || 1).padStart(4, '0')}
                  </div>
                </div>
                <div className="settings-field">
                  <label>Account Role</label>
                  <div className="settings-field-value">
                    <Key size={16} /> {user?.role || 'Patient'}
                  </div>
                </div>
                <div className="settings-field">
                  <label>Login Status</label>
                  <div className="settings-field-value" style={{ color: '#10b981' }}>
                    <span className="settings-status-dot" /> Active Session
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── WEBSITE & MAIL ── */}
          {activeSection === 'website' && (
            <div className="settings-section">
              <h2 className="settings-section-title"><Mail size={20} /> Website & Mail Details</h2>
              <div className="settings-card">
                <div className="settings-field">
                  <label>Application Name</label>
                  <div className="settings-field-value">🏥 MediVault — Personal Health Portal</div>
                </div>
                <div className="settings-field">
                  <label>Support Email</label>
                  <div className="settings-field-value"><Mail size={16} /> support@medivault.health</div>
                </div>
                <div className="settings-field">
                  <label>Website URL</label>
                  <div className="settings-field-value">🌐 https://medivault.health</div>
                </div>
                <div className="settings-field">
                  <label>Version</label>
                  <div className="settings-field-value">📦 v2.5.0 — Stable Release</div>
                </div>
                <div className="settings-field">
                  <label>Data Storage</label>
                  <div className="settings-field-value">🔐 Firebase Firestore (Encrypted)</div>
                </div>
                <div className="settings-field">
                  <label>Privacy Policy</label>
                  <button className="settings-link-btn" onClick={() => navigate('/privacy-policy')}>
                    View Privacy Policy <ChevronRight size={14} />
                  </button>
                </div>
                <div className="settings-field">
                  <label>Terms of Service</label>
                  <button className="settings-link-btn" onClick={() => navigate('/terms')}>
                    View Terms <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── GENERAL ── */}
          {activeSection === 'general' && (
            <div className="settings-section">
              <h2 className="settings-section-title"><Settings size={20} /> General Settings</h2>

              {/* Dark Mode */}
              <div className="settings-card">
                <div className="settings-toggle-row">
                  <div className="settings-toggle-info">
                    <div className="settings-toggle-icon" style={{ background: '#1e293b' }}>
                      {theme === 'dark' ? <Moon size={18} color="#f59e0b" /> : <Sun size={18} color="#f59e0b" />}
                    </div>
                    <div>
                      <div className="settings-toggle-label">Dark Mode</div>
                      <div className="settings-toggle-desc">Switch between light and dark themes</div>
                    </div>
                  </div>
                  <div className={`settings-switch ${theme === 'dark' ? 'on' : ''}`} onClick={toggleTheme}>
                    <div className="settings-switch-knob" />
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="settings-card">
                <div className="settings-toggle-row">
                  <div className="settings-toggle-info">
                    <div className="settings-toggle-icon" style={{ background: '#4f46e5' }}>
                      <Bell size={18} color="white" />
                    </div>
                    <div>
                      <div className="settings-toggle-label">Notifications</div>
                      <div className="settings-toggle-desc">Enable browser push notifications for reminders</div>
                    </div>
                  </div>
                  <div className={`settings-switch ${notificationsEnabled ? 'on' : ''}`} onClick={() => {
                    const v = !notificationsEnabled;
                    setNotificationsEnabled(v);
                    localStorage.setItem('mv_notifications', String(v));
                    showToast(v ? 'Notifications enabled' : 'Notifications disabled');
                  }}>
                    <div className="settings-switch-knob" />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="settings-card">
                <div className="settings-toggle-row">
                  <div className="settings-toggle-info">
                    <div className="settings-toggle-icon" style={{ background: '#10b981' }}>
                      <MapPin size={18} color="white" />
                    </div>
                    <div>
                      <div className="settings-toggle-label">Location Access</div>
                      <div className="settings-toggle-desc">Allow location for weather and nearby hospitals</div>
                    </div>
                  </div>
                  <div className={`settings-switch ${locationEnabled ? 'on' : ''}`} onClick={() => {
                    const v = !locationEnabled;
                    setLocationEnabled(v);
                    localStorage.setItem('mv_location', String(v));
                    showToast(v ? 'Location access enabled' : 'Location access disabled');
                  }}>
                  </div>
                </div>
              </div>

              {/* Global Volume */}
              <div className="settings-card">
                <div className="settings-toggle-row">
                  <div className="settings-toggle-info" style={{ width: '100%' }}>
                    <div className="settings-toggle-icon" style={{ background: '#3b82f6' }}>
                      <Volume2 size={18} color="white" />
                    </div>
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                      <div className="settings-toggle-label">Website Sound</div>
                      <div className="settings-toggle-desc">Adjust the volume for alarms, alerts, and background music</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.8rem' }}>
                        <input 
                          type="range" 
                          min="0" max="1" step="0.05" 
                          value={globalVolume}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setGlobalVolume(v);
                            localStorage.setItem('mv_global_volume', v.toString());
                            window.dispatchEvent(new CustomEvent('mv_volume_change', { detail: v }));
                            
                            // Play a tiny preview sound so user knows the volume
                            const audio = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3');
                            audio.volume = v;
                            audio.play().catch(()=>{});
                          }}
                          style={{ flex: 1, accentColor: '#3b82f6' }}
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', width: '40px' }}>
                          {Math.round(globalVolume * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Change Password option inside General Settings */}
              <div className="settings-card" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <div className="settings-toggle-icon" style={{ background: '#4f46e5', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={18} color="white" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Change Password</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Change your account password securely using mobile OTP verification</p>
                  </div>
                </div>

                <div className="settings-pw-step">
                  <div className="settings-pw-step-num" style={{ background: otpSent ? '#10b981' : '#4f46e5' }}>
                    {otpSent ? <Check size={16} /> : '1'}
                  </div>
                  <div className="settings-pw-step-content">
                    <label>Mobile Number</label>
                    <div className="settings-otp-row">
                      <div className="settings-input-wrap">
                        <Phone size={16} />
                        <input
                          type="tel"
                          placeholder="+91 9876543210"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          disabled={otpSent}
                          className="settings-input"
                        />
                      </div>
                      {!otpSent ? (
                        <button className="settings-otp-btn" onClick={handleSendOtp}>Send OTP</button>
                      ) : (
                        <button className="settings-otp-btn resend" onClick={() => { setOtpSent(false); setOtpVerified(false); }}>Resend</button>
                      )}
                    </div>
                  </div>
                </div>

                {otpSent && (
                  <div className="settings-pw-step">
                    <div className="settings-pw-step-num" style={{ background: otpVerified ? '#10b981' : '#f59e0b' }}>
                      {otpVerified ? <Check size={16} /> : '2'}
                    </div>
                    <div className="settings-pw-step-content">
                      <label>Enter OTP</label>
                      <div className="settings-otp-row">
                        <div className="settings-input-wrap">
                          <Smartphone size={16} />
                          <input
                            type="text"
                            placeholder="6-digit OTP"
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            disabled={otpVerified}
                            maxLength={6}
                            className="settings-input"
                          />
                        </div>
                        {!otpVerified && (
                          <button className="settings-otp-btn verify" onClick={handleVerifyOtp}>Verify</button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {otpVerified && (
                  <div className="settings-pw-step">
                    <div className="settings-pw-step-num" style={{ background: '#4f46e5' }}>3</div>
                    <div className="settings-pw-step-content">
                      <label>New Password</label>
                      <div className="settings-input-wrap" style={{ marginBottom: '0.8rem' }}>
                        <Lock size={16} />
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          placeholder="New password (min 6 chars)"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="settings-input"
                        />
                        <button className="settings-eye-btn" onClick={() => setShowNewPass(v => !v)}>
                          {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <label>Confirm Password</label>
                      <div className="settings-input-wrap">
                        <Lock size={16} />
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="settings-input"
                        />
                        <button className="settings-eye-btn" onClick={() => setShowConfirmPass(v => !v)}>
                          {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button
                        className="settings-save-pw-btn"
                        onClick={handleChangePassword}
                        disabled={pwLoading}
                        style={{ opacity: pwLoading ? 0.7 : 1 }}
                      >
                        {pwLoading ? <span className="settings-spinner" /> : <Lock size={16} />}
                        {pwLoading ? 'Saving…' : 'Save New Password'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Danger Zone: Delete Account option inside General Settings */}
              <div className="settings-card settings-danger-card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(239, 68, 68, 0.15)', paddingBottom: '0.75rem' }}>
                  <div className="settings-toggle-icon" style={{ background: '#ef4444', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={18} color="white" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: '#e11d48' }}>Danger Zone</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Irreversible actions like permanent account deletion</p>
                  </div>
                </div>

                {deleteStep === 0 && (
                  <div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                      Permanently delete your MediVault account, registered profile details, medications, documents, and calendar entries. All synced medical metadata will be securely erased.
                    </p>
                    <button
                      className="settings-delete-trigger-btn"
                      onClick={() => setDeleteStep(1)}
                    >
                      <Trash2 size={16} /> I want to delete my account
                    </button>
                  </div>
                )}

                {deleteStep === 1 && (
                  <div className="settings-delete-confirm-card">
                    <p className="settings-delete-confirm-msg">
                      ⚠️ WARNING: This action is permanent and cannot be undone. To confirm deletion, type <span style={{ color: '#ef4444', textDecoration: 'underline' }}>DELETE</span> below:
                    </p>
                    <div className="settings-input-wrap">
                      <Trash2 size={16} style={{ color: '#ef4444' }} />
                      <input
                        type="text"
                        className="settings-input settings-delete-input"
                        placeholder="Type DELETE here"
                        value={deleteConfirmText}
                        onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                        autoFocus
                      />
                    </div>
                    <div className="settings-delete-btn-row">
                      <button
                        className="settings-delete-cancel-btn"
                        onClick={() => { setDeleteStep(0); setDeleteConfirmText(''); }}
                      >
                        <X size={15} /> Cancel
                      </button>
                      <button
                        className="settings-delete-confirm-btn"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                      >
                        {deleteLoading ? <span className="settings-spinner" /> : <Trash2 size={15} />}
                        {deleteLoading ? 'Deleting…' : 'Permanently Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── LANGUAGES ── */}
          {activeSection === 'language' && (
            <div className="settings-section">
              <h2 className="settings-section-title"><Globe size={20} /> {t('languages')}</h2>
              <p className="settings-desc">{t('languageDesc')}</p>
              <div className="settings-lang-grid">
                {[
                  { code: 'en', name: t('langEnglish'), native: 'English', flag: '🇬🇧', activeBg: 'linear-gradient(135deg,#4f46e5,#6366f1)' },
                  { code: 'te', name: t('langTelugu'), native: 'తెలుగు', flag: '🇮🇳', activeBg: 'linear-gradient(135deg,#f59e0b,#f97316)' },
                  { code: 'hi', name: t('langHindi'), native: 'हिंदी', flag: '🇮🇳', activeBg: 'linear-gradient(135deg,#10b981,#059669)' },
                  { code: 'eu', name: t('langEuropean'), native: 'Español / Français', flag: '🇪🇺', activeBg: 'linear-gradient(135deg,#0ea5e9,#06b6d4)' },
                ].map(l => {
                  const isActive = language === l.code;
                  return (
                    <button
                      key={l.code}
                      className={`settings-lang-card ${isActive ? 'active' : ''}`}
                      onClick={() => saveLanguage(l.code)}
                      style={isActive ? { background: l.activeBg, borderColor: 'transparent', color: 'white', transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' } : {}}
                    >
                      <span className="settings-lang-flag" style={{ fontSize: '2.2rem' }}>{l.flag}</span>
                      <span className="settings-lang-name" style={{ color: isActive ? 'white' : 'var(--text-main)', fontWeight: 800 }}>{l.name}</span>
                      <span className="settings-lang-native" style={{ color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)', fontSize: '0.8rem' }}>{l.native}</span>
                      {isActive && (
                        <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:24, height:24, borderRadius:'50%', background:'rgba(255,255,255,0.25)', marginTop:'4px' }}>
                          <Check size={14} color="white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="settings-card" style={{ marginTop: '1.5rem' }}>
                <div className="settings-field">
                  <label>{t('currentLanguage')}</label>
                  <div className="settings-field-value" style={{ color: '#4f46e5', fontWeight: 700, fontSize:'1.1rem' }}>
                    {{ en: '🇬🇧 English', te: '🇮🇳 తెలుగు', hi: '🇮🇳 हिंदी', eu: '🇪🇺 Español' }[language]}
                  </div>
                </div>
                <div style={{ marginTop:'0.75rem', padding:'0.75rem', background:'rgba(79,70,229,0.06)', borderRadius:'10px', border:'1px solid rgba(79,70,229,0.1)', fontSize:'0.85rem', color:'var(--text-muted)' }}>
                  ✅ {language === 'en' ? 'Language applied — the entire interface is now in English.' :
                     language === 'te' ? 'భాష వర్తించబడింది — మొత్తం ఇంటర్‌ఫేస్ తెలుగులో ఉంది.' :
                     language === 'hi' ? 'भाषा लागू की गई — संपूर्ण इंटरफ़ेस हिंदी में है।' :
                     'Idioma aplicado — toda la interfaz está en Español.'}
                </div>
              </div>
            </div>
          )}

          {/* ── TIME MANAGEMENT ── */}
          {activeSection === 'time' && (
            <div className="settings-section">
              <h2 className="settings-section-title"><BarChart2 size={20} /> Time Management</h2>
              <p className="settings-desc">Track how much time you spend on MediVault each day.</p>

              <div className="settings-time-stats">
                <div className="settings-time-stat">
                  <span className="settings-time-val">{weeklyTotal}</span>
                  <span className="settings-time-lbl">Mins This Week</span>
                </div>
                <div className="settings-time-stat">
                  <span className="settings-time-val">{usageData.length > 0 ? Math.round(weeklyTotal / 7) : 0}</span>
                  <span className="settings-time-lbl">Daily Average</span>
                </div>
                <div className="settings-time-stat">
                  <span className="settings-time-val">{usageData.reduce((max, d) => d.mins > max ? d.mins : max, 0)}</span>
                  <span className="settings-time-lbl">Peak Day (Mins)</span>
                </div>
              </div>

              <div className="settings-card">
                <h3 className="settings-chart-title">📊 Weekly Usage Graph</h3>
                <div className="settings-chart">
                  {usageData.map((d, i) => {
                    const pct = maxUsage > 0 ? (d.mins / maxUsage) * 100 : 0;
                    const isToday = i === usageData.length - 1;
                    return (
                      <div key={i} className="settings-bar-group">
                        <div className="settings-bar-tooltip">{d.mins ? `${d.mins}m` : '–'}</div>
                        <div className="settings-bar-outer">
                          <div
                            className={`settings-bar-inner ${isToday ? 'today' : ''}`}
                            style={{ height: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                        <span className="settings-bar-label">{d.day}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="settings-chart-legend">
                  <span className="settings-leg today" /> Today &nbsp;
                  <span className="settings-leg" /> Previous Days
                </div>
              </div>

              <div className="settings-card" style={{ marginTop: '1rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>Daily Breakdown</h3>
                {usageData.map((d, i) => (
                  <div key={i} className="settings-day-row">
                    <span className="settings-day-name">{d.date}</span>
                    <div className="settings-day-bar-wrap">
                      <div className="settings-day-bar" style={{ width: `${maxUsage > 0 ? (d.mins / maxUsage) * 100 : 0}%` }} />
                    </div>
                    <span className="settings-day-val">{d.mins ? `${d.mins} min` : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CHANGE PASSWORD ── */}
          {activeSection === 'password' && (
            <div className="settings-section">
              <h2 className="settings-section-title"><Lock size={20} /> Change Password</h2>
              <p className="settings-desc">Enter your mobile number, verify via OTP, then set a new password. The new password will be saved and used for your next login.</p>

              <div className="settings-card">
                {/* Step 1 — Phone */}
                <div className="settings-pw-step">
                  <div className="settings-pw-step-num" style={{ background: otpSent ? '#10b981' : '#4f46e5' }}>
                    {otpSent ? <Check size={16} /> : '1'}
                  </div>
                  <div className="settings-pw-step-content">
                    <label>Mobile Number</label>
                    <div className="settings-otp-row">
                      <div className="settings-input-wrap">
                        <Phone size={16} />
                        <input
                          type="tel"
                          placeholder="+91 9876543210"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          disabled={otpSent}
                          className="settings-input"
                        />
                      </div>
                      {!otpSent ? (
                        <button className="settings-otp-btn" onClick={handleSendOtp}>Send OTP</button>
                      ) : (
                        <button className="settings-otp-btn resend" onClick={() => { setOtpSent(false); setOtpVerified(false); }}>Resend</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 2 — OTP */}
                {otpSent && (
                  <div className="settings-pw-step">
                    <div className="settings-pw-step-num" style={{ background: otpVerified ? '#10b981' : '#f59e0b' }}>
                      {otpVerified ? <Check size={16} /> : '2'}
                    </div>
                    <div className="settings-pw-step-content">
                      <label>Enter OTP</label>
                      <div className="settings-otp-row">
                        <div className="settings-input-wrap">
                          <Smartphone size={16} />
                          <input
                            type="text"
                            placeholder="6-digit OTP"
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            disabled={otpVerified}
                            maxLength={6}
                            className="settings-input"
                          />
                        </div>
                        {!otpVerified && (
                          <button className="settings-otp-btn verify" onClick={handleVerifyOtp}>Verify</button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3 — New Password */}
                {otpVerified && (
                  <div className="settings-pw-step">
                    <div className="settings-pw-step-num" style={{ background: '#4f46e5' }}>3</div>
                    <div className="settings-pw-step-content">
                      <label>New Password</label>
                      <div className="settings-input-wrap" style={{ marginBottom: '0.8rem' }}>
                        <Lock size={16} />
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          placeholder="New password (min 6 chars)"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="settings-input"
                        />
                        <button className="settings-eye-btn" onClick={() => setShowNewPass(v => !v)}>
                          {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <label>Confirm Password</label>
                      <div className="settings-input-wrap">
                        <Lock size={16} />
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="settings-input"
                        />
                        <button className="settings-eye-btn" onClick={() => setShowConfirmPass(v => !v)}>
                          {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button
                        className="settings-save-pw-btn"
                        onClick={handleChangePassword}
                        disabled={pwLoading}
                        style={{ opacity: pwLoading ? 0.7 : 1 }}
                      >
                        {pwLoading ? <span className="settings-spinner" /> : <Lock size={16} />}
                        {pwLoading ? 'Saving…' : 'Save New Password'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DELETE ACCOUNT ── */}
          {activeSection === 'delete' && (
            <div className="settings-section">
              <h2 className="settings-section-title" style={{ color: '#ef4444' }}>
                <Trash2 size={20} /> Delete Account
              </h2>
              <p className="settings-desc">
                Permanently delete your MediVault account and all associated data. <strong>This action cannot be undone.</strong>
              </p>

              {/* Warning card */}
              <div className="settings-card settings-delete-warn-card">
                <div className="settings-delete-warn-icon">
                  <AlertTriangle size={28} color="#f59e0b" />
                </div>
                <h3 className="settings-delete-warn-title">What will be deleted:</h3>
                <ul className="settings-delete-list">
                  <li>🔐 Your login credentials (username, email, password)</li>
                  <li>🧬 All personal &amp; medical profile data</li>
                  <li>💊 Tablet reminders and medication schedules</li>
                  <li>📁 Medical slips and uploaded documents</li>
                  <li>📅 Health calendar events and appointments</li>
                  <li>💧 Hydration, diet, and lifestyle tracking data</li>
                  <li>⚙️ All settings and preferences</li>
                </ul>
              </div>

              {/* Step 1 — Click delete */}
              {deleteStep === 0 && (
                <div className="settings-card" style={{ marginTop: '1.5rem' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Account: <strong style={{ color: 'var(--text-main)' }}>{user?.email || user?.username}</strong>
                  </p>
                  <button
                    className="settings-delete-trigger-btn"
                    onClick={() => setDeleteStep(1)}
                  >
                    <Trash2 size={16} /> I want to delete my account
                  </button>
                </div>
              )}

              {/* Step 2 — Type DELETE to confirm */}
              {deleteStep === 1 && (
                <div className="settings-card settings-delete-confirm-card">
                  <p className="settings-delete-confirm-msg">
                    To confirm, type <strong>DELETE</strong> in the box below:
                  </p>
                  <div className="settings-input-wrap">
                    <Trash2 size={16} style={{ color: '#ef4444' }} />
                    <input
                      type="text"
                      className="settings-input settings-delete-input"
                      placeholder="Type DELETE here"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                      autoFocus
                    />
                  </div>
                  <div className="settings-delete-btn-row">
                    <button
                      className="settings-delete-cancel-btn"
                      onClick={() => { setDeleteStep(0); setDeleteConfirmText(''); }}
                    >
                      <X size={15} /> Cancel
                    </button>
                    <button
                      className="settings-delete-confirm-btn"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                    >
                      {deleteLoading ? <span className="settings-spinner" /> : <Trash2 size={15} />}
                      {deleteLoading ? 'Deleting…' : 'Permanently Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ABOUT ── */}
          {activeSection === 'about' && (
            <div className="settings-section">
              <h2 className="settings-section-title"><Info size={20} /> About MediVault</h2>
              <div className="settings-about-hero">
                <div className="settings-about-logo">🏥</div>
                <h3 className="settings-about-name">MediVault</h3>
                <p className="settings-about-tagline">Your Complete Personal Health Management Portal</p>
                <span className="settings-about-version">Version 2.5.0</span>
              </div>
              <div className="settings-card">
                <h3 style={{ fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)' }}>📋 What is MediVault?</h3>
                <p className="settings-about-text">
                  MediVault is a comprehensive personal health management portal that allows patients and individuals to securely store, manage, and track all their health-related data in one place.
                </p>
              </div>
              <div className="settings-steps-list">
                {[
                  { step: '1', icon: '📁', title: 'Medical Slips', desc: 'Upload and manage all your medical reports, scans, and prescriptions securely.' },
                  { step: '2', icon: '💊', title: 'Tablet Reminders', desc: 'Set smart alarm reminders to never miss your medication timings.' },
                  { step: '3', icon: '🥗', title: 'Diet Plan', desc: 'Access personalized diet plans for gym, weight gain, and weight loss goals.' },
                  { step: '4', icon: '💧', title: 'Hydration Tracker', desc: 'Monitor daily water intake and get smart fruit juice recommendations.' },
                  { step: '5', icon: '🧘', title: 'Yoga Sessions', desc: 'Follow guided yoga routines across multiple difficulty levels.' },
                  { step: '6', icon: '📅', title: 'Health Calendar', desc: 'Track medical appointments, medication schedules, and health milestones.' },
                  { step: '7', icon: '🩺', title: 'Consultations', desc: 'Manage doctor consultation records and patient notes efficiently.' },
                  { step: '8', icon: '🌡️', title: 'Temperature Alert', desc: 'Track live ambient temperature using geolocation, plot real-time weather graphs, and receive automatic sounding notifications for extreme heat (>40°C) or cold (<17°C) with instant hydration tips.' },
                ].map(item => (
                  <div key={item.step} className="settings-step-card">
                    <div className="settings-step-num">{item.step}</div>
                    <div className="settings-step-icon">{item.icon}</div>
                    <div>
                      <div className="settings-step-title">{item.title}</div>
                      <div className="settings-step-desc">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="settings-card" style={{ marginTop: '1.5rem' }}>
                <div className="settings-field"><label>Developer</label><div className="settings-field-value">👨‍💻 Saimanideep</div></div>
                <div className="settings-field"><label>Framework</label><div className="settings-field-value">⚛️ React + Vite</div></div>
                <div className="settings-field"><label>Backend</label><div className="settings-field-value">🔥 Firebase Firestore</div></div>
                <div className="settings-field"><label>License</label><div className="settings-field-value">📄 MIT License</div></div>
              </div>
            </div>
          )}
        </main>
      </div>
      <SectionAbout
        title="Settings & System Configuration"
        icon="⚙️"
        color="#4b5563"
        gradient="linear-gradient(135deg, #9ca3af, #4b5563)"
        what="The Settings & System Configuration panel is the centralized control hub for your MediVault application. It allows you to customize your security credentials, manage real-time audible notifications, configure localized weather tracking, toggle system themes (Light and Dark mode), and explore structural information about the platform's architectural design and developers."
        howToUse={[
          'Open the Settings page from the sidebar menu at the bottom-left of your dashboard.',
          'Browse the Settings sub-navigation options on the left: Credentials, Notifications, Language, System Theme, or About MediVault.',
          'Under the "Credentials" section, review or edit your registered full name, profile picture, or update your password securely.',
          'Click "Update Profile" or "Change Password" to submit the form and commit updates to database storage.',
          'Under the "Notifications" tab, toggle audible alarms (sirens) for critical values on/off.',
          'Adjust the global volume slider to control alert loudness or use the visual Mute toggle.',
          'Under the "Language" tab, select your preferred language (English, Telugu, Hindi, Spanish) to translate the UI.',
          'Under the "System Theme" tab, select "Light Mode" or "Dark Mode" to update the application\'s visual palette immediately.',
          'Click the "Delete Account" button under security settings only if you wish to permanently erase your records.',
          'Under the "About MediVault" section, read the full step-by-step feature walkthrough to understand the features of the app.',
          'Observe the developer notes, licensing files, and tech stack details at the bottom of the About section.',
          'Always log out securely using the sidebar logout button when using MediVault on shared public devices.',
        ]}
        importance={[
          'Provides robust control over your personal authentication credentials, protecting confidential medical data.',
          'Allows customization of sound alerts to ensure you hear high-priority alarms in high-noise environments.',
          'Volume adjustments and silencing toggles ensure the app can be run politely in office or quiet settings.',
          'Multi-language translation supports a diverse patient pool, ensuring anyone can understand health insights.',
          'System Theme toggles enable a high-contrast dark theme, significantly reducing eye strain during night monitoring.',
          'Secure profile updates make sure your contact numbers and emergency markers remain current and active.',
          'Detailed developer profiles build trust by explaining the technologies, libraries, and open-source licenses used.',
          'Firestore real-time syncing options guarantee your settings remain identical across mobile and desktop devices.',
          'Step-by-step guides inside Settings prevent confusion, serving as a comprehensive user manual.',
          'Gives patients total sovereignty over their records by incorporating account deletion safety switches.',
        ]}
      />
    </div>
  );
}
