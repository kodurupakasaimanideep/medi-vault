import { useState, useEffect } from 'react';
import { Bell, Settings, Search, Clock, Moon, Sun, Pill } from 'lucide-react';

export default function TopHeader({ theme, toggleTheme, user }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <header className="dash-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0, zIndex: 100, gap: '2rem' }}>
      
      {/* Search Bar section */}
      <div className="dash-search" style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
        <Search size={16} className="dash-search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          className="dash-search-input" 
          placeholder="Search records, symptoms, or help..." 
          style={{ width: '100%', padding: '9px 14px 9px 38px', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.82rem', color: 'var(--text-main)', background: 'var(--bg-color)', outline: 'none' }}
        />
      </div>

      {/* Center Section: Medical Tablet Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          background: theme === 'light' ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
          padding: '4px 18px',
          borderRadius: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: theme === 'light' ? '2px solid #10b981' : '2px solid #34d399',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle heartbeat line effect background could go here if needed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Clock size={16} color={theme === 'light' ? '#059669' : '#34d399'} className="animate-pulse" />
             <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '1.1rem', fontWeight: '800', color: theme === 'light' ? '#065f46' : '#ecfdf5', fontFamily: "'Monospace', sans-serif", letterSpacing: '0.5px' }}>
                 {formatTime(time)}
               </span>
               <span style={{ fontSize: '0.6rem', fontWeight: '700', color: theme === 'light' ? '#059669' : '#a7f3d0', textTransform: 'uppercase', marginTop: '-3px' }}>
                 {formatDate(time)}
               </span>
             </div>
          </div>
          <div style={{ width: '1px', height: '20px', background: theme === 'light' ? '#10b98144' : '#34d39944' }}></div>
          <div style={{ background: '#10b981', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pill size={12} color="white" />
          </div>
        </div>
      </div>

      {/* Right Section: Theme + User */}
      <div className="dash-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme} 
          className="dash-icon-btn" 
          style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', transition: 'all 0.2s', position: 'relative' }}
          onMouseOver={e=>e.currentTarget.style.borderColor='var(--primary)'}
          onMouseOut={e=>e.currentTarget.style.borderColor='var(--border)'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button className="dash-icon-btn" style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <Bell size={18} />
        </button>

        <div className="dash-topbar-user" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border)' }}>
          <div className="dash-topbar-user-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {(() => {
              const data = localStorage.getItem(`medivault_patient_info_${user?.id}`);
              const pData = data ? JSON.parse(data) : null;
              const age = pData?.age ? parseInt(pData.age) : 32;
              const isFemale = pData?.sex === 'Female';
              let url = '';
              if (age < 12) url = isFemale ? '/avatars/child_girl.png' : '/avatars/child_boy.png';
              else if (age < 18) url = isFemale ? '/avatars/teen_girl.png' : '/avatars/teen_boy.png';
              else url = isFemale ? '/avatars/adult_woman.png' : '/avatars/adult_man.png';
              return <img src={url} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
            })()}
          </div>
          <div style={{ display: 'none', md: 'block' }}>
            <div className="dash-topbar-user-name" style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>{user?.username || 'Patient'}</div>
            <div className="dash-topbar-user-role" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600' }}>Patient Profile</div>
          </div>
        </div>
      </div>
    </header>
  );
}
