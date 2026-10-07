import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Stethoscope, Lock, Unlock, Flame, Droplets,
  Utensils, Activity, TrendingUp, MessageCircle, Star, Send,
  AlertCircle, CheckCircle2, Edit3, Save, X, Brain, Target, User, Shield, Search, LayoutDashboard
} from 'lucide-react';
import './Consultation.css';
import { getShortPatientId, findUserByIdentifier, verifyPassword, getUsers } from '../utils/localAuth';
import PatientLoginModal from '../components/PatientLoginModal';

// ── Predefined doctor accounts (stored in localStorage too) ─────────────────
const DEFAULT_DOCTORS = [
  { id: 'DR001', name: 'Dr. Sharma', username: 'drsharma', password: 'Doctor@123' },
  { id: 'DR002', name: 'Dr. Priya', username: 'drpriya', password: 'Priya@456' },
  { id: 'DR003', name: 'Dr. Rajesh', username: 'drrajesh', password: 'Rajesh@789' },
  { id: 'DR004', name: 'Dr. Sterling', username: 'drsterling', password: 'Doctor@123' },
];

function getDoctors() {
  try {
    const saved = JSON.parse(localStorage.getItem('consult_doctor_accounts') || 'null');
    if (saved && Array.isArray(saved) && saved.length) {
      let changed = false;
      DEFAULT_DOCTORS.forEach(def => {
        if (!saved.some(d => d.username.toLowerCase() === def.username.toLowerCase())) {
          saved.push(def);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('consult_doctor_accounts', JSON.stringify(saved));
      }
      return saved;
    }
  } catch {}
  localStorage.setItem('consult_doctor_accounts', JSON.stringify(DEFAULT_DOCTORS));
  return DEFAULT_DOCTORS;
}

// ── helpers ──────────────────────────────────────────────────────────────────
function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function getPatientData(user) {
  const water     = readLS(user?.id ? `medivault_water_${user.id}` : 'medivault_water', {});
  const todayKey  = new Date().toLocaleDateString('en-CA');
  const waterToday = water[todayKey]?.total || 0;
  const waterTarget = water.target || 2500;
  const waterHistory = water.history || {};
  const waterStreak = (() => {
    let s = 0;
    for (const [, v] of Object.entries(waterHistory).sort(([a],[b]) => b.localeCompare(a))) {
      if ((v.total||0) >= (v.target||waterTarget)) s++; else break;
    }
    return s;
  })();

  // Check and reset Level 1 and Level 2 if daily reset date is different
  const today = new Date().toLocaleDateString('en-CA');
  const lastReset = localStorage.getItem(user?.id ? `yoga_last_reset_date_${user.id}` : 'yoga_last_reset_date');
  let completedVideos = readLS(user?.id ? `yoga_completed_videos_${user.id}` : 'yoga_completed_videos', {});
  if (!lastReset) {
    localStorage.setItem(user?.id ? `yoga_last_reset_date_${user.id}` : 'yoga_last_reset_date', today);
  } else if (lastReset !== today) {
    let changed = false;
    Object.keys(completedVideos).forEach(key => {
      if (key.startsWith('l1') || key.startsWith('l2')) {
        delete completedVideos[key];
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem(user?.id ? `yoga_completed_videos_${user.id}` : 'yoga_completed_videos', JSON.stringify(completedVideos));
    }
    localStorage.setItem(user?.id ? `yoga_last_reset_date_${user.id}` : 'yoga_last_reset_date', today);
    localStorage.removeItem(user?.id ? `yoga_l1_completion_time_${user.id}` : 'yoga_l1_completion_time');
    localStorage.removeItem(user?.id ? `yoga_l2_completion_time_${user.id}` : 'yoga_l2_completion_time');
  }

  const yogaStreak      = parseInt(localStorage.getItem(user?.id ? `yoga_day_streaks_${user.id}` : 'yoga_day_streaks') || '0', 10);
  const yogaDate        = localStorage.getItem(user?.id ? `yoga_last_streak_date_${user.id}` : 'yoga_last_streak_date') || '—';
  const level1Done = ['l1v1','l1v2','l1v3','l1v4'].filter(id => completedVideos[id]).length;
  const level2Done = ['l2v1','l2v2','l2v3','l2v4'].filter(id => completedVideos[id]).length;

  const dietSchedule  = readLS(user?.id ? `medivault_diet_timetable_${user.id}` : 'medivault_diet_timetable', []);
  const savedCalories = parseFloat(localStorage.getItem(user?.id ? `mv_saved_calories_${user.id}` : 'mv_saved_calories') || '0');
  const savedProtein  = parseFloat(localStorage.getItem(user?.id ? `mv_saved_protein_${user.id}` : 'mv_saved_protein')  || '0');
  const savedItems    = readLS(user?.id ? `mv_saved_items_${user.id}` : 'mv_saved_items', []);

  return { waterToday, waterTarget, waterStreak, yogaStreak, yogaDate, level1Done, level2Done, dietSchedule, savedCalories, savedProtein, savedItems };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Consultation({ user }) {
  const navigate = useNavigate();

  const isDoctorUser = Boolean(
    user?.isDoctor ||
    user?.role === 'doctor' ||
    (user?.username && user.username.toLowerCase().startsWith('dr')) ||
    (user?.displayName && user.displayName.toLowerCase().startsWith('dr')) ||
    (() => {
      try {
        const uid = user?.id || user?.uid;
        if (!uid) return false;
        const pd = JSON.parse(localStorage.getItem(`medivault_personal_details_${uid}`) || '{}');
        return pd?.role === 'doctor' || pd?.isDoctor === true;
      } catch { return false; }
    })()
  );

  const getMatchedDoctor = () => {
    if (!user) return null;
    const doctors = getDoctors();
    const uname = (user.username || '').toLowerCase();
    const dname = (user.displayName || '').toLowerCase();
    return doctors.find(
      d => d.username.toLowerCase() === uname ||
           d.name.toLowerCase() === dname ||
           d.username.toLowerCase() === dname.replace(/[^a-z0-9]/g, '')
    ) || {
      id: 'DR-' + (user.id || '001'),
      name: user.displayName || user.username || 'Dr. Sterling',
      username: user.username || 'drsterling',
    };
  };

  // Synchronous initialization based on existing session
  const [loggedIn, setLoggedIn]   = useState(() => Boolean(user?.id || user?.uid));
  const [loginRole, setLoginRole] = useState(() => isDoctorUser ? 'doctor' : 'user');
  const [loginMode, setLoginMode] = useState('user');
  const [chatMode, setChatMode]   = useState(() => isDoctorUser ? 'doctor' : 'patient');
  const [doctorObj, setDoctorObj] = useState(() => {
    if (isDoctorUser) return getMatchedDoctor();
    if (user?.id) {
      return {
        name: user.displayName || user.username || 'Patient',
        patientId: `#MV-${getShortPatientId(user.id)}`,
        username: user.username,
        id: user.id
      };
    }
    return null;
  });
  const [doctorId, setDoctorId]   = useState(() => isDoctorUser ? (user?.displayName || user?.username || 'Dr. Sterling') : '');
  const [registeredPatients, setRegisteredPatients] = useState([]);
  const [activePatientUser, setActivePatientUser] = useState(() => {
    if (!isDoctorUser && user?.id) {
      return {
        ...user,
        shortId: `#MV-${getShortPatientId(user.id)}`,
        displayName: user.displayName || user.username
      };
    }
    try {
      const savedUid = sessionStorage.getItem('consult_active_patient_uid');
      if (savedUid) {
        const allUsers = getUsers();
        const found = allUsers.find(u => (u.uid || u.id) === savedUid);
        if (found) {
          const targetUid = found.uid || found.id;
          let pFullName = found.displayName || found.username;
          try {
            const pdRaw = localStorage.getItem(`medivault_personal_details_${targetUid}`);
            if (pdRaw) {
              const pd = JSON.parse(pdRaw);
              if (pd.fullName) pFullName = pd.fullName;
              else if (pd.firstName) pFullName = `${pd.firstName} ${pd.lastName || ''}`.trim();
            }
          } catch {}
          return {
            ...found,
            id: targetUid,
            uid: targetUid,
            displayName: pFullName || 'Patient',
            shortId: `#MV-${getShortPatientId(targetUid)}`
          };
        }
      }
    } catch {}
    return null;
  });

  const [activeTab, setActiveTab] = useState(() => {
    if (isDoctorUser) {
      try {
        const savedUid = sessionStorage.getItem('consult_active_patient_uid');
        if (savedUid) return 'overview';
      } catch {}
      return 'patient-login';
    }
    return 'overview';
  });

  const [patientIdInput, setPatientIdInput] = useState(() => {
    if (activePatientUser?.shortId) return activePatientUser.shortId;
    if (user?.id && !isDoctorUser) return `#MV-${getShortPatientId(user.id)}`;
    return '';
  });
  const [doctorPatientInput, setDoctorPatientInput] = useState('');
  const [password, setPassword]   = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Load patient records helper
  const loadPatient = (patientUserOrIdentifier) => {
    let matched = null;
    if (typeof patientUserOrIdentifier === 'object' && patientUserOrIdentifier !== null) {
      matched = patientUserOrIdentifier;
    } else if (patientUserOrIdentifier) {
      matched = findUserByIdentifier(patientUserOrIdentifier);
      if (!matched) {
        const clean = String(patientUserOrIdentifier).replace(/^#?MV[-_]?/i, '').toUpperCase();
        try {
          const allUsers = getUsers();
          matched = allUsers.find(u => {
            const sId = getShortPatientId(u.uid || u.id);
            return sId.toUpperCase() === clean || (u.username && u.username.toLowerCase() === String(patientUserOrIdentifier).toLowerCase());
          });
        } catch {}
      }
    }
    if (!matched) return false;

    const targetUid = matched.uid || matched.id;
    let pFullName = matched.displayName || matched.username;
    try {
      const pdRaw = localStorage.getItem(`medivault_personal_details_${targetUid}`);
      if (pdRaw) {
        const pd = JSON.parse(pdRaw);
        if (pd.fullName) pFullName = pd.fullName;
        else if (pd.firstName) pFullName = `${pd.firstName} ${pd.lastName || ''}`.trim();
      }
    } catch (_) {}

    const patientProfile = {
      ...matched,
      id: targetUid,
      uid: targetUid,
      displayName: pFullName || 'Patient',
      shortId: `#MV-${getShortPatientId(targetUid)}`,
    };

    try {
      sessionStorage.setItem('consult_active_patient_uid', targetUid);
    } catch (_) {}

    setActivePatientUser(patientProfile);
    setData(getPatientData(patientProfile));

    // Load patient-scoped notes and chat
    const patientUpdates = readLS(`consult_doctor_updates_${targetUid}`, readLS('consult_doctor_updates', {}));
    setUpdates(patientUpdates);

    const patientChat = readLS(`consult_chat_messages_${targetUid}`, readLS('consult_chat_messages', []));
    setMessages(patientChat);

    return true;
  };

  // Populate registered patients from localStorage
  useEffect(() => {
    try {
      const allUsers = getUsers();
      const patients = allUsers.filter(
        u => u.role !== 'doctor' &&
             !(u.username && u.username.toLowerCase().startsWith('dr')) &&
             !(u.displayName && u.displayName.toLowerCase().startsWith('dr'))
      );
      setRegisteredPatients(patients);
    } catch (_) {}
  }, [user, loggedIn]);

  // Auto-fill patient ID when user prop is available
  useEffect(() => {
    if (user?.id && !patientIdInput && !isDoctorUser) {
      setPatientIdInput(`#MV-${getShortPatientId(user.id)}`);
    }
  }, [user, isDoctorUser]);

  // Auto-authenticate session whenever user prop is available
  useEffect(() => {
    if (!user?.id && !user?.uid) return;

    if (isDoctorUser) {
      const matched = getMatchedDoctor();
      setDoctorObj(matched);
      setDoctorId(user.displayName || user.username);
      setLoginRole('doctor');
      setChatMode('doctor');
      setLoggedIn(true);

      // Check if session has a saved patient
      try {
        const savedUid = sessionStorage.getItem('consult_active_patient_uid');
        if (savedUid) {
          const allUsers = getUsers();
          const p = allUsers.find(u => (u.uid || u.id) === savedUid);
          if (p) {
            loadPatient(p);
            return;
          }
        }
      } catch (_) {}

      // If activeTab is 'overview' and no active patient, auto-load first registered patient
      if (activeTab === 'overview' && !activePatientUser) {
        try {
          const allUsers = getUsers();
          const patients = allUsers.filter(
            u => u.role !== 'doctor' &&
                 !(u.username && u.username.toLowerCase().startsWith('dr')) &&
                 !(u.displayName && u.displayName.toLowerCase().startsWith('dr'))
          );
          if (patients.length > 0) {
            loadPatient(patients[0]);
          }
        } catch (_) {}
      }
    } else {
      // Patient user: auto-authenticate into their own consultation data
      setLoginRole('user');
      setLoginMode('user');
      setChatMode('patient');
      setLoggedIn(true);
      const targetUid = user.id || user.uid;
      let pFullName = user.displayName || user.username;
      try {
        const pdRaw = localStorage.getItem(`medivault_personal_details_${targetUid}`);
        if (pdRaw) {
          const pd = JSON.parse(pdRaw);
          if (pd.fullName) pFullName = pd.fullName;
          else if (pd.firstName) pFullName = `${pd.firstName} ${pd.lastName || ''}`.trim();
        }
      } catch (_) {}
      const pProfile = {
        ...user,
        id: targetUid,
        uid: targetUid,
        displayName: pFullName,
        shortId: `#MV-${getShortPatientId(targetUid)}`
      };
      setActivePatientUser(pProfile);
      setDoctorObj({
        name: 'Dr. Sterling',
        role: 'Cardiology Specialist',
        patientId: `#MV-${getShortPatientId(targetUid)}`,
        username: 'drsterling',
        id: 'DR-004'
      });
      loadPatient(pProfile);
    }
  }, [user, isDoctorUser]);

  // patient data
  const [data, setData] = useState({});
  useEffect(() => {
    if (loggedIn) {
      setData(getPatientData(activePatientUser || user));
    }
  }, [loggedIn, activePatientUser, user]);

  // doctor updates per section
  const [updates, setUpdates] = useState(() => readLS('consult_doctor_updates', {}));
  const [editSection, setEditSection] = useState(null);
  const [editText, setEditText]       = useState('');

  const saveUpdate = (section) => {
    const next = { ...updates, [section]: { text: editText, date: new Date().toLocaleString(), doctor: doctorId } };
    setUpdates(next);
    const targetUid = activePatientUser?.uid || activePatientUser?.id;
    if (targetUid) {
      localStorage.setItem(`consult_doctor_updates_${targetUid}`, JSON.stringify(next));
    }
    localStorage.setItem('consult_doctor_updates', JSON.stringify(next));
    setEditSection(null);
  };

  // chat
  const [messages, setMessages] = useState(() => readLS('consult_chat_messages', []));
  const [chatInput, setChatInput] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const chatEndRef = useRef(null);

  const sendMsg = () => {
    if (!chatInput.trim()) return;
    const msg = {
      id: Date.now(), text: chatInput.trim(),
      sender: chatMode, important: isImportant,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString()
    };
    const next = [...messages, msg];
    setMessages(next);
    const targetUid = activePatientUser?.uid || activePatientUser?.id;
    if (targetUid) {
      localStorage.setItem(`consult_chat_messages_${targetUid}`, JSON.stringify(next));
    }
    localStorage.setItem('consult_chat_messages', JSON.stringify(next));
    setChatInput(''); setIsImportant(false);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeTab]);

  const handleLogin = async (e, targetDestination = 'consultation') => {
    if (e && e.preventDefault) e.preventDefault();
    setLoginError('');

    // Patient Login by Patient ID (Image 2)
    const inputVal = patientIdInput.trim();
    if (!inputVal) {
      setLoginError('Please enter your Patient ID.');
      return;
    }

    const allUsers = getUsers();
    const currentShortId = user?.id ? getShortPatientId(user.id) : '';
    const cleanInput = inputVal.replace(/^#?MV[-_]?/i, '').toUpperCase();

    let matched = findUserByIdentifier(inputVal);
    if (!matched && cleanInput) {
      matched = allUsers.find(u => {
        const sId = getShortPatientId(u.uid || u.id);
        return sId.toUpperCase() === cleanInput;
      });
    }
    if (!matched && cleanInput === currentShortId && user) {
      matched = user;
    }
    if (!matched && registeredPatients.length > 0) {
      matched = registeredPatients.find(p => {
        const sId = getShortPatientId(p.uid || p.id);
        return sId.toUpperCase() === cleanInput || (p.username && p.username.toLowerCase() === inputVal.toLowerCase());
      });
    }

    if (!matched) {
      if (registeredPatients.length > 0) {
        matched = registeredPatients[0];
      } else {
        matched = {
          id: 'patient_' + cleanInput.toLowerCase(),
          uid: 'patient_' + cleanInput.toLowerCase(),
          displayName: 'Patient ' + inputVal,
          username: 'patient_' + cleanInput.toLowerCase(),
          shortId: inputVal.startsWith('#') ? inputVal : `#MV-${inputVal}`
        };
      }
    }

    // If regular patient user (not doctor), verify password
    if (!isDoctorUser && user && (user.id !== matched.id && user.uid !== matched.uid)) {
      if (!password) {
        setLoginError('Please enter password for this Patient ID.');
        return;
      }
      let passOk = false;
      if (matched.passwordHash && matched.salt) {
        try {
          passOk = await verifyPassword(password, matched.salt, matched.passwordHash);
        } catch (_) { passOk = false; }
      } else {
        passOk = password.length >= 4;
      }
      if (!passOk) {
        setLoginError('Incorrect password for this Patient ID. Please try again.');
        return;
      }
    }

    const targetUid = matched.uid || matched.id;
    let pFullName = matched.displayName || matched.username;
    try {
      const pdRaw = localStorage.getItem(`medivault_personal_details_${targetUid}`);
      if (pdRaw) {
        const pd = JSON.parse(pdRaw);
        if (pd.fullName) pFullName = pd.fullName;
        else if (pd.firstName) pFullName = `${pd.firstName} ${pd.lastName || ''}`.trim();
      }
    } catch (_) {}

    const pProfile = {
      ...matched,
      id: targetUid,
      uid: targetUid,
      displayName: pFullName || 'Patient',
      shortId: `#MV-${getShortPatientId(targetUid)}`
    };

    try {
      sessionStorage.setItem('consult_active_patient_uid', targetUid);
      localStorage.setItem('consult_active_patient_uid', targetUid);
      localStorage.setItem('medivault_active_patient_id', targetUid);
      window.dispatchEvent(new CustomEvent('medivault_active_patient_changed', {
        detail: { uid: targetUid, profile: pProfile }
      }));
    } catch (_) {}

    loadPatient(pProfile);
    setActivePatientUser(pProfile);
    setLoggedIn(true);

    if (isDoctorUser) {
      setLoginRole('doctor');
      setChatMode('doctor');
    } else {
      setLoginRole('user');
      setChatMode('patient');
    }

    setPassword('');
    setLoginError('');

    if (targetDestination === 'dashboard') {
      navigate('/dashboard');
    } else if (targetDestination === 'patient-info') {
      navigate('/patient-info');
    } else {
      setActiveTab('overview');
    }
  };

  const suggestedPatientId = (() => {
    if (activePatientUser?.shortId) return activePatientUser.shortId;
    if (registeredPatients.length > 0) return `#MV-${getShortPatientId(registeredPatients[0].uid || registeredPatients[0].id)}`;
    if (user?.id && !isDoctorUser) return `#MV-${getShortPatientId(user.id)}`;
    return '#MV-A67FD4';
  })();

  // ── Render Patient Login Card (Only Patient Login, No Doctor Login) ────────
  const renderPatientLoginCard = () => (
    <div className="consult-login-wrapper" style={{ margin: '15px auto 30px', maxWidth: '440px', width: '100%' }}>
      <div className="consult-glow-bg" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(14,165,233,0.18))' }} />
      <div className="consult-login-card" style={{ background: 'var(--surface, #ffffff)', borderRadius: '24px', padding: '36px 30px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid var(--border, #e2e8f0)' }}>
        
        {/* Circular Shield Badge */}
        <div
          style={{
            width: '74px', height: '74px', borderRadius: '50%',
            background: '#059669',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
            boxShadow: '0 8px 20px rgba(5,150,105,0.25)'
          }}
        >
          <Shield size={40} color="#ffffff" strokeWidth={1.8} />
        </div>

        {/* Heading & Subtitle */}
        <h3 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Patient Login
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748b)', margin: '0 0 20px', lineHeight: 1.45 }}>
          Login with your Patient ID (as shown on your Dashboard) to view your consultation health data.
        </p>

        {/* Auto-fill dashed box (Matches Image 2) */}
        <div className="consult-patient-id-helper">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-muted, #475569)' }}>
            <Shield size={15} color="#059669" />
            <span>
              Dashboard ID: <strong style={{ color: '#059669', fontFamily: 'monospace', fontSize: '0.92rem' }}>{suggestedPatientId}</strong>
            </span>
          </div>
          <button
            type="button"
            className="consult-autofill-btn"
            onClick={() => {
              setPatientIdInput(suggestedPatientId);
              if (!password) setPassword('••••••••');
            }}
            title="Click to auto-fill Dashboard Patient ID"
          >
            AUTO-FILL
          </button>
        </div>

        {/* Quick select registered patient chips */}
        {registeredPatients.length > 0 && (
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', marginBottom: '6px' }}>
              Select Registered Patient:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {registeredPatients.slice(0, 4).map(p => {
                const sId = `#MV-${getShortPatientId(p.uid || p.id)}`;
                const isSelected = patientIdInput === sId;
                return (
                  <button
                    key={p.uid || p.id}
                    type="button"
                    onClick={() => {
                      setPatientIdInput(sId);
                      setPassword('••••••••');
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      background: isSelected ? '#059669' : 'rgba(16, 185, 129, 0.08)',
                      color: isSelected ? '#ffffff' : '#059669',
                      border: isSelected ? '1px solid #059669' : '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '9999px', padding: '3px 10px', fontSize: '0.74rem',
                      fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <Shield size={11} /> {p.displayName || p.username} ({sId})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loginError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
            <AlertCircle size={15} /> {loginError}
          </div>
        )}

        {/* Form Inputs: Only Patient ID and Password */}
        <form onSubmit={handleLogin} className="consult-form" style={{ textAlign: 'left' }}>
          <div className="consult-input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main, #334155)', marginBottom: '6px', display: 'block' }}>Patient ID</label>
            <input
              type="text"
              value={patientIdInput}
              onChange={e => setPatientIdInput(e.target.value)}
              required
              placeholder={suggestedPatientId}
              style={{ background: 'var(--bg-subtle, #f1f5f9)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '10px', padding: '12px 14px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main, #0f172a)', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div className="consult-input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main, #334155)', marginBottom: '6px', display: 'block' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••••"
              style={{ background: 'var(--bg-subtle, #f1f5f9)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '10px', padding: '12px 14px', fontSize: '0.95rem', color: 'var(--text-main, #0f172a)', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <button
              type="button"
              className="consult-login-btn-patient"
              onClick={(e) => handleLogin(e, 'dashboard')}
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              <LayoutDashboard size={16} /> Login to Patient Dashboard
            </button>
            <button
              type="button"
              className="consult-login-btn-patient"
              onClick={(e) => handleLogin(e, 'patient-info')}
              style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}
            >
              <User size={16} /> Login to Patient Details
            </button>
            <button
              type="button"
              className="consult-login-btn-patient"
              onClick={(e) => handleLogin(e, 'consultation')}
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
            >
              <Stethoscope size={16} /> Login to Patient Consultation
            </button>
          </div>
        </form>

        {/* Back to active consultation link if patient is already active */}
        {activePatientUser && (
          <div style={{ marginTop: '18px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              style={{ background: 'transparent', border: 'none', color: '#059669', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              ← Return to Consultation Overview ({activePatientUser.displayName || activePatientUser.username})
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ── Standalone Login screen (shown only if unauthenticated or session ended) ─
  if (!loggedIn) return (
    <div className="consult-page">
      <div className="consult-header">
        <button onClick={() => navigate(-1)} className="consult-back-btn"><ChevronLeft size={20}/> Back</button>
        <div className="consult-header-title">
          <div className="pulse-dot"/>
          <h2>Doctor Consultation</h2>
        </div>
      </div>
      <div className="consult-content">
        {renderPatientLoginCard()}
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview',   icon: <Activity size={16}/> },
    { id: 'yoga',     label: 'Yoga',       icon: <Brain size={16}/> },
    { id: 'diet',     label: 'Diet Plan',  icon: <Utensils size={16}/> },
    { id: 'water',    label: 'Water',      icon: <Droplets size={16}/> },
    { id: 'chat',     label: 'Chat',       icon: <MessageCircle size={16}/> },
    { id: 'patient-login', label: 'Patient Login', icon: <Shield size={16}/> },
  ];

  const currentDoctorName = isDoctorUser
    ? (doctorObj?.name || (user?.displayName || (user?.username ? `Dr. ${user.username.replace(/^dr[._\s-]*/i, '')}` : 'Dr. Sterling')))
    : (doctorObj?.name || 'Dr. Sterling');

  const currentPatientName = activePatientUser?.displayName || activePatientUser?.username || user?.displayName || user?.username || 'Patient';

  const UpdateBox = ({ section, placeholder }) => (
    <div className="update-box">
      {editSection === section ? (
        <div className="update-edit">
          <textarea value={editText} onChange={e => setEditText(e.target.value)} placeholder={placeholder} className="update-textarea"/>
          <div className="update-edit-btns">
            <button className="update-save-btn" onClick={() => saveUpdate(section)}><Save size={14}/> Save Update</button>
            <button className="update-cancel-btn" onClick={() => setEditSection(null)}><X size={14}/> Cancel</button>
          </div>
        </div>
      ) : (
        <div className="update-view">
          {updates[section] ? (
            <div className="update-note">
              <div className="update-note-meta">{(updates[section].doctor || '').startsWith('Dr') ? updates[section].doctor : `Dr. ${updates[section].doctor || 'Sterling'}`} · {updates[section].date}</div>
              <p>{updates[section].text}</p>
            </div>
          ) : <p className="update-empty">No doctor update yet for this section.</p>}
          <button className="update-edit-btn" onClick={() => { setEditSection(section); setEditText(updates[section]?.text || ''); }}>
            <Edit3 size={14}/> {updates[section] ? 'Update Note' : 'Add Note'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="consult-page">
      <div className="consult-header">
        <button onClick={() => navigate(-1)} className="consult-back-btn"><ChevronLeft size={20}/> Back</button>
        <div className="consult-header-title">
          <div className="pulse-dot"/>
          <h2>{loginRole === 'doctor' ? 'Doctor Consultation' : 'Doctor Consultation'}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDoctorUser && (
            <div style={{ display: 'flex', background: 'var(--border, #f1f5f9)', borderRadius: '8px', padding: '2px', gap: '4px' }}>
              <button
                type="button"
                onClick={() => { setLoginRole('doctor'); setChatMode('doctor'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px',
                  border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  background: loginRole === 'doctor' ? 'linear-gradient(135deg,#0ea5e9,#8b5cf6)' : 'transparent',
                  color: loginRole === 'doctor' ? '#fff' : 'var(--text-muted, #64748b)'
                }}
              >
                <Stethoscope size={13} /> Doctor Portal
              </button>
              <button
                type="button"
                onClick={() => { setLoginRole('user'); setChatMode('patient'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px',
                  border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  background: loginRole === 'user' ? 'linear-gradient(135deg,#10b981,#059669)' : 'transparent',
                  color: loginRole === 'user' ? '#fff' : 'var(--text-muted, #64748b)'
                }}
              >
                <User size={13} /> Patient View
              </button>
            </div>
          )}

          {/* Dedicated Patient Login button right in Header */}
          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className="consult-header-patient-login-btn active"
            title="Open Patient Login Modal"
          >
            <Shield size={14} /> Patient Login
          </button>

          <button 
            onClick={() => { setLoggedIn(false); setLoginMode('user'); }} 
            className="consult-logout-btn-top"
            title="Switch Consultation Portal"
          >
            <Unlock size={14}/> Switch Portal
          </button>
        </div>
      </div>

      {/* Doctor/User Session Bar (Matches Image 1) */}
      <div className="consult-doc-bar">
        <div className="consult-doc-avatar-sm">
          {loginRole === 'doctor' ? <Stethoscope size={17} /> : <User size={17} />}
        </div>
        <div className="consult-doc-meta">
          {activePatientUser ? (
            <>
              <strong className="consult-user-name">{activePatientUser.displayName || activePatientUser.username}</strong>
              <span className="consult-patient-id-tag">
                <Shield size={12} className="consult-patient-id-shield" />
                {activePatientUser.shortId || `#MV-${getShortPatientId(activePatientUser.uid || activePatientUser.id)}`}
              </span>
              <span className="consult-session-status">
                — Patient session active (Consulting with {currentDoctorName})
              </span>
            </>
          ) : (
            <>
              <strong className="consult-user-name">{currentDoctorName}</strong>
              <span className="consult-session-status">— Doctor session active (Please Login Patient via Patient Login)</span>
            </>
          )}
        </div>
        <div className="consult-status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isDoctorUser && (
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
              title="Click to open Patient Login modal"
            >
              <Shield size={12} /> Patient Login
            </button>
          )}
          <div className="pulse-dot" />
        </div>
      </div>

      {/* Tabs Navigation Bar (Matches Image 1 directly below session bar) */}
      <div className="consult-tabs-wrapper">
        <div className="consult-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`consult-tab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => {
                if (t.id === 'patient-login') {
                  setShowLoginModal(true);
                } else {
                  setActiveTab(t.id);
                }
              }}
            >
              <span className="consult-tab-icon">{t.icon}</span>
              <span className="consult-tab-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="consult-tab-body">

        {/* ── PATIENT LOGIN TAB (Image 2 in Image 1) ── */}
        {activeTab === 'patient-login' && (
          <div className="tab-pane-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10px' }}>
            {renderPatientLoginCard()}
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="tab-pane-fade">
            {loginRole === 'doctor' && !activePatientUser && (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', color: '#b45309' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertCircle size={20} />
                  <div>
                    <strong>No Patient Logged In Yet</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Please log in a patient with their Patient ID to view their real-time telemetry and health data.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="consult-login-btn-patient"
                  style={{ width: 'auto', padding: '8px 16px', margin: 0, fontSize: '0.85rem' }}
                >
                  <Shield size={14} /> Open Patient Login
                </button>
              </div>
            )}
            <div className="overview-header-row">
              <div>
                <h3 className="tab-pane-title">Health & Activity Overview</h3>
                <p className="tab-pane-desc">
                  {loginRole === 'doctor' && activePatientUser 
                    ? `Reviewing real-time health data for patient ${activePatientUser.displayName || activePatientUser.username} (${activePatientUser.shortId || `#MV-${getShortPatientId(activePatientUser.uid || activePatientUser.id)}`}).`
                    : 'Real-time health telemetry, active streaks, daily intake, and fitness milestones.'}
                </p>
              </div>
            </div>

            <div className="overview-grid">
              <div className="ov-card">
                <div className="ov-icon" style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff4757)' }}>
                  <Flame size={22} color="white" />
                </div>
                <div className="ov-details">
                  <div className="ov-val">{data.yogaStreak} days</div>
                  <div className="ov-label">Yoga Streak</div>
                </div>
              </div>

              <div className="ov-card">
                <div className="ov-icon" style={{ background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' }}>
                  <Droplets size={22} color="white" />
                </div>
                <div className="ov-details">
                  <div className="ov-val">{((data.waterToday || 0) / 1000).toFixed(1)}L</div>
                  <div className="ov-label">Water Today</div>
                </div>
              </div>

              <div className="ov-card">
                <div className="ov-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <Target size={22} color="white" />
                </div>
                <div className="ov-details">
                  <div className="ov-val">{data.waterStreak} days</div>
                  <div className="ov-label">Water Streak</div>
                </div>
              </div>

              <div className="ov-card">
                <div className="ov-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <Utensils size={22} color="white" />
                </div>
                <div className="ov-details">
                  <div className="ov-val">{data.savedCalories} kcal</div>
                  <div className="ov-label">Calories Saved</div>
                </div>
              </div>

              <div className="ov-card">
                <div className="ov-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                  <Brain size={22} color="white" />
                </div>
                <div className="ov-details">
                  <div className="ov-val">L1: {data.level1Done}/4</div>
                  <div className="ov-label">Yoga Level 1</div>
                </div>
              </div>

              <div className="ov-card">
                <div className="ov-icon" style={{ background: 'linear-gradient(135deg, #e17055, #d63031)' }}>
                  <TrendingUp size={22} color="white" />
                </div>
                <div className="ov-details">
                  <div className="ov-val">L2: {data.level2Done}/5</div>
                  <div className="ov-label">Yoga Level 2</div>
                </div>
              </div>
            </div>

            {/* Visual bar-chart overview */}
            <div className="ov-activity-card">
              <div className="ov-activity-header">
                <h4 className="ov-activity-title">
                  <TrendingUp size={18} color="#0ea5e9" /> Activity Progress Overview
                </h4>
                <span className="ov-activity-pill">Live Telemetry</span>
              </div>
              <div className="ov-activity-bars">
                {[
                  { label: 'Yoga Level 1', val: data.level1Done || 0, max: 4, color: 'linear-gradient(90deg, #8b5cf6, #7c3aed)' },
                  { label: 'Yoga Level 2', val: data.level2Done || 0, max: 5, color: 'linear-gradient(90deg, #e17055, #d63031)' },
                  { label: 'Water Today', val: Math.min(data.waterToday || 0, data.waterTarget || 2500), max: data.waterTarget || 2500, color: 'linear-gradient(90deg, #0ea5e9, #06b6d4)', unit: 'ml' },
                  { label: 'Calories Tracked', val: Math.min(data.savedCalories || 0, 2000), max: 2000, color: 'linear-gradient(90deg, #f59e0b, #d97706)', unit: 'kcal' },
                ].map(({ label, val, max, color, unit }) => (
                  <div key={label} className="ov-bar-item">
                    <div className="ov-bar-header">
                      <span className="ov-bar-name">{label}</span>
                      <span className="ov-bar-val">{unit ? `${val} ${unit}` : `${val}/${max}`}</span>
                    </div>
                    <div className="ov-bar-track">
                      <div
                        className="ov-bar-fill"
                        style={{
                          width: `${Math.min(100, Math.round((val / max) * 100))}%`,
                          background: color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── YOGA ── */}
        {activeTab === 'yoga' && (
          <div className="section-body tab-pane-fade">
            <div className="section-header-actions">
              <div>
                <h3 className="section-heading"><Brain size={20} color="#8b5cf6"/> Yoga Progress & Mindful Habits</h3>
                <p className="tab-pane-desc">Track completed daily yoga sequences, session continuity, and doctor recommendations.</p>
              </div>
              <button onClick={() => navigate('/yoga')} className="consult-nav-back-btn">
                <ChevronLeft size={16}/> Back to Yoga
              </button>
            </div>

            <div className="data-cards-row">
              <div className="data-card">
                <span className="data-card-label">Day Streak</span>
                <strong className="data-card-val">{data.yogaStreak} 🔥</strong>
              </div>
              <div className="data-card">
                <span className="data-card-label">Last Streak Date</span>
                <strong className="data-card-val">{data.yogaDate}</strong>
              </div>
              <div className="data-card">
                <span className="data-card-label">Level 1 Videos</span>
                <strong className="data-card-val">{data.level1Done} / 4 done</strong>
              </div>
              <div className="data-card">
                <span className="data-card-label">Level 2 Videos</span>
                <strong className="data-card-val">{data.level2Done} / 5 done</strong>
              </div>
            </div>

            <div className="progress-bars-card">
              <div className="pb-item">
                <div className="pb-label">
                  <span>Level 1 Progress</span>
                  <span className="pb-val-highlight">{Math.round((data.level1Done / 4) * 100)}%</span>
                </div>
                <div className="pb-track">
                  <div className="pb-fill" style={{ width: `${(data.level1Done / 4) * 100}%`, background: 'linear-gradient(90deg, #667eea, #764ba2)' }} />
                </div>
              </div>
              <div className="pb-item">
                <div className="pb-label">
                  <span>Level 2 Progress</span>
                  <span className="pb-val-highlight">{Math.round((data.level2Done / 5) * 100)}%</span>
                </div>
                <div className="pb-track">
                  <div className="pb-fill" style={{ width: `${(data.level2Done / 5) * 100}%`, background: 'linear-gradient(90deg, #e17055, #d63031)' }} />
                </div>
              </div>
            </div>

            <div className="doctor-recommendation-card">
              <h4 className="update-heading"><Edit3 size={16} color="#8b5cf6"/> Doctor's Yoga Recommendation</h4>
              <UpdateBox section="yoga" placeholder="e.g. Increase to 3 sessions per week. Focus on breathing techniques and morning surya namaskar..."/>
            </div>
          </div>
        )}

        {/* ── DIET ── */}
        {activeTab === 'diet' && (
          <div className="section-body tab-pane-fade">
            <div className="section-header-actions">
              <div>
                <h3 className="section-heading"><Utensils size={20} color="#f59e0b"/> Diet & Nutrition</h3>
                <p className="tab-pane-desc">Tracked daily intake, user dietary timetable, and clinical nutrition advice.</p>
              </div>
            </div>

            <div className="data-cards-row">
              <div className="data-card">
                <span className="data-card-label">Calories Tracked</span>
                <strong className="data-card-val">{data.savedCalories} kcal</strong>
              </div>
              <div className="data-card">
                <span className="data-card-label">Protein Tracked</span>
                <strong className="data-card-val">{data.savedProtein} g</strong>
              </div>
              <div className="data-card">
                <span className="data-card-label">Diet Schedule Items</span>
                <strong className="data-card-val">{(data.dietSchedule || []).length} meals</strong>
              </div>
              <div className="data-card">
                <span className="data-card-label">Saved Food Items</span>
                <strong className="data-card-val">{(data.savedItems || []).length} items</strong>
              </div>
            </div>

            {(data.dietSchedule || []).length > 0 && (
              <div className="diet-table-wrap">
                <h4 className="update-heading">User Diet Timetable</h4>
                <div className="diet-table-container">
                  <table className="diet-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Food Item</th>
                        <th>Meal Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(data.dietSchedule || [])].sort((a, b) => a.time.localeCompare(b.time)).map(s => (
                        <tr key={s.id}>
                          <td><strong>{s.time}</strong></td>
                          <td>{s.item}</td>
                          <td><span className="meal-badge">{s.mealType}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="doctor-recommendation-card">
              <h4 className="update-heading"><Edit3 size={16} color="#f59e0b"/> Doctor's Diet Recommendation</h4>
              <UpdateBox section="diet" placeholder="e.g. Reduce carbs after 7 PM. Increase lean protein intake to 80g/day. Add fresh leafy vegetables..."/>
            </div>
          </div>
        )}

        {/* ── WATER ── */}
        {activeTab === 'water' && (
          <div className="section-body tab-pane-fade">
            <div className="section-header-actions">
              <div>
                <h3 className="section-heading"><Droplets size={20} color="#0ea5e9"/> Hydration Details</h3>
                <p className="tab-pane-desc">Target water consumption, fluid balance metrics, and hydration streaks.</p>
              </div>
            </div>

            <div className="data-cards-row">
              <div className="data-card">
                <span className="data-card-label">Today's Intake</span>
                <strong className="data-card-val">{((data.waterToday || 0) / 1000).toFixed(2)} L</strong>
              </div>
              <div className="data-card">
                <span className="data-card-label">Daily Target</span>
                <strong className="data-card-val">{((data.waterTarget || 2500) / 1000).toFixed(1)} L</strong>
              </div>
              <div className="data-card">
                <span className="data-card-label">Remaining</span>
                <strong className="data-card-val">{Math.max(0, ((data.waterTarget || 2500) - (data.waterToday || 0)) / 1000).toFixed(2)} L</strong>
              </div>
              <div className="data-card">
                <span className="data-card-label">Hydration Streak</span>
                <strong className="data-card-val">{data.waterStreak} days 💧</strong>
              </div>
            </div>

            <div className="progress-bars-card">
              <div className="pb-item">
                <div className="pb-label">
                  <span>Today's Goal Progress</span>
                  <span className="pb-val-highlight">{Math.min(100, Math.round(((data.waterToday || 0) / (data.waterTarget || 2500)) * 100))}%</span>
                </div>
                <div className="pb-track">
                  <div className="pb-fill" style={{ width: `${Math.min(100, ((data.waterToday || 0) / (data.waterTarget || 2500)) * 100)}%`, background: 'linear-gradient(90deg, #0ea5e9, #06b6d4)' }} />
                </div>
              </div>
            </div>

            <div className="doctor-recommendation-card">
              <h4 className="update-heading"><Edit3 size={16} color="#0ea5e9"/> Doctor's Hydration Advice</h4>
              <UpdateBox section="water" placeholder="e.g. Increase daily target to 3L. Drink a glass 30 min before each meal to maintain fluid balance..."/>
            </div>
          </div>
        )}

        {/* ── CHAT ── */}
        {activeTab === 'chat' && (
          <div className="chat-container tab-pane-fade">
            <div className="chat-mode-bar">
              <button onClick={() => navigate(-1)} className="chat-back-btn">
                <ChevronLeft size={14}/> Back
              </button>
              <div className="chat-sender-toggle">
                <span className="chat-mode-label">Sending as:</span>
                <div className="chat-role-pills">
                  <button className={`chat-mode-btn${chatMode === 'doctor' ? ' active' : ''}`} onClick={() => setChatMode('doctor')}><Stethoscope size={14}/> Doctor</button>
                  <button className={`chat-mode-btn patient${chatMode === 'patient' ? ' active' : ''}`} onClick={() => setChatMode('patient')}><Activity size={14}/> Patient</button>
                </div>
              </div>
              <span className="chat-count">{messages.length} messages</span>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-empty"><MessageCircle size={48}/><p>No messages yet. Start the consultation chat.</p></div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`chat-bubble ${m.sender} ${m.important ? 'important' : ''}`}>
                  {m.important && <div className="chat-important-tag"><Star size={11}/> Important</div>}
                  <div className="chat-bubble-text">{m.text}</div>
                  <div className="chat-bubble-meta">{m.sender === 'doctor' ? currentDoctorName : 'Patient'} · {m.time}</div>
                </div>
              ))}
              <div ref={chatEndRef}/>
            </div>

            <div className="chat-input-area">
              <button
                className={`chat-star-btn${isImportant ? ' active' : ''}`}
                onClick={() => setIsImportant(v => !v)}
                title={isImportant ? 'Marked as Important' : 'Mark as Important'}
              ><Star size={18}/></button>
              <input
                className="chat-input"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
                placeholder={isImportant ? '⭐ Important message...' : 'Type a message...'}
              />
              <button className="chat-send-btn" onClick={sendMsg}><Send size={18}/></button>
            </div>
            {isImportant && <div className="chat-important-hint"><AlertCircle size={14}/> This message will be marked as important for the patient to notice.</div>}
          </div>
        )}

      </div>

      {/* Patient Login Popup Modal */}
      <PatientLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        user={user}
        onSuccess={(pProfile, dest) => {
          loadPatient(pProfile);
          if (dest === 'consultation' || !dest) {
            setActiveTab('overview');
          }
        }}
      />
    </div>
  );
}
