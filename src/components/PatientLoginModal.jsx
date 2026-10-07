import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, X, AlertCircle, LayoutDashboard, User, Stethoscope } from 'lucide-react';
import { getShortPatientId, findUserByIdentifier, verifyPassword, getUsers } from '../utils/localAuth';
import './PatientLoginModal.css';

export default function PatientLoginModal({ isOpen, onClose, onSuccess, user }) {
  const navigate = useNavigate();
  const [patientIdInput, setPatientIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredPatients, setRegisteredPatients] = useState([]);

  // Fetch registered patients for quick chips
  useEffect(() => {
    try {
      const allUsers = getUsers();
      const patients = allUsers.filter(
        u => u.role !== 'doctor' &&
             !(u.username && u.username.toLowerCase().startsWith('dr')) &&
             !(u.displayName && u.displayName.toLowerCase().startsWith('dr'))
      );
      setRegisteredPatients(patients);

      // Pre-fill default suggested patient ID
      const savedUid = sessionStorage.getItem('consult_active_patient_uid') || localStorage.getItem('consult_active_patient_uid');
      if (savedUid) {
        const found = allUsers.find(u => (u.uid || u.id) === savedUid);
        if (found) {
          setPatientIdInput(`#MV-${getShortPatientId(found.uid || found.id)}`);
          return;
        }
      }

      if (patients.length > 0) {
        setPatientIdInput(`#MV-${getShortPatientId(patients[0].uid || patients[0].id)}`);
      } else if (user?.id) {
        setPatientIdInput(`#MV-${getShortPatientId(user.id)}`);
      }
    } catch (_) {}
  }, [user, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const suggestedPatientId = (() => {
    if (patientIdInput) return patientIdInput;
    if (registeredPatients.length > 0) return `#MV-${getShortPatientId(registeredPatients[0].uid || registeredPatients[0].id)}`;
    if (user?.id) return `#MV-${getShortPatientId(user.id)}`;
    return '#MV-9825F0';
  })();

  const executeLogin = async (targetDestination = 'dashboard') => {
    setLoginError('');
    const inputVal = patientIdInput.trim();
    if (!inputVal) {
      setLoginError('Please enter a valid Patient ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const allUsers = getUsers();
      const cleanInput = inputVal.replace(/^#?MV[-_]?/i, '').toUpperCase();

      let matched = findUserByIdentifier(inputVal);
      if (!matched && cleanInput) {
        matched = allUsers.find(u => {
          const sId = getShortPatientId(u.uid || u.id);
          return sId.toUpperCase() === cleanInput;
        });
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

      // Check password if provided
      if (password && password !== '••••••••' && matched.passwordHash && matched.salt) {
        try {
          const ok = await verifyPassword(password, matched.salt, matched.passwordHash);
          if (!ok) {
            setLoginError('Incorrect password for this Patient ID.');
            setIsSubmitting(false);
            return;
          }
        } catch (_) {}
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

      // Save to session & local storage
      try {
        sessionStorage.setItem('consult_active_patient_uid', targetUid);
        localStorage.setItem('consult_active_patient_uid', targetUid);
        localStorage.setItem('medivault_active_patient_id', targetUid);
        window.dispatchEvent(new CustomEvent('medivault_active_patient_changed', {
          detail: { uid: targetUid, profile: pProfile }
        }));
      } catch (_) {}

      if (onSuccess) {
        onSuccess(pProfile, targetDestination);
      }

      onClose();

      // Navigate to destination
      if (targetDestination === 'dashboard') {
        navigate('/dashboard');
      } else if (targetDestination === 'patient-info') {
        navigate('/patient-info');
      } else if (targetDestination === 'consultation') {
        navigate('/consultation');
      }
    } catch (err) {
      setLoginError('Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="patient-login-modal-overlay" onClick={onClose}>
      <div className="patient-login-modal-dialog" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          type="button"
          className="patient-login-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Circular Shield Badge */}
        <div className="patient-login-shield-badge">
          <Shield size={40} color="#ffffff" strokeWidth={1.8} />
        </div>

        {/* Heading & Subtitle */}
        <h3 className="patient-login-title">
          Patient Login
        </h3>
        <p className="patient-login-subtitle">
          Login with your Patient ID (as shown on your Dashboard) to view your consultation health data.
        </p>

        {/* Auto-fill dashed box (Matches Image 2) */}
        <div className="patient-login-autofill-box">
          <div className="patient-login-autofill-text">
            <Shield size={16} color="#059669" />
            <span>
              Dashboard ID: <strong>{suggestedPatientId}</strong>
            </span>
          </div>
          <button
            type="button"
            className="patient-login-autofill-btn"
            onClick={() => {
              setPatientIdInput(suggestedPatientId);
              if (!password) setPassword('••••••••');
            }}
          >
            AUTO-FILL
          </button>
        </div>

        {/* Quick select registered patient chips */}
        {registeredPatients.length > 0 && (
          <div className="patient-login-chips-section">
            <div className="patient-login-chips-label">
              Select Registered Patient:
            </div>
            <div className="patient-login-chips-list">
              {registeredPatients.slice(0, 4).map((p) => {
                const sId = `#MV-${getShortPatientId(p.uid || p.id)}`;
                const isSelected = patientIdInput === sId;
                return (
                  <button
                    key={p.uid || p.id}
                    type="button"
                    className={`patient-login-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setPatientIdInput(sId);
                      setPassword('••••••••');
                    }}
                  >
                    <Shield size={11} /> {p.displayName || p.username} ({sId})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error notice */}
        {loginError && (
          <div className="patient-login-error">
            <AlertCircle size={15} />
            <span>{loginError}</span>
          </div>
        )}

        {/* Inputs Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeLogin('dashboard');
          }}
          className="patient-login-form"
        >
          <div className="patient-login-field">
            <label>Patient ID</label>
            <input
              type="text"
              value={patientIdInput}
              onChange={(e) => setPatientIdInput(e.target.value)}
              placeholder={suggestedPatientId}
              required
            />
          </div>

          <div className="patient-login-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••"
            />
          </div>

          {/* Destination Action Buttons */}
          <div className="patient-login-actions">
            <button
              type="button"
              className="patient-login-submit-btn btn-dashboard"
              disabled={isSubmitting}
              onClick={() => executeLogin('dashboard')}
            >
              <LayoutDashboard size={17} />
              <span>Login to Patient Dashboard</span>
            </button>

            <button
              type="button"
              className="patient-login-submit-btn btn-details"
              disabled={isSubmitting}
              onClick={() => executeLogin('patient-info')}
            >
              <User size={17} />
              <span>Login to Patient Details</span>
            </button>

            <button
              type="button"
              className="patient-login-submit-btn btn-consult"
              disabled={isSubmitting}
              onClick={() => executeLogin('consultation')}
            >
              <Stethoscope size={17} />
              <span>Login to Patient Consultation</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
