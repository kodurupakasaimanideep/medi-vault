import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, X, Check } from 'lucide-react';
import { requestNotificationPermission, getAndRegisterFCMToken } from '../services/notificationManager';

export default function NotificationPrompt({ userId }) {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState('prompt'); // 'prompt' | 'registering' | 'success' | 'failed'

  useEffect(() => {
    // Only show if browser supports notifications & permission is still 'default' (unasked)
    if ('Notification' in window) {
      if (Notification.permission === 'default' && userId) {
        // Show after a brief delay so they are not instantly spammed
        const timer = setTimeout(() => {
          setVisible(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [userId]);

  const handleGrant = async () => {
    setStatus('registering');
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        const token = await getAndRegisterFCMToken(userId);
        if (token) {
          setStatus('success');
          // Hide after 3 seconds on success
          setTimeout(() => {
            setVisible(false);
          }, 3000);
        } else {
          setStatus('failed');
        }
      } else {
        setStatus('failed');
      }
    } catch (err) {
      console.error(err);
      setStatus('failed');
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    // Remember dismiss in session storage so it doesn't show up again in this session
    sessionStorage.setItem('medivault_notif_prompt_dismissed', 'true');
  };

  // If already dismissed in this session, do not show
  if (sessionStorage.getItem('medivault_notif_prompt_dismissed') === 'true') {
    return null;
  }

  if (!visible) return null;

  return (
    <div style={styles.floatingPrompt}>
      <button onClick={handleDismiss} style={styles.closeBtn}>
        <X size={15} />
      </button>

      <div style={styles.promptHeader}>
        <div style={styles.bellIconGlow}>
          <Bell size={20} color="white" />
        </div>
        <div style={styles.promptText}>
          <h4 style={styles.title}>Enable Vitals & Pill Reminders</h4>
          <p style={styles.desc}>
            Get push notifications for medicine schedules, water targets, and microclimate updates, even when MediVault is closed!
          </p>
        </div>
      </div>

      <div style={styles.actionRow}>
        {status === 'prompt' && (
          <button onClick={handleGrant} style={styles.grantBtn}>
            <Bell size={14} style={{ marginRight: 6 }} /> Enable Alerts
          </button>
        )}
        {status === 'registering' && (
          <button disabled style={styles.disabledBtn}>
            <span style={styles.spinner} /> Registering FCM...
          </button>
        )}
        {status === 'success' && (
          <div style={styles.successBadge}>
            <Check size={14} style={{ marginRight: 4 }} /> Notifications Registered!
          </div>
        )}
        {status === 'failed' && (
          <div style={styles.failedBadge}>
            <ShieldAlert size={14} style={{ marginRight: 4 }} /> Configuration Failed
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  floatingPrompt: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    zIndex: 10000,
    width: '360px',
    padding: '1.25rem',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(79, 70, 229, 0.2)',
    boxShadow: '0 12px 40px rgba(79, 70, 229, 0.15), 0 4px 12px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    animation: 'slideUpPrompt 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Inter', sans-serif"
  },
  closeBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  promptHeader: {
    display: 'flex',
    gap: '0.85rem',
    alignItems: 'flex-start'
  },
  bellIconGlow: {
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    padding: '10px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
    animation: 'pulseGlow 2s infinite'
  },
  promptText: {
    flex: 1,
    paddingRight: '12px'
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '0.95rem',
    fontWeight: '800',
    color: '#1e1b4b'
  },
  desc: {
    margin: 0,
    fontSize: '0.8rem',
    lineHeight: '1.4',
    color: '#64748b',
    fontWeight: '500'
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%'
  },
  grantBtn: {
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: 'white',
    border: 'none',
    padding: '0.65rem 1.25rem',
    borderRadius: '10px',
    fontSize: '0.82rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    alignItems: 'center'
  },
  disabledBtn: {
    background: '#e2e8f0',
    color: '#94a3b8',
    border: 'none',
    padding: '0.65rem 1.25rem',
    borderRadius: '10px',
    fontSize: '0.82rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  successBadge: {
    background: '#d1fae5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    padding: '0.55rem 1.1rem',
    borderRadius: '10px',
    fontSize: '0.8rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center'
  },
  failedBadge: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
    padding: '0.55rem 1.1rem',
    borderRadius: '10px',
    fontSize: '0.8rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center'
  },
  spinner: {
    width: '12px',
    height: '12px',
    border: '2px solid #94a3b8',
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block'
  }
};

// CSS Injection for Keyframes
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes slideUpPrompt {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes pulseGlow {
    0%, 100% { boxShadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
    50% { boxShadow: 0 4px 20px rgba(79, 70, 229, 0.6); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
