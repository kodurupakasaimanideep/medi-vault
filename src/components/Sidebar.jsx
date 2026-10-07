import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, FileText, Pill, Dumbbell, Utensils,
  Bell, Droplets, Brain, Calendar, LogOut, Activity, Plus,
  UtensilsCrossed, Moon, Sun, Menu, X, ChevronRight, Settings, Thermometer
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getShortPatientId, formatHumanDisplayName } from '../utils/localAuth';

/* ─── Shared avatar URL helper ────────────────────────────────────── */
function resolveAvatarUrl(userId) {
  const piRaw = localStorage.getItem(`medivault_patient_info_${userId}`);
  const pdRaw = localStorage.getItem(`medivault_personal_details_${userId}`);
  const pi    = piRaw ? JSON.parse(piRaw) : null;
  const pd    = pdRaw ? JSON.parse(pdRaw) : null;
  const age      = parseInt(pi?.age || pd?.age || '32', 10);
  const gender   = pd?.gender || pi?.sex || ''; // personal_details gender wins
  const isFemale = gender === 'Female';
  if (age < 12)  return isFemale ? '/avatars/child_girl.png'  : '/avatars/child_boy.png';
  if (age < 18)  return isFemale ? '/avatars/teen_girl.png'   : '/avatars/teen_boy.png';
  return               isFemale ? '/avatars/adult_woman.png' : '/avatars/adult_man.png';
}

export default function Sidebar({ user, onLogout, theme, toggleTheme, isSleepActive, toggleSleepMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  // ── Reactive avatar: re-read from localStorage whenever user changes ────
  const [avatarUrl, setAvatarUrl] = useState('/avatars/adult_man.png');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    const refresh = () => {
      setAvatarUrl(resolveAvatarUrl(user.id));
      // Display name: prefer personal details firstName+lastName, fall back to formatHumanDisplayName
      const pdRaw = localStorage.getItem(`medivault_personal_details_${user.id}`);
      const pd = pdRaw ? JSON.parse(pdRaw) : null;
      if (pd?.fullName) {
        setDisplayName(pd.fullName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      } else if (pd?.firstName) {
        const full = `${pd.firstName} ${pd.lastName || ''}`.trim();
        setDisplayName(full.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      } else {
        setDisplayName(formatHumanDisplayName(user));
      }
    };

    // Live avatar preview (gender click before save)
    const preview = (e) => {
      const { gender, age } = e.detail || {};
      const ageNum   = parseInt(age || '32', 10);
      const isFemale = gender === 'Female';
      let url;
      if (ageNum < 12)  url = isFemale ? '/avatars/child_girl.png'  : '/avatars/child_boy.png';
      else if (ageNum < 18) url = isFemale ? '/avatars/teen_girl.png'   : '/avatars/teen_boy.png';
      else              url = isFemale ? '/avatars/adult_woman.png' : '/avatars/adult_man.png';
      setAvatarUrl(url);
    };

    refresh();
    // Listen for storage changes (cross-tab) AND in-app profile updates (same tab)
    window.addEventListener('storage', refresh);
    window.addEventListener('mv_profile_updated', refresh);
    // Live preview — gender click in modal or PatientInfo before hitting Save
    window.addEventListener('mv_avatar_preview', preview);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('mv_profile_updated', refresh);
      window.removeEventListener('mv_avatar_preview', preview);
    };
  }, [user]);

  // Nav items — labels are translated via t()
  const navItems = [
    { labelKey: 'dashboard',     path: '/dashboard',        icon: LayoutDashboard },
    { labelKey: 'patientInfo',   path: '/patient-info',     icon: User },
    { labelKey: 'medicalSlips',  path: '/medical-slips',    icon: FileText },
    { labelKey: 'tabletsInfo',   path: '/tablets-info',     icon: Pill },
    { labelKey: 'dietPlan',      path: '/diet-plan',        icon: Utensils },
    { labelKey: 'tabletAlarm',   path: '/tablet-alarm',     icon: Bell },
    { labelKey: 'drinkingWater', path: '/drinking-water',   icon: Droplets },
    { labelKey: 'yoga',          path: '/yoga',             icon: Brain },
    { labelKey: 'dietTimetable', path: '/diet-timetable',   icon: UtensilsCrossed },
    { labelKey: 'calendarView',  path: '/calendar-view',    icon: Calendar },
    { labelKey: 'temperature',   path: '/temperature',      icon: Thermometer },
    { labelKey: 'settings',      path: '/settings',         icon: Settings },
  ];

  const mobileBottomItems = [
    { labelKey: 'dashboard',    path: '/dashboard',     icon: LayoutDashboard },
    { labelKey: 'patientInfo',  path: '/patient-info',  icon: User },
    { labelKey: 'tabletAlarm',  path: '/tablet-alarm',  icon: Bell },
    { labelKey: 'drinkingWater',path: '/drinking-water',icon: Droplets },
    { labelKey: 'calendarView', path: '/calendar-view', icon: Calendar },
  ];

  // Fallback labels for keys not in translation dict
  const fallback = {
    patientInfo: 'Patient Info',
    diseaseExercise: 'Diseases Exercise',
    dietTimetable: 'User Diet',
    calendarView: 'Health Calendar',
    temperature: 'Temperature Alert',
  };
  const label = (key) => t(key) !== key ? t(key) : (fallback[key] || key);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    try {
      await onLogout();
    } catch (_) {/* ignore */}
    navigate('/login');
  };

  const isDoctor = Boolean(
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

  const SidebarContent = ({ isMobile = false }) => (
    <>
      {/* Logo */}
      <div className="sidebar-logo" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
          <div className="sidebar-logo-icon">
            <Activity size={20} color="white" />
          </div>
          <span className="sidebar-logo-text" style={{ fontSize: '1.25rem' }}>Medi vault</span>
          {isMobile && (
            <button
              className="sidebar-mobile-close-btn"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '2.5rem', fontStyle: 'italic' }}>
          Made by Saimanideep
        </div>
      </div>

      {/* Patient Card */}
      {user && (
        <div className="sidebar-patient-card">
          {/* Avatar with gender/age-based image */}
          <div className="sidebar-patient-avatar-img-wrap">
            <img
              src={avatarUrl}
              alt="User Avatar"
              className="sidebar-patient-avatar-img"
            />
            <span className="sidebar-patient-online-dot" />
          </div>
          <div className="sidebar-patient-info">
            <div className="sidebar-patient-name" title={displayName || user.username}>{displayName || user.username}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <div className="sidebar-patient-id" title={user.id ? `Full ID: ${user.id}` : undefined}>#MV-{getShortPatientId(user.id)}</div>
              <div className={`sidebar-patient-badge ${isDoctor ? 'sidebar-patient-badge--doctor' : ''}`}>
                {isDoctor ? 'DOCTOR' : 'ACTIVE'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(({ labelKey, path, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`sidebar-nav-item ${active ? 'sidebar-nav-item--active' : ''}`}
            >
              <Icon size={18} className="sidebar-nav-icon" />
              <span>{label(labelKey)}</span>
              {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-doctor-card">
          <div className="sidebar-doctor-avatar">
            <User size={16} color="white" />
          </div>
          <div>
            <div className="sidebar-doctor-name">
              {isDoctor ? (displayName || user?.displayName || 'Dr. ' + (user?.username || 'Doctor')) : 'Dr. Sterling'}
            </div>
            <div className="sidebar-doctor-role">
              {isDoctor ? 'Consulting Doctor' : 'Cardiology Specialist'}
            </div>
          </div>
        </div>

        <button className="sidebar-theme-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span>{theme === 'dark' ? t('lightMode') || 'Light Mode' : t('darkMode')}</span>
        </button>
        <button className="sidebar-consult-btn" onClick={() => navigate('/consultation')}>
          <Plus size={14} /> {isDoctor ? (t('patientConsultation') || 'Patient Consultation') : t('consultation')}
        </button>
        <button className="sidebar-signout-btn" onClick={handleLogout}>
          <LogOut size={14} /> {t('logout')}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="sidebar sidebar--desktop">
        <SidebarContent />
      </aside>

      {/* ── MOBILE: Top Header Bar ── */}
      <div className="sidebar-mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="sidebar-logo-icon" style={{ width: '28px', height: '28px' }}>
            <Activity size={16} color="white" />
          </div>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>Medi vault</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

          <button className="sidebar-theme-toggle-mobile" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="sidebar-hamburger-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* ── MOBILE: Slide-in Drawer ── */}
      {mobileOpen && (
        <div
          className="sidebar-drawer-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu overlay"
        />
      )}
      <aside className={`sidebar sidebar--mobile-drawer ${mobileOpen ? 'sidebar--mobile-drawer-open' : ''}`}>
        <SidebarContent isMobile />
      </aside>

      {/* ── MOBILE: Bottom Navigation Bar ── */}
      <nav className="sidebar-mobile-bottomnav">
        {mobileBottomItems.map(({ labelKey, path, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`mobile-bottomnav-item ${active ? 'mobile-bottomnav-item--active' : ''}`}
            >
              <Icon size={20} />
              <span>{label(labelKey)}</span>
            </Link>
          );
        })}
        {/* "More" button opens the full drawer */}
        <button
          className="mobile-bottomnav-item mobile-bottomnav-more"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
