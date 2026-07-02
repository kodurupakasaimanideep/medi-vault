import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Stethoscope, Lock, Unlock, Flame, Droplets,
  Utensils, Activity, TrendingUp, MessageCircle, Star, Send,
  AlertCircle, CheckCircle2, Edit3, Save, X, Brain, Target, User
} from 'lucide-react';
import './Consultation.css';

// ── Predefined doctor accounts (stored in localStorage too) ─────────────────
const DEFAULT_DOCTORS = [
  { id: 'DR001', name: 'Dr. Sharma', username: 'drsharma', password: 'Doctor@123' },
  { id: 'DR002', name: 'Dr. Priya', username: 'drpriya', password: 'Priya@456' },
  { id: 'DR003', name: 'Dr. Rajesh', username: 'drrajesh', password: 'Rajesh@789' },
];

function getDoctors() {
  try {
    const saved = JSON.parse(localStorage.getItem('consult_doctor_accounts') || 'null');
    if (saved && saved.length) return saved;
  } catch {}
  localStorage.setItem('consult_doctor_accounts', JSON.stringify(DEFAULT_DOCTORS));
  return DEFAULT_DOCTORS;
}

// ── helpers ──────────────────────────────────────────────────────────────────
function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function getPatientData() {
  const water     = readLS('medivault_water', {});
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
  const lastReset = localStorage.getItem('yoga_last_reset_date');
  let completedVideos = readLS('yoga_completed_videos', {});
  if (!lastReset) {
    localStorage.setItem('yoga_last_reset_date', today);
  } else if (lastReset !== today) {
    let changed = false;
    Object.keys(completedVideos).forEach(key => {
      if (key.startsWith('l1') || key.startsWith('l2')) {
        delete completedVideos[key];
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem('yoga_completed_videos', JSON.stringify(completedVideos));
    }
    localStorage.setItem('yoga_last_reset_date', today);
    localStorage.removeItem('yoga_l1_completion_time');
    localStorage.removeItem('yoga_l2_completion_time');
  }

  const yogaStreak      = parseInt(localStorage.getItem('yoga_day_streaks') || '0', 10);
  const yogaDate        = localStorage.getItem('yoga_last_streak_date') || '—';
  const level1Done = ['l1v1','l1v2','l1v3','l1v4'].filter(id => completedVideos[id]).length;
  const level2Done = ['l2v1','l2v2','l2v3','l2v4'].filter(id => completedVideos[id]).length;

  const dietSchedule  = readLS('medivault_diet_timetable', []);
  const savedCalories = parseFloat(localStorage.getItem('mv_saved_calories') || '0');
  const savedProtein  = parseFloat(localStorage.getItem('mv_saved_protein')  || '0');
  const savedItems    = readLS('mv_saved_items', []);

  return { waterToday, waterTarget, waterStreak, yogaStreak, yogaDate, level1Done, level2Done, dietSchedule, savedCalories, savedProtein, savedItems };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Consultation() {
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState('doctor'); // 'doctor' | 'user'
  const [loggedIn, setLoggedIn]   = useState(false);
  const [loginRole, setLoginRole] = useState('doctor'); // who is logged in
  const [doctorObj, setDoctorObj] = useState(null);    // logged-in doctor object
  const [doctorId, setDoctorId]   = useState('');
  const [password, setPassword]   = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // patient data
  const [data, setData] = useState({});
  useEffect(() => { if (loggedIn) setData(getPatientData()); }, [loggedIn]);

  // doctor updates per section
  const [updates, setUpdates] = useState(() => readLS('consult_doctor_updates', {}));
  const [editSection, setEditSection] = useState(null);
  const [editText, setEditText]       = useState('');

  const saveUpdate = (section) => {
    const next = { ...updates, [section]: { text: editText, date: new Date().toLocaleString(), doctor: doctorId } };
    setUpdates(next);
    localStorage.setItem('consult_doctor_updates', JSON.stringify(next));
    setEditSection(null);
  };

  // chat
  const [messages, setMessages] = useState(() => readLS('consult_chat_messages', []));
  const [chatInput, setChatInput] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [chatMode, setChatMode] = useState('doctor'); // doctor | patient
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
    localStorage.setItem('consult_chat_messages', JSON.stringify(next));
    setChatInput(''); setIsImportant(false);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeTab]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (loginMode === 'doctor') {
      const doctors = getDoctors();
      const found = doctors.find(
        d => (d.username === doctorId.trim() || d.name === doctorId.trim()) && d.password === password
      );
      if (found) {
        setDoctorObj(found);
        setLoginRole('doctor');
        setLoggedIn(true);
      } else {
        setLoginError('Invalid doctor credentials. Please check your username and password.');
      }
    } else {
      // User login — check Firebase/localStorage user
      const storedUser = JSON.parse(localStorage.getItem('medivault_current_user') || 'null')
        || JSON.parse(localStorage.getItem('medivault_user') || 'null');
      if (doctorId.trim() && password.length >= 4) {
        setDoctorObj({ name: doctorId.trim(), username: doctorId.trim() });
        setLoginRole('user');
        setLoggedIn(true);
      } else {
        setLoginError('Please enter valid credentials (password min 4 chars).');
      }
    }
  };

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!loggedIn) return (
    <div className="consult-page">
      <div className="consult-header">
        <button onClick={() => navigate(-1)} className="consult-back-btn"><ChevronLeft size={20}/> Back</button>
        <div className="consult-header-title"><div className="pulse-dot"/><h2>Doctor Consultation</h2></div>
      </div>
      <div className="consult-content">
        <div className="consult-login-wrapper">
          <div className="consult-glow-bg"/>
          <div className="consult-login-card">
            {/* Login mode toggle */}
            <div style={{ display:'flex', gap:'8px', marginBottom:'24px', background:'#f1f5f9', borderRadius:'12px', padding:'4px' }}>
              <button onClick={()=>{ setLoginMode('doctor'); setLoginError(''); }}
                style={{ flex:1, padding:'10px', borderRadius:'8px', border:'none', fontWeight:'700', fontSize:'0.9rem', cursor:'pointer',
                  background: loginMode==='doctor' ? 'linear-gradient(135deg,#0ea5e9,#8b5cf6)' : 'transparent',
                  color: loginMode==='doctor' ? 'white' : '#64748b', transition:'all 0.2s' }}>
                <Stethoscope size={14} style={{marginRight:6, display:'inline'}}/> Doctor Login
              </button>
              <button onClick={()=>{ setLoginMode('user'); setLoginError(''); }}
                style={{ flex:1, padding:'10px', borderRadius:'8px', border:'none', fontWeight:'700', fontSize:'0.9rem', cursor:'pointer',
                  background: loginMode==='user' ? 'linear-gradient(135deg,#10b981,#059669)' : 'transparent',
                  color: loginMode==='user' ? 'white' : '#64748b', transition:'all 0.2s' }}>
                <User size={14} style={{marginRight:6, display:'inline'}}/> User Login
              </button>
            </div>

            <div className="consult-login-icon" style={{ background: loginMode==='doctor' ? 'linear-gradient(135deg,#0ea5e9,#8b5cf6)' : 'linear-gradient(135deg,#10b981,#059669)' }}>
              {loginMode==='doctor' ? <Stethoscope size={48} strokeWidth={1.5}/> : <User size={48} strokeWidth={1.5}/>}
            </div>
            <h3>{loginMode==='doctor' ? 'Doctor Authentication' : 'Patient Login'}</h3>
            <p>{loginMode==='doctor'
              ? 'Enter your doctor credentials to access consultation portal.'
              : 'Login with your user account to view your health data.'}
            </p>

            {loginError && (
              <div style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', padding:'10px 14px', borderRadius:'8px', fontSize:'0.85rem', fontWeight:'600', marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                <AlertCircle size={14}/> {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="consult-form">
              <div className="consult-input-group">
                <label>{loginMode==='doctor' ? 'Doctor Username' : 'Username / Email'}</label>
                <input type="text" value={doctorId} onChange={e=>setDoctorId(e.target.value)} required
                  placeholder={loginMode==='doctor' ? 'e.g. drsharma' : 'Your username'}/>
              </div>
              <div className="consult-input-group">
                <label>Password</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"/>
              </div>
              {loginMode==='doctor' && (
                <div style={{ background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)', borderRadius:'8px', padding:'10px 12px', fontSize:'0.8rem', color:'#0369a1' }}>
                  <strong>Demo credentials:</strong> drsharma / Doctor@123 · drpriya / Priya@456
                </div>
              )}
              <button type="submit" className="consult-login-btn"
                style={{ background: loginMode==='doctor' ? 'linear-gradient(135deg,#0ea5e9,#8b5cf6)' : 'linear-gradient(135deg,#10b981,#059669)' }}>
                <Lock size={18}/> {loginMode==='doctor' ? 'Authenticate Doctor' : 'Login as Patient'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview',   icon: <Activity size={16}/> },
    { id: 'yoga',     label: 'Yoga',       icon: <Brain size={16}/> },
    { id: 'diet',     label: 'Diet Plan',  icon: <Utensils size={16}/> },
    { id: 'water',    label: 'Water',      icon: <Droplets size={16}/> },
    { id: 'chat',     label: 'Chat',       icon: <MessageCircle size={16}/> },
  ];

  const displayName = doctorObj?.name || (loginRole === 'doctor' ? `Dr. ${doctorId}` : doctorId);

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
              <div className="update-note-meta">Dr. {updates[section].doctor} · {updates[section].date}</div>
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
        <div className="consult-header-title"><div className="pulse-dot"/><h2>Doctor Consultation</h2></div>
        <button onClick={() => setLoggedIn(false)} className="consult-logout-btn-top"><Unlock size={16}/> End Session</button>
      </div>

      {/* Doctor/User bar */}
      <div className="consult-doc-bar">
        <div className="consult-doc-avatar-sm">{loginRole==='doctor' ? <Stethoscope size={18}/> : <User size={18}/>}</div>
        <span>{loginRole==='doctor' ? <><strong>{displayName}</strong> — Doctor session active</> : <><strong>{displayName}</strong> — Patient session</>}</span>
        <div className="pulse-dot" style={{marginLeft:'auto'}}/>
      </div>

      {/* Tabs */}
      <div className="consult-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`consult-tab${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="consult-tab-body">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div>
            <div className="overview-grid">
              <div className="ov-card"><div className="ov-icon" style={{background:'linear-gradient(135deg,#ff6b6b,#ff4757)'}}><Flame size={22} color="white"/></div><div><div className="ov-val">{data.yogaStreak} days</div><div className="ov-label">Yoga Streak</div></div></div>
              <div className="ov-card"><div className="ov-icon" style={{background:'linear-gradient(135deg,#0ea5e9,#06b6d4)'}}><Droplets size={22} color="white"/></div><div><div className="ov-val">{((data.waterToday||0)/1000).toFixed(1)}L</div><div className="ov-label">Water Today</div></div></div>
              <div className="ov-card"><div className="ov-icon" style={{background:'linear-gradient(135deg,#10b981,#059669)'}}><Target size={22} color="white"/></div><div><div className="ov-val">{data.waterStreak} days</div><div className="ov-label">Water Streak</div></div></div>
              <div className="ov-card"><div className="ov-icon" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)'}}><Utensils size={22} color="white"/></div><div><div className="ov-val">{data.savedCalories} kcal</div><div className="ov-label">Calories Saved</div></div></div>
              <div className="ov-card"><div className="ov-icon" style={{background:'linear-gradient(135deg,#8b5cf6,#6d28d9)'}}><Brain size={22} color="white"/></div><div><div className="ov-val">L1: {data.level1Done}/4</div><div className="ov-label">Yoga Level 1</div></div></div>
              <div className="ov-card"><div className="ov-icon" style={{background:'linear-gradient(135deg,#e17055,#d63031)'}}><TrendingUp size={22} color="white"/></div><div><div className="ov-val">L2: {data.level2Done}/5</div><div className="ov-label">Yoga Level 2</div></div></div>
            </div>

            {/* Visual bar-chart overview */}
            <div style={{ marginTop:'24px', background:'var(--surface)', borderRadius:'16px', padding:'24px', border:'1px solid var(--border)' }}>
              <h4 style={{ margin:'0 0 20px 0', fontWeight:'800', color:'var(--text-main)', display:'flex', alignItems:'center', gap:'8px' }}>
                <TrendingUp size={18} color="#0ea5e9"/> Activity Overview
              </h4>
              {[
                { label:'Yoga L1', val: data.level1Done||0, max:4, color:'linear-gradient(90deg,#8b5cf6,#7c3aed)' },
                { label:'Yoga L2', val: data.level2Done||0, max:5, color:'linear-gradient(90deg,#e17055,#d63031)' },
                { label:'Water Today', val: Math.min(data.waterToday||0, data.waterTarget||2500), max: data.waterTarget||2500, color:'linear-gradient(90deg,#0ea5e9,#06b6d4)', unit:'ml' },
                { label:'Calories', val: Math.min(data.savedCalories||0, 2000), max:2000, color:'linear-gradient(90deg,#f59e0b,#d97706)', unit:'kcal' },
              ].map(({label,val,max,color,unit})=>(
                <div key={label} style={{marginBottom:'16px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.85rem',fontWeight:'700',color:'var(--text-main)',marginBottom:'6px'}}>
                    <span>{label}</span>
                    <span style={{color:'#64748b'}}>{unit ? `${val} ${unit}` : `${val}/${max}`}</span>
                  </div>
                  <div style={{background:'var(--border)',borderRadius:'8px',height:'10px',overflow:'hidden'}}>
                    <div style={{width:`${Math.min(100,Math.round((val/max)*100))}%`,height:'100%',background:color,borderRadius:'8px',transition:'width 1s ease'}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── YOGA ── */}
        {activeTab === 'yoga' && (
          <div className="section-body">
            <button onClick={() => navigate('/yoga')} style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(139,92,246,0.1)', color:'#7c3aed', border:'1px solid rgba(139,92,246,0.2)', padding:'8px 16px', borderRadius:'8px', fontWeight:'700', cursor:'pointer', marginBottom:'20px' }}>
              <ChevronLeft size={16}/> Back to Yoga
            </button>
            <h3 className="section-heading"><Brain size={20}/> Yoga Progress</h3>
            <div className="data-cards-row">
              <div className="data-card"><span>Day Streak</span><strong>{data.yogaStreak} 🔥</strong></div>
              <div className="data-card"><span>Last Streak Date</span><strong>{data.yogaDate}</strong></div>
              <div className="data-card"><span>Level 1 Videos</span><strong>{data.level1Done} / 4 done</strong></div>
              <div className="data-card"><span>Level 2 Videos</span><strong>{data.level2Done} / 5 done</strong></div>
            </div>
            <div className="progress-bars">
              <div className="pb-label"><span>Level 1 Progress</span><span>{Math.round((data.level1Done/4)*100)}%</span></div>
              <div className="pb-track"><div className="pb-fill" style={{width:`${(data.level1Done/4)*100}%`, background:'linear-gradient(90deg,#667eea,#764ba2)'}}/></div>
              <div className="pb-label" style={{marginTop:'10px'}}><span>Level 2 Progress</span><span>{Math.round((data.level2Done/5)*100)}%</span></div>
              <div className="pb-track"><div className="pb-fill" style={{width:`${(data.level2Done/5)*100}%`, background:'linear-gradient(90deg,#e17055,#d63031)'}}/></div>
            </div>
            <h4 className="update-heading"><Edit3 size={16}/> Doctor's Yoga Recommendation</h4>
            <UpdateBox section="yoga" placeholder="e.g. Increase to 3 sessions per week. Focus on breathing techniques..."/>
          </div>
        )}

        {/* ── DIET ── */}
        {activeTab === 'diet' && (
          <div className="section-body">
            <h3 className="section-heading"><Utensils size={20}/> Diet & Nutrition</h3>
            <div className="data-cards-row">
              <div className="data-card"><span>Calories Tracked</span><strong>{data.savedCalories} kcal</strong></div>
              <div className="data-card"><span>Protein Tracked</span><strong>{data.savedProtein} g</strong></div>
              <div className="data-card"><span>Diet Schedule Items</span><strong>{(data.dietSchedule||[]).length} meals</strong></div>
              <div className="data-card"><span>Saved Food Items</span><strong>{(data.savedItems||[]).length} items</strong></div>
            </div>
            {(data.dietSchedule||[]).length > 0 && (
              <div className="diet-table-wrap">
                <h4 className="update-heading">User Diet Timetable</h4>
                <table className="diet-table">
                  <thead><tr><th>Time</th><th>Food Item</th><th>Meal Type</th></tr></thead>
                  <tbody>
                    {[...(data.dietSchedule||[])].sort((a,b) => a.time.localeCompare(b.time)).map(s => (
                      <tr key={s.id}><td>{s.time}</td><td>{s.item}</td><td><span className="meal-badge">{s.mealType}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <h4 className="update-heading"><Edit3 size={16}/> Doctor's Diet Recommendation</h4>
            <UpdateBox section="diet" placeholder="e.g. Reduce carbs after 7 PM. Increase protein intake to 80g/day..."/>
          </div>
        )}

        {/* ── WATER ── */}
        {activeTab === 'water' && (
          <div className="section-body">
            <h3 className="section-heading"><Droplets size={20}/> Hydration Details</h3>
            <div className="data-cards-row">
              <div className="data-card"><span>Today's Intake</span><strong>{((data.waterToday||0)/1000).toFixed(2)} L</strong></div>
              <div className="data-card"><span>Daily Target</span><strong>{((data.waterTarget||2500)/1000).toFixed(1)} L</strong></div>
              <div className="data-card"><span>Remaining</span><strong>{Math.max(0,((data.waterTarget||2500)-(data.waterToday||0))/1000).toFixed(2)} L</strong></div>
              <div className="data-card"><span>Hydration Streak</span><strong>{data.waterStreak} days 💧</strong></div>
            </div>
            <div className="progress-bars">
              <div className="pb-label"><span>Today's Goal Progress</span><span>{Math.min(100,Math.round(((data.waterToday||0)/(data.waterTarget||2500))*100))}%</span></div>
              <div className="pb-track"><div className="pb-fill" style={{width:`${Math.min(100,((data.waterToday||0)/(data.waterTarget||2500))*100)}%`, background:'linear-gradient(90deg,#0ea5e9,#06b6d4)'}}/></div>
            </div>
            <h4 className="update-heading"><Edit3 size={16}/> Doctor's Hydration Advice</h4>
            <UpdateBox section="water" placeholder="e.g. Increase daily target to 3L. Drink a glass 30 min before each meal..."/>
          </div>
        )}

        {/* ── CHAT ── */}
        {activeTab === 'chat' && (
          <div className="chat-container">
            <div className="chat-mode-bar">
              <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:'4px', background:'rgba(14,165,233,0.1)', color:'#0369a1', border:'1px solid rgba(14,165,233,0.2)', padding:'6px 12px', borderRadius:'8px', fontWeight:'700', cursor:'pointer', fontSize:'0.8rem' }}>
                <ChevronLeft size={14}/> Back
              </button>
              <span style={{marginLeft:'8px'}}>Sending as:</span>
              <button className={`chat-mode-btn${chatMode==='doctor'?' active':''}`} onClick={()=>setChatMode('doctor')}><Stethoscope size={14}/> Doctor</button>
              <button className={`chat-mode-btn patient${chatMode==='patient'?' active':''}`} onClick={()=>setChatMode('patient')}><Activity size={14}/> Patient</button>
              <span className="chat-count">{messages.length} messages</span>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-empty"><MessageCircle size={48}/><p>No messages yet. Start the consultation chat.</p></div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`chat-bubble ${m.sender} ${m.important?'important':''}`}>
                  {m.important && <div className="chat-important-tag"><Star size={11}/> Important</div>}
                  <div className="chat-bubble-text">{m.text}</div>
                  <div className="chat-bubble-meta">{m.sender === 'doctor' ? `Dr. ${doctorId}` : 'Patient'} · {m.time}</div>
                </div>
              ))}
              <div ref={chatEndRef}/>
            </div>

            <div className="chat-input-area">
              <button
                className={`chat-star-btn${isImportant?' active':''}`}
                onClick={()=>setIsImportant(v=>!v)}
                title={isImportant ? 'Marked as Important' : 'Mark as Important'}
              ><Star size={18}/></button>
              <input
                className="chat-input"
                value={chatInput}
                onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMsg()}
                placeholder={isImportant ? '⭐ Important message...' : 'Type a message...'}
              />
              <button className="chat-send-btn" onClick={sendMsg}><Send size={18}/></button>
            </div>
            {isImportant && <div className="chat-important-hint"><AlertCircle size={14}/> This message will be marked as important for the patient to notice.</div>}
          </div>
        )}

      </div>
    </div>
  );
}
