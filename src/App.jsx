import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Swal from 'sweetalert2';
import { Moon } from 'lucide-react';
import { getIdealSleepRange } from './utils/sleepHelper';
import ProtectedRoute from './contexts/ProtectedRoute';
import { initFirebaseSync, stopFirebaseSync, clearLocalAppData } from './services/firebaseSync';
import { LanguageProvider } from './contexts/LanguageContext';
import PersonalDetailsModal from './components/PersonalDetailsModal';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientInfo from './pages/PatientInfo';
import AddData from './pages/AddData';
import ViewData from './pages/ViewData';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import About from './pages/About';
import Contact from './pages/Contact';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';

// Dashboard Features
import MedicalSlips from './pages/MedicalSlips';
import TabletsInfo from './pages/TabletsInfo';
import MedicalDiseases from './pages/MedicalDiseases';
import DietPlan from './pages/DietPlan';
import TabletAlarm from './pages/TabletAlarm';
import DrinkingWater from './pages/DrinkingWater';
import Yoga from './pages/Yoga';
import DietTimetable from './pages/DietTimetable';
import CalendarView from './pages/CalendarView';
import Consultation from './pages/Consultation';
import SettingsPage from './pages/Settings';
import TemperatureMonitor from './pages/TemperatureMonitor';

// Global Alarm Manager
import AlarmManager from './components/AlarmManager';
import NotificationPrompt from './components/NotificationPrompt';

// ─────────────────────────────────────────────────────────────────────────────
// Inner app shell — knows about routes and auth state
// ─────────────────────────────────────────────────────────────────────────────
function AppShell({ theme, toggleTheme }) {
  const { currentUser, userProfile, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  // ── Sleep Mode State ──────────────────────────────────────────────────────
  const [isSleepActive, setIsSleepActive] = useState(() => {
    return localStorage.getItem('medivault_sleep_active') === 'true';
  });
  const [sleepStartTime, setSleepStartTime] = useState(() => {
    const saved = localStorage.getItem('medivault_sleep_start');
    return saved ? parseInt(saved, 10) : null;
  });
  const [sleepElapsedTime, setSleepElapsedTime] = useState('');

  useEffect(() => {
    let timer;
    if (isSleepActive && sleepStartTime) {
      const updateTimer = () => {
        const diffMs = Date.now() - sleepStartTime;
        const totalSecs = Math.floor(diffMs / 1000);
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        setSleepElapsedTime(
          `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`
        );
      };
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    } else {
      setSleepElapsedTime('');
    }
    return () => clearInterval(timer);
  }, [isSleepActive, sleepStartTime]);

  useEffect(() => {
    const handleToggle = () => toggleSleepMode();
    window.addEventListener('medivault_toggle_sleep', handleToggle);
    return () => window.removeEventListener('medivault_toggle_sleep', handleToggle);
  }, [isSleepActive, sleepStartTime]); // Re-register when state changes to capture latest toggleSleepMode function

  // Helper: send a message to the active Service Worker
  const sendSWMessage = (msg) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(msg);
    }
  };

  const toggleSleepMode = () => {
    if (!currentUser?.uid) return;

    if (!isSleepActive) {
      const now = Date.now();
      localStorage.setItem('medivault_sleep_active', 'true');
      localStorage.setItem('medivault_sleep_start', now.toString());
      setIsSleepActive(true);
      setSleepStartTime(now);
      window.dispatchEvent(new CustomEvent('medivault_sleep_changed'));

      // ── Sync sleep start to Service Worker for background tracking ──
      let age = 32;
      try {
        const pdRaw = localStorage.getItem(`medivault_personal_details_${currentUser.uid}`);
        if (pdRaw) {
          const pd = JSON.parse(pdRaw);
          if (pd.age) age = parseInt(pd.age, 10);
        }
      } catch (_) {}
      const sleepRange = getIdealSleepRange(age);
      sendSWMessage({
        type:    'SYNC_SLEEP_START',
        payload: { startTime: now, targetHours: sleepRange.avg },
      });
    } else {
      if (!sleepStartTime) return;
      const durationMs = Date.now() - sleepStartTime;
      const hoursSlept = durationMs / (1000 * 60 * 60);

      let age = 32;
      try {
        const pdRaw = localStorage.getItem(`medivault_personal_details_${currentUser.uid}`);
        if (pdRaw) {
          const pd = JSON.parse(pdRaw);
          if (pd.age) age = parseInt(pd.age, 10);
        }
      } catch (_) {}

      const sleepRange = getIdealSleepRange(age);
      const idealAvg = sleepRange.avg;
      const pct = Math.min(100, Math.round((hoursSlept / idealAvg) * 100));

      const todayKey = new Date().toLocaleDateString('en-CA');
      try {
        const sleepStore = JSON.parse(localStorage.getItem('medivault_sleep_store') || '{}');
        if (!sleepStore[todayKey]) {
          sleepStore[todayKey] = { hours: 0, pct: 0 };
        }
        sleepStore[todayKey].hours = parseFloat((sleepStore[todayKey].hours + hoursSlept).toFixed(2));
        sleepStore[todayKey].pct = Math.min(100, Math.round((sleepStore[todayKey].hours / idealAvg) * 100));
        localStorage.setItem('medivault_sleep_store', JSON.stringify(sleepStore));
      } catch (_) {}

      localStorage.removeItem('medivault_sleep_active');
      localStorage.removeItem('medivault_sleep_start');
      setIsSleepActive(false);
      setSleepStartTime(null);

      // ── Tell Service Worker sleep session is over ──
      sendSWMessage({ type: 'SYNC_SLEEP_STOP' });

      window.dispatchEvent(new CustomEvent('medivault_sleep_changed'));
      window.dispatchEvent(new CustomEvent('medivault_sleep_logged'));

      Swal.fire({
        title: 'Good Morning! 🌅',
        html: `
          <div style="font-family: 'Inter', sans-serif; text-align: center;">
            <p style="font-size: 1.1rem; color: #4b5563;">You slept for <strong>${hoursSlept.toFixed(2)} hours</strong>.</p>
            <p style="font-size: 0.9rem; color: #6b7280; margin-top: 6px;">Your Category: <strong>${sleepRange.label}</strong></p>
            <p style="font-size: 0.9rem; color: #6b7280; margin-top: 2px;">Ideal Target: <strong>${sleepRange.min}-${sleepRange.max} hours</strong></p>
            <div style="margin-top: 1.5rem; background: #e0e7ff; border-radius: 12px; padding: 14px; border: 1px solid #c7d2fe;">
              <span style="font-size: 1.4rem; font-weight: 800; color: #4f46e5;">${pct}%</span>
              <p style="font-size: 0.8rem; color: #6366f1; margin: 4px 0 0 0; font-weight: 600;">Daily Sleep Goal Achieved!</p>
            </div>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Sweet Dreams!',
        confirmButtonColor: '#4f46e5',
      });
    }
  };

  // ── Personal Details Modal state ──────────────────────────────────────────
  const [showPersonalModal, setShowPersonalModal] = useState(false);

  // Build a legacy-compatible "user" object from Firebase user for existing components
  const user = currentUser ? {
    id: currentUser.uid,
    uid: currentUser.uid,
    username: userProfile?.username || currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
    displayName: userProfile?.displayName || currentUser.displayName || 'User',
    email: currentUser.email,
    role: userProfile?.role || 'user',
  } : null;

  // Start/stop Firestore sync when auth state changes
  useEffect(() => {
    if (currentUser?.uid) {
      initFirebaseSync(currentUser.uid);
    } else {
      stopFirebaseSync();
    }
  }, [currentUser]);

  // ── Show personal details modal if not yet saved for this user ────────────
  useEffect(() => {
    if (currentUser?.uid) {
      const saved = localStorage.getItem(`medivault_personal_details_${currentUser.uid}`);
      if (!saved) {
        // Small delay so dashboard renders first
        const t = setTimeout(() => setShowPersonalModal(true), 500);
        return () => clearTimeout(t);
      } else {
        setShowPersonalModal(false);
      }
    } else {
      setShowPersonalModal(false);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await stopFirebaseSync();
    clearLocalAppData(); // Remove all app keys from localStorage for privacy
    await logout();
  };

  // Routes that use the sidebar layout
  const sidebarRoutes = [
    '/dashboard', '/patient-info', '/view-data', '/add-data',
    '/medical-slips', '/tablets-info', '/medical-diseases',
    '/diet-plan', '/tablet-alarm', '/drinking-water',
    '/yoga', '/diet-timetable', '/calendar-view', '/consultation', '/settings', '/temperature'
  ];
  const useSidebar = isAuthenticated && sidebarRoutes.some(r => location.pathname.startsWith(r));

  // ── Sidebar layout (authenticated app) ──────────────────────────────────
  if (useSidebar) {
    return (
      <div className="app-layout">
        <Sidebar 
          user={user} 
          onLogout={handleLogout} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          isSleepActive={isSleepActive} 
          toggleSleepMode={toggleSleepMode} 
        />
        <div className="app-shell">
          {/* Floating Sleep Mode Banner */}
          {isSleepActive && (
            <div className="sleep-banner" style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
              color: 'white',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 9999,
              borderBottom: '2px solid #6366f1',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              gap: '1rem',
              flexWrap: 'wrap',
              fontFamily: "'Inter', sans-serif"
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="sleep-banner-icon-wrap" style={{
                  background: 'rgba(99, 102, 241, 0.25)',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(99, 102, 241, 0.4)'
                }}>
                  <Moon size={18} className="animate-bounce" style={{ color: '#a5b4fc' }} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: '#e0e7ff' }}>Sleep Mode Active 💤</strong>
                  <span style={{ fontSize: '0.75rem', color: '#c7d2fe', opacity: 0.85 }}>Your sleep is being tracked. You can close this website.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'monospace', color: '#c7d2fe', letterSpacing: '0.5px' }}>
                  {sleepElapsedTime}
                </span>
                <button
                  onClick={toggleSleepMode}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)',
                    fontSize: '0.8rem',
                    transition: 'transform 0.2s'
                  }}
                >
                  Wake Up &amp; Log
                </button>
              </div>
            </div>
          )}
        {/* Personal Details Modal — shown once after first login */}
        {showPersonalModal && currentUser?.uid && (
          <PersonalDetailsModal
            userId={currentUser.uid}
            onComplete={() => setShowPersonalModal(false)}
          />
        )}
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard user={user} /></ProtectedRoute>} />
            <Route path="/add-data" element={<ProtectedRoute><AddData user={user} /></ProtectedRoute>} />
            <Route path="/patient-info" element={<ProtectedRoute><PatientInfo user={user} /></ProtectedRoute>} />
            <Route path="/view-data" element={<ProtectedRoute><ViewData user={user} /></ProtectedRoute>} />
            <Route path="/medical-slips" element={<ProtectedRoute><MedicalSlips user={user} /></ProtectedRoute>} />
            <Route path="/tablets-info" element={<ProtectedRoute><TabletsInfo user={user} /></ProtectedRoute>} />
            <Route path="/medical-diseases" element={<ProtectedRoute><MedicalDiseases user={user} /></ProtectedRoute>} />
            <Route path="/diet-plan" element={<ProtectedRoute><DietPlan user={user} /></ProtectedRoute>} />
            <Route path="/tablet-alarm" element={<ProtectedRoute><TabletAlarm user={user} /></ProtectedRoute>} />
            <Route path="/drinking-water" element={<ProtectedRoute><DrinkingWater user={user} /></ProtectedRoute>} />
            <Route path="/yoga" element={<ProtectedRoute><Yoga user={user} /></ProtectedRoute>} />
            <Route path="/diet-timetable" element={<ProtectedRoute><DietTimetable user={user} /></ProtectedRoute>} />
            <Route path="/calendar-view" element={<ProtectedRoute><CalendarView user={user} /></ProtectedRoute>} />
            <Route path="/consultation" element={<ProtectedRoute><Consultation user={user} /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage user={user} theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} /></ProtectedRoute>} />
            <Route path="/temperature" element={<ProtectedRoute><TemperatureMonitor user={user} /></ProtectedRoute>} />
          </Routes>
        </div>
        <AlarmManager />
        <NotificationPrompt userId={user?.uid} />
      </div>
    );
  }

  // ── Public layout (login, landing, info pages) ───────────────────────────
  return (
    <div className="page-wrapper">
      <Navbar user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          {/* Catch-all */}
          <Route path="*" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        </Routes>
      </main>
      <Footer />
      {isAuthenticated && <AlarmManager />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root App component
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('medivault_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('medivault_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <AppShell theme={theme} toggleTheme={toggleTheme} />
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
